---
date: "2026-12-07T09:00:00.000-08:00"
tags: ["ai", "agents", "ci", "debugging"]
draft: false
title: "Flake or Failure? Teaching an Agent to Read the Log First"
image: "/images/posts/flake-or-failure-teaching-an-agent-to-read-the-log-first.jpg"
topic: "ai"
description: "Two rules my agent learned about CI noise turned out to be false. Learned shortcuts decay, so reading the log before classifying has to be a hard rule."
series: "Lessons from an agent fleet"
series_part: 3
---

An agent fleet running against eight repos sees red CI all day. Most of it isn't the agent's fault: a GitHub runner can't resolve DNS, an auth provider times out, an advisory gets published overnight. So the orchestrator has to classify every red check. Is this flake noise to rerun, or a real failure to fix?

It learns shortcuts for that, and it writes them down as memory notes so the next run doesn't have to rediscover them. That's mostly good. But two of those shortcuts turned out to be wrong, and they were wrong in the most dangerous way: they told the agent to ignore something real.

## Wrong rule one: "Netlify previews always fail here"

Early on, the orchestrator noticed that Netlify deploy previews were red on almost every PR in two of my Nuxt apps. It wrote a note: these preview checks fail on every PR, they're infra, ignore them.

Then a PR reached my review with a red preview, green everything else, and a note explaining the red away. I opened the deploy log and found a genuine production build error: a relative import that works in dev and in tests but breaks the Nitro build. (Part 2 has the details.) I requested changes, the worker fixed the import, and the preview went green.

The note was rewritten with **CORRECTED** at the top. The new rule: when `deploy/netlify` is red, open the deploy log and read the actual error. It only counts as infra if the log shows a credential, config, or plugin failure with no build error. Netlify runs a full production build, and GitHub's `ci` job often doesn't, so the preview is sometimes the only check that can catch the problem.

## Wrong rule two: "Dependabot e2e failures are the secrets store"

GitHub withholds ordinary repository secrets from workflows triggered by Dependabot. Those runs only see a separate Dependabot secrets store. My e2e jobs need a Neon API key and a decryption key, so Dependabot PRs failed e2e reliably. The agent learned that signature and wrote it down. It was correct, and it even survived a symptom change: after one repo moved to dotenvx, the error changed from `Input required and not supplied: api_key` to `[DECRYPTION_FAILED] could not decrypt E2E_DATABASE_URL`. Same cause, new wording.

Then a Dependabot PR failed e2e, and the agent filed it under "secrets store" without looking further. But that particular run hadn't been triggered by Dependabot. I had pushed to the branch myself, so the normal secrets were available. The actual failure was a set of genuine 500s from three API routes, caused by a broken migration journal on fresh database branches. A PR with no dependency changes failed the same two tests at the same lines hours earlier.

The corrected rule: check the triggering event and read the failing job's log before attributing e2e red to secrets.

## Signatures that held up

Here's the other side of it. Some of the classifications that did survive five months, each with the log line that proves it:

| Symptom                                               | Log tell                                                        | Action                                            |
| ----------------------------------------------------- | --------------------------------------------------------------- | ------------------------------------------------- |
| Secret scan red on three repos at once                | `curl: (22) ... 504` on the gitleaks download, no `leaks found` | Rerun once, then leave it for the next run        |
| Every e2e job across the fleet `cancelled`            | `Temporary failure resolving 'archive.ubuntu.com'`              | Rerun one PR as a probe, then rerun the rest      |
| Lighthouse perf at 0.80 on one URL                    | Same content passed on another run                              | Rerun once                                        |
| Login e2e stuck at the auth provider's handshake page | Fails 1 in 10 runs on unmodified `main`                         | Reproduce on `main`, not another CI retry         |
| A `Dependabot` check failing on `main`                | `latest possible version that can be installed is X`            | Not CI at all, exclude it from red-main detection |
| A Sentry "production" error                           | Release SHA is `diverged` from `main`                           | A preview build, not prod                         |

Notice the Lighthouse row. Another app's scheduled Lighthouse run "regressed" to 0.69 across every page. A worker bisected it and found that `main` and the last green commit scored identically, and every run landed at either about 0.69 or about 0.90. The 0.85 threshold sat between the two modes, so passing or failing was a coin flip. Bisecting a coin flip burns a whole worker run.

## Making it a rule, not a habit

Every learned shortcut is a cached conclusion, and caches go stale. The repo changes, the provider changes, or the signature that used to mean one thing starts meaning two. So the shortcuts now sit behind a few rules that don't decay:

- **No classification without a quoted log line.** "Flake" has to cite the line that makes it a flake.
- **One rerun, then escalate.** A second identical red means sending a worker, not rerunning again. For the auth flake, which fails 3 times in 10 on some branches, two reds in a row prove nothing either way. The test is to reproduce it on an unmodified `main`.
- **Never fix a flake by hiding it.** No retries, longer timeouts, or skipped tests to make a flaky check go green.
- **Date every note and keep the evidence.** A heuristic with its source attached can be corrected. One without a source just gets repeated.

The two wrong rules cost me a few review cycles. If I hadn't been reading deploy logs myself, they would have let broken builds through, with a confident note explaining why that was fine.
