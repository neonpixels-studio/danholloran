---
date: "2026-12-13T09:00:00.000-08:00"
tags: ["ai", "agents", "concurrency", "automation"]
draft: false
title: "Fifteen Agents, One Machine"
image: "/images/posts/fifteen-agents-one-machine.jpg"
topic: "ai"
description: "Parallel coding agents hit the same bugs threads do: shared names, shared counters, shared ports. Fifteen workers on one Mac mini taught me all three."
series: "Lessons from an agent fleet"
series_part: 5
---

The first time I let the orchestrator fire a worker at every open PR at once, the Mac mini's load average hit 56 on 10 cores. There were 46 Node processes running. End-to-end tests started failing on random specs: onboarding in one PR, pricing in another, settings in a third. No spec failed twice, and none of the failures were assertions. Every one was a timeout.

Nothing was wrong with the code. I had built a multithreaded program without noticing, and it had every classic concurrency bug. The threads just happened to be LLM agents with shell access.

## Shared names

The CLI in my fleet depends on one of my Nuxt apps, so its workers shallow-clone that app as a reference. The spec told them to clone it into `/tmp/app-reference`. That's a fixed path. With five or six CLI workers running at once, one worker's cleanup (`rm -rf app-reference`) deleted a reference clone another worker was still reading.

A worse version came from a cleanup step being too helpful. Every brief ends with "delete your local clone." One worker finished, ran `ls /tmp`, saw several directories that looked like leftovers from the same repo, and deleted all of them. They were three sibling workers' active clones. One of those siblings lost two unpushed commits. It noticed, recreated the clone, and redid the work with an extra review round. Not every worker would notice.

Fixes: name every shared path per task (`app-reference-<task-slug>`), and say it plainly in every brief: "Only delete the exact clone path given to you in this prompt. Never touch any other directory under /tmp, even ones that look like leftovers."

## Shared counters

Two workers in the same repo each needed a database migration. Each cloned `main`, saw that the highest migration was `0009`, and wrote `0010`. Each PR was correct on its own and guaranteed to conflict with the other.

The obvious fix was to have the orchestrator tell each worker to "use the lowest genuinely free number" when resolving the conflicts. Two conflict-resolution workers then looked at the same `main`, and both picked `0011`. It was the same race, one layer up.

The orchestrator now assigns numbers up front: "number YOUR migration 0011." That still leaves a subtler hazard. Four PRs got pre-assigned 0013 through 0016, all branched from a `main` at 0012. Drizzle's migrator only applies a journal entry whose timestamp is newer than the last migration it applied. If 0015 merges and migrates before 0013, then 0013 gets **silently skipped** on that database. Merge order became a hard constraint, and both PRs have to say so.

The same pattern shows up anywhere agents append to a shared list. In my metrics dashboard, every integration registers itself in one `providers/index.ts` file. Three provider PRs written in parallel all touch the same line. That isn't a worker failure, just a predictable merge-main pass after the first one lands.

## Shared ports and pipes

- **Ports.** One app's e2e script starts its dev server on a fixed port. Four workers in that repo meant `EADDRINUSE :3099`, and one PR shipped with its e2e unverified locally.
- **The network.** With nine workers cloning at once, `git clone` over HTTPS stalled for minutes with zero bytes transferred, while `curl` to the same endpoint returned in 0.3 seconds. Blobless clones (`--filter=blob:none`) helped on the big repo. I don't use them everywhere, because one repo's pre-commit hook runs tests that call git and fail on objects a blobless clone never downloaded.
- **CI queues.** One repo's e2e job uses a GitHub concurrency group to protect a free-tier database. GitHub keeps only one pending job per group, so updating four PRs at once cancelled two e2e runs seconds after they started.
- **The keychain.** Concurrent pushes contended on the macOS credential helper and stacked up hung processes.

## What actually fixed it

Everything that worked came from treating the orchestrator as a scheduler:

```text
Before dispatching a wave:
- Cap Nuxt/PGlite-heavy waves at 6-8 workers; stagger the rest.
- Assign every shared resource up front: clone paths, migration numbers, ports.
- Never tell a worker to compute "the next free X" while a sibling runs in the same repo.
- Tell each worker which other open PRs touch which files.
- Only one worker per repo runs local e2e; the others rely on CI.
- Record required merge order in the PRs themselves.
```

The cap felt like a loss at first, since 15 workers in parallel should be faster than 8. It wasn't. The 15-wide waves produced reds that each cost a rerun or a re-dispatch, and the reruns cost CI minutes I was paying for (more on that in Part 8).

If you're running more than one agent against the same repo, list everything they share: directories, counters, ports, files that everyone appends to, rate limits. Then decide who owns each one before you dispatch. Agents won't coordinate on their own. They can't see each other.
