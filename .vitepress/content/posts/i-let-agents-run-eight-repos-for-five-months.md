---
date: "2026-12-01T09:00:00.000-08:00"
tags: ["ai", "agents", "ai-tooling", "automation"]
draft: false
title: "I Let Agents Run Eight Repos for Five Months"
image: "/images/posts/i-let-agents-run-eight-repos-for-five-months.jpg"
topic: "ai"
description: "Five months of an unattended Claude Code fleet working eight of my repos: the architecture, the human gates, and what this series will cover."
series: "Lessons from an agent fleet"
series_part: 1
---

Five times a day a headless Mac mini wakes up, starts a headless Claude Code session, and goes to work on eight of my repositories. It triages issues, fixes red CI, rebases Dependabot PRs, and ships features I filed the night before. Then it opens pull requests and assigns them to me. I review, I merge, and the next run picks up whatever changed.

I've run this setup since the summer. The hardware side is in [Turning a Base M4 Mac Mini Into an Always-On Automation Box](/posts/turning-a-base-m4-mac-mini-into-an-always-on-automation-box). This series covers everything that happened after the box was running: what broke, what I got wrong, and which rules held up. Almost none of it is about prompts. Most of it is about plumbing, concurrency, CI, and trust.

## The shape of it

A `launchd` job runs a shell script at 01:05, 06:05, 11:05, 16:05, and 21:05. The script loads credentials, checks usage meters, and starts `claude -p` with a long spec file as its instructions. That session is the **orchestrator**, and it runs on Opus.

The orchestrator builds a task queue in a fixed priority order:

1. A red `main` on any repo
2. Open PRs with failing CI
3. PRs with review feedback from me
4. Open issues, highest priority label first
5. The improvement scan, which turns follow-up ideas from earlier PRs into new issues

For each task it dispatches a **worker**, a Sonnet subagent with a short brief and a fresh clone in `/tmp`. Workers do the actual coding. Before a worker can open a PR, it has to run the repo's checks and then pass an independent review: it pipes its diff to a separate Opus process and fixes whatever comes back, round after round, until the reviewer replies with the literal string `No issues found`.

```bash
# Simplified from the worker brief: the review loop
git diff origin/main...HEAD \
  | claude --model opus -p "Review this diff for bugs, missing tests, and spec violations. Reply 'No issues found' if there are none."
```

The reviewer never sees the worker's reasoning, only the diff. That independence is the whole point. A model reviewing its own work in the same context mostly agrees with itself.

## The human gates

Nothing merges without me, and the system is built so that my attention goes only where it's needed.

**A separate identity.** Workers push as a dedicated bot account, `grimicorn-agent`, not as me. The bot can open PRs but can't approve or merge them.

**Review only when CI is green.** A PR doesn't request my review until every check passes. If `main` itself is red, the open PRs get a `ci-held` label and one dedicated `ci-fix` PR repairs `main`. Part 6 covers why that matters.

**Handoffs by assignment.** If an issue or PR is assigned to me, it's my turn: ready to review, blocked on a decision, or waiting on a setting only I can change. The orchestrator never guesses at decisions that belong to me. It writes them to a questions file with stable IDs, so a run can say "blocked on D-Q2" and I know exactly what it means.

**A paper trail.** Every PR gets a review-trail comment listing which checks ran, how many review rounds there were, and which findings were skipped and why. I read the skipped list first.

## What five months produced

The volume surprised me. One run in November opened 36 PRs across the fleet, and I merged 33 of them within a few hours. The repos range from this blog and a few small sites to three Nuxt apps with Postgres, a CLI, a metrics dashboard, and a package monorepo.

The more useful output was the memory. Every time something broke in an interesting way, the orchestrator wrote a markdown note: what happened, why, and how to apply the lesson next time. After five months there are 98 of those notes. Some of them correct earlier notes that turned out to be wrong. That folder is the raw material for this series.

## What's coming

- **"Tests pass" is a claim, not a fact.** Why workers reported green and CI disagreed.
- **Flake or failure?** Two rules the agent learned about CI noise that turned out to be false.
- **The boring plumbing.** Auth that fails silently, runs that exit 0, and git hanging on a headless Mac.
- **Fifteen agents, one machine.** Concurrency bugs between agents look exactly like concurrency bugs between threads.
- **Fix it once.** Why I stopped letting every PR patch a red `main`.
- **Build them a ledger.** Giving agents memory between runs, and how it rotted.
- **What it costs.** Making repos private burned a month of CI minutes in 11 days.
- **The trust boundary I got wrong.** Stranger-written PR comments and tokens leaking into transcripts.

The orchestrator spec, worker briefs, and tests are on GitHub at [neonpixels-studio/agents](https://github.com/neonpixels-studio/agents). It's opinionated (GitHub, Claude Code, Neon, `launchd`) and meant to be read, not installed. If you're building something similar, start with the plumbing and the gates. The prompts are the easy part.
