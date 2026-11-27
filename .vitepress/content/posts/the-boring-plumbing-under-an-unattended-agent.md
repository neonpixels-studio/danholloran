---
date: "2026-12-10T09:00:00.000-08:00"
tags: ["ai", "agents", "claude-code", "automation"]
draft: false
title: "The Boring Plumbing Under an Unattended Agent"
image: "/images/posts/the-boring-plumbing-under-an-unattended-agent.jpg"
topic: "ai"
description: "The worst failures in my agent fleet made no noise: auth errors in stdout, workers that died quietly, git hanging on the keychain. Here is the plumbing."
series: "Lessons from an agent fleet"
series_part: 4
---

At the end of July, the OAuth session behind my agent fleet expired. The next 34 scheduled runs in a row started, failed within about a second, and exited. Nothing alerted me, and the error log was empty.

The worst failures in an unattended system aren't the loud ones. A loud failure gets fixed the same day. The ones that hurt are silent: the error goes to a stream nobody watches, the process exits cleanly while the work is lost, or a command hangs forever without printing a thing. This post is the plumbing I built after each of those.

## Auth that fails into the wrong file

The scheduled script runs `claude -p` with `--output-format stream-json`. When the session expired, the real message, `Failed to authenticate: OAuth session expired`, landed in **stdout** as a JSON event, which goes to `agents.log`. The error log only gets stderr, and stderr only had harmless direnv chatter. I was watching the wrong file.

Two fixes. First, auth now uses a long-lived token from `claude setup-token`, exported from `.envrc`, instead of an interactive session that expires. Second, the script checks the end of the log after every run:

```bash
if tail -50 "$LOG_FILE" | grep -q authentication_failed; then
  log_error "Auth expired: run claude setup-token, update .envrc, then direnv allow"
fi
```

That guard has failed in both directions since. One run exited 0 and still logged "Auth expired," because the orchestrator had printed the script's own source during the run, and the guard matched its own string. The fix is to check the exit code before trusting the guard. Another time I swapped in a new token and every run kept failing anyway. Editing `.envrc` revokes direnv's approval, and the script loads its environment through `direnv exec`, so the new token never loaded. `direnv allow` is now part of the error message.

There was also a nested version of the problem. The worker's independent Opus review step spawns its own `claude` CLI, and that child process didn't inherit the exported token. It fell back to its own stale credentials, and reviews failed fleet-wide. The workaround was to source `.envrc` explicitly before calling the reviewer.

## Exit 0 is not success

In headless `claude -p` mode, the process ends when the turn ends. Early on, the orchestrator dispatched a worker in the background, wrote a summary saying "worker is opening a PR," and ended its turn. The process exited cleanly and the worker died with it: no branch, no PR, and an orphaned database branch the next run had to clean up.

Workers did their own version of this. One started a clone in the background, set up a monitor, and ended its turn with "I'll wait for the monitor event." Another kicked off the review step and then waited for a "completion notification" that could never arrive, because the review was an ordinary blocking bash command whose output it had already received.

The rules that fixed all three:

- Dispatch workers in the foreground. Put independent workers in the same message so they still run in parallel.
- No background tasks or monitors inside workers. Use the shell timeout instead, up to 10 minutes.
- The review is synchronous. Read its stdout when the command returns.
- A final report that says "waiting" and has no PR URL means the worker is dead. Re-dispatch it.

## Git on a headless Mac

Git caused more lost hours than any model problem.

`git push` from a worker hung forever at `git-credential-osxkeychain store`. The macOS keychain helper blocks when there's no TTY. With several workers pushing at once, stuck pushes stacked up and added seven-minute delays. It turned out `clone` hits the same hang. The global `~/.gitconfig` was a symlink into iCloud, and reads of it intermittently failed with `Operation not permitted` partway through a run.

After a few rounds of workarounds, one of which leaked tokens (that's Part 9), every worker now gets one shell function:

```bash
gitnet() {
  GIT_CONFIG_GLOBAL=/dev/null git \
    -c credential.helper= \
    -c credential.helper='!f() { echo username=x-access-token; echo "password=${GITHUB_TOKEN}"; }; f' \
    "$@"
}

gitnet clone --quiet https://github.com/OWNER/REPO.git /tmp/task-slug
```

That skips the global config, disables the keychain helper, and supplies the token inside a helper, so it never appears on a command line or in a remote URL.

## Meters you can actually read

For months the orchestrator's pre-run usage check said "meter not readable, proceeding." Then I noticed that stream-json output includes a `rate_limit_event` line carrying the five-hour and seven-day utilization:

```bash
grep '"rate_limit_event"' agents.log | tail -1 \
  | jq '.rate_limit_info.unifiedWindows | {session: .five_hour.utilization, weekly: .seven_day.utilization}'
```

Runs now check both meters before starting and again after each worker. Each meter has two thresholds (75% and 85% for the session, 85% and 90% for the week), and the run slows down or stops as it crosses them. The interactive Claude Code sessions I run by hand draw on the same meter. One afternoon a hands-on session pushed it from 48% to 83% while no workers were running at all.

None of this is clever. It's what you'd build for any cron job you can't watch. The difference with agents is that the failure modes are new: a model can end its own process, wait for an event that can't fire, or print a secret while it's debugging. Build the plumbing as if every step will fail silently, because some of them will.
