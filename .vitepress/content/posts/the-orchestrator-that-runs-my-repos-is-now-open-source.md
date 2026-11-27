---
date: "2026-11-29T09:00:00.000-08:00"
tags: ["ai", "agents", "claude-code", "open-source"]
draft: false
title: "The Orchestrator That Runs My Repos Is Now Open Source"
image: "/images/posts/the-orchestrator-that-runs-my-repos-is-now-open-source.jpg"
topic: "ai"
description: "The Claude Code orchestrator that maintains my repos is public. What is in it, how to read it, and what its safety model does and does not cover."
---

Since June, an unattended Claude Code orchestrator has done most of the maintenance on my repositories. Five times a day it reads issues and pull requests across nine repos, hands each task to a subagent that clones, fixes, tests, and gets reviewed, and asks for my review only once CI is green. I merge. It does everything up to that point.

The code is now public at [neonpixels-studio/agents](https://github.com/neonpixels-studio/agents), MIT licensed. On Tuesday I start a nine-part series on what five months of running it taught me. This post is a map of the repo itself: what's in it, where to start reading, and what it doesn't protect you from.

It's a working reference, not a product. It runs my real projects, it assumes macOS, and it's opinionated about the stack it targets. Workers run on Sonnet, while the orchestrator and the reviewer stay on Opus.

## The program is a markdown file

The most important file is `CLAUDE.md`. It's 544 lines, and it _is_ the program: the task queue and its priority order, the prompt templates every worker receives, retry limits, the CI-green review gate, and the end-to-end test procedure. A sub-spec, `docs/improvement-scan.md`, holds another 353 lines that the orchestrator reads only when it needs them, which keeps the main spec small enough to stay sharp.

Around it, `run.sh` is 182 lines of shell, and the rest is small: a `jq` filter, a bash gate, a config validator, and a `launchd` template. Almost all the behavior lives in prose.

That has consequences you wouldn't expect. Prettier is configured to skip markdown in this repo, because it re-fences the nested code blocks inside the prompt templates. That would change what the workers actually receive. When the program is prose, reformatting it is a behavior change.

## Tests for a program written in prose

You can't unit-test a paragraph, but you can test the parts of it that matter. Three kinds of tests do most of the work.

**The trust boundary.** The comment filter is tested directly against fixture comments from owners, members, strangers, first-time contributors, and bots. The more interesting part: the test pulls the exact `jq` pipelines that `CLAUDE.md` tells the orchestrator to run out of the markdown with a regex, then runs them against those fixtures.

```js
// The jq half of each pipeline the spec tells the orchestrator to run, captured
// verbatim (quoting and config lookups included) so editing the spec is tested.
const REVIEW_FEEDBACK_PIPELINE =
  /done \| (jq -s [\s\S]*?-f filters\/trusted-comments\.jq)/;
```

If someone weakens the filter in the prose, even by accident, CI fails.

**Spec hygiene.** No GitHub logins, Sentry org, or machine paths may appear anywhere outside `agents.config.json`. Every cross-reference like "(see Untrusted Input)" has to point at a heading that actually exists. A model following a reference to a section that was renamed months ago will improvise, and that's not where you want it improvising.

**The shell.** `run.sh` runs in a sandbox with stubbed `claude` and `direnv` binaries, which checks lock handling, the config guard, and the detection of failures that exit quietly.

## Start reading at run.sh

If you only read one file, read the comments in `run.sh`. Every one of them is there because something broke.

Headless `claude -p` kills background subagents once a wait ceiling is reached, and the default is 10 minutes. A clone, test, review, and PR cycle takes much longer, so workers were dying before they opened their PRs. The script raises the ceiling to 90 minutes. The comment explains why that number is safe: it's well inside the shortest gap between scheduled runs (21:05 to 01:05), so a stuck run ends on its own before the next one starts and never holds the lock across two slots.

Other failures hide better, so they're detected by message:

```bash
# The background-task termination still exits 0, so it must be detected by
# message, not exit code.
if grep -q "Background tasks still running" "$RUN_ERR_FILE"; then
```

The auth check right below it is gated on a non-zero exit code, because a perfectly healthy run once printed `run.sh` into its own log and tripped the string match. A session-limit rejection gets logged as a rate limit rather than a crash, so it stops looking like an outage.

## The safety model, including what it doesn't cover

The orchestrator and its workers run with `--dangerously-skip-permissions` and a token that can push workflow files. That's a deliberate tradeoff for a box nobody is watching, and it makes untrusted text the main risk. The controls are in the README and in the spec:

- Every PR comment goes through one committed filter that keeps only owners, members, and collaborators. No bots are trusted by default, because a bot that answers mentions repeats whatever a stranger asked it to say.
- Work that starts from untrusted input, like end-user feedback, Sentry errors, or an outside author's issue, is committed by the worker but pushed by the orchestrator, and only after `check-protected-paths.sh` confirms it leaves `.github/`, `.husky/`, env files, `package.json`, lockfiles, and deploy config alone.
- The feedback classifier gets read-only tools in a throwaway clone.
- The box never holds production credentials, and every e2e run gets a throwaway Neon database branch.

The README is also explicit about the limit. These controls stop a worker that has been _misled_. They don't stop one that has been _hijacked_, because every worker runs as the same OS user, and anything that user can read, a hijacked worker can read. The practical consequence: don't stay logged in to `gh` as the human reviewer on that machine. I was, for months. The last part of the series covers that.

## Running your own

Everything installation-specific is in `agents.config.json`: the human and agent identities, the target repos, cross-repo API contracts, the shared-packages repo, Sentry projects, and the site-scan map. The target repos need npm scripts for `lint`, `lint:ci`, and `test:ci`, a `ci` job the workers can mirror locally, dotenvx-encrypted env files, Neon for e2e databases, and issues labeled `Bug` and `P1` through `P4`. You also need a separate GitHub account for the agent.

Swapping out GitHub, dotenvx, or Neon means editing the spec, not the config. That's the honest cost of a program written in prose: a lot of its assumptions are spread through sentences.

I'd rather you read it than install it. Take the trust filter, the protected-paths gate, the run.sh failure checks, and the habit of testing your prompts' load-bearing lines. The series starting Tuesday tells the story behind most of them.
