---
date: "2026-12-22T09:00:00.000-08:00"
tags: ["ai", "agents", "github-actions", "costs"]
draft: false
title: "What an Autonomous Dev Team Actually Costs"
image: "/images/posts/what-an-autonomous-dev-team-actually-costs.jpg"
topic: "ai"
description: "Making four repos private burned GitHub's 3,000 included Actions minutes in 11 days. Where an agent fleet's CI minutes and money actually go."
series: "Lessons from an agent fleet"
series_part: 8
---

People ask what an agent fleet costs and expect the answer to be model tokens. In my setup, tokens were the most predictable line item. The surprise was everything the agents _trigger_: CI minutes, database compute, deploy credits. An agent that opens 30 PRs a day is also 30 CI pipelines a day, plus every rerun, rebase, and retry.

I found this out the expensive way. In early November I made four of my repos private. Public repos get GitHub Actions for free, private ones don't. My org is on the GitHub Team plan, which includes 3,000 private-repo minutes a month. They were gone by November 11th.

## Where the minutes went

GitHub's billing API returned an empty `billable` field for these runs, so I estimated from job timestamps: each job's duration, rounded up to the minute, with skipped jobs dropped (they report negative durations). Here's November 1st to 11th:

| Repo              | Billed minutes (est.) |
| ----------------- | --------------------- |
| Reader app        | ~1,470                |
| Travel app        | ~1,130                |
| Another Nuxt app  | ~800                  |
| Metrics dashboard | ~410                  |
| **Total**         | **~3,800 in 11 days** |

That's a pace of about 10,400 minutes a month, against a budget I had set at around 6,000 with a $20 overage cap. The agent's GitHub account drove 86% of it.

Breaking it down by cause (the categories overlap, so they add up to more than 100%):

- **End-to-end shards: 51%.** A healthy run of the reader app's PR pipeline billed about 39 minutes, because 10 e2e shards each repeated `npm ci` and a Playwright browser install.
- **Failed jobs: 30%.** Many of those were the flakes from Part 3.
- **Tiny jobs: 20%.** Secret scans, audits, change detection, and gates. Each one runs for seconds and bills a full minute.
- **Reruns: 17%.**
- **Double triggers: 14%.** Three repos ran CI on `push` to every branch _and_ on `pull_request`, so every agent push ran the pipeline twice.

The worst single pattern: an apt mirror hang inside `playwright install --with-deps` cost about 10 minutes per shard, which made one PR run about 140 minutes. That happened three times on November 10th. Only one repo had a `timeout-minutes` on its e2e job.

The metrics dashboard was the control group. It already ran `push` only on `main` and folded its tiny jobs into the main `ci` job, and its PR runs billed 7 to 9 minutes against 17 to 25 for the others.

## The fixes

```yaml
on:
  push:
    branches: [main] # PR branches are covered by pull_request
  pull_request:

jobs:
  e2e:
    timeout-minutes: 20 # an apt hang should cost 20 minutes, not 140
    strategy:
      matrix:
        shard: [1, 2, 3] # was 10; every shard repeats npm ci + browser install
```

Beyond that: fold the one-minute jobs into `ci`, and move Lighthouse off PRs and onto a schedule. Even with all of it, my projection was about 4,000 minutes a month at the current PR rate. That's still over the included 3,000. An agent fleet sets the PR rate, and the PR rate sets the bill.

## The other meters

**Database compute.** The Neon org behind my Postgres apps is on the free plan. By October 10th, the dashboard had used 26 compute-hours and the reader app 24, a pace of 75 to 80 for the month across the org. The dashboard's 15-minute sync cron keeps compute awake. When a free-plan project runs out, its database suspends until the next period. That looks exactly like an outage, so late-month database failures now get a usage check before anyone debugs code. The e2e jobs also share a concurrency group to stay inside free-tier limits, which created the cancelled-run problem from Part 5.

**Deploy credits.** Every production deploy on Netlify cost 15 credits, and the fleet merges a lot. Production deploys now run once a week from a build hook called by a scheduled Action. Free deploy previews still run on every PR. This blog is the exception and still deploys daily.

**Model usage.** The orchestrator and the reviewer run on Opus, and the workers run on Sonnet. The workers are where the volume is: dozens of tasks a day, each one cloning, coding, and running tests. Judgment, meaning which task, whether a red check is real, and whether a diff is correct, lives in the two Opus roles. Runs check the session and weekly meters before dispatching and stop near the limits.

## Costs that look like bugs

Billing failures don't announce themselves as billing failures:

- The dashboard has a "stale vendor" alert that fires when a data source hasn't updated in 60 hours. It fired for PageSpeed. The daily PageSpeed workflow had been **billing-blocked**, so the run started and executed zero steps. No code had changed. It cleared on its own after the next successful run.
- When a repo went private, jobs calling PR APIs with only `contents: read` permission started failing with `Resource not accessible by integration`. Public repos had allowed that read without asking. Every PR went red while `main` stayed green. It took one `ci-fix` PR adding `pull-requests: read`.

The agents themselves are cheap compared to what they set in motion. Before you scale up a fleet, look at your CI config the way you'd look at a hot loop: what runs on every push, what repeats per shard, and what has no timeout. The fleet will find every inefficiency in your pipeline and run it 30 times a day.
