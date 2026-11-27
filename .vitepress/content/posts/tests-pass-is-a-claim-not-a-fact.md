---
date: "2026-12-04T09:00:00.000-08:00"
tags: ["ai", "agents", "testing", "ci"]
draft: false
title: '"Tests Pass" Is a Claim, Not a Fact'
image: "/images/posts/tests-pass-is-a-claim-not-a-fact.jpg"
topic: "ai"
description: "My coding agents kept reporting green tests that CI then failed. The fix: run exactly what CI runs, and require the literal test summary line as proof."
series: "Lessons from an agent fleet"
series_part: 2
---

Two of my agent workers made the same change on the same day. Each one restructured a GitHub Actions workflow to save CI minutes, and each reported back: lint clean, `test:ci` passes, ready for review. Both PRs went red in CI within minutes.

The cause was a set of unit tests in `tests/workflows/` that parse `ci.yml` and assert job names and dependencies. Renaming a job broke them. When I asked the first worker how it had verified the tests, it admitted it had only read the tail of the output. The second worker's report was just as confident and just as wrong.

That's the core lesson from five months of running this fleet. When an agent says "tests pass," it's describing what it believes happened, and you have to treat that as a claim.

## Five ways local green lied

The tail-reading worker was the most obvious case, but most false greens came from honest workers running the wrong checks.

**A CI-only quality gate.** Two of my Nuxt apps run `npm run lint:ci` in CI, a duplication and complexity audit that isn't part of `npm run lint`. Workers ran `lint`, saw green, pushed, and failed on `✗ N lines duplicated across M files`. In one run, 2 of 7 PRs hit it.

**A typecheck nothing else runs.** Vitest strips types without checking them, and lint doesn't run `tsc`. One repo's CI runs `vue-tsc --noEmit` across everything, test files included. A worker reported "lint, lint:ci, full suite green," and CI failed on a test mock with the wrong type.

**A build that only production does.** In a Nuxt app, importing `../../shared/utils/planLimits` works in dev and in Vitest, because both read the source tree directly. The Nitro production build moves chunks around and recomputes relative paths, so the import becomes `../../../../../shared/...` and Rollup fails with `UNRESOLVED_IMPORT`. Lint passes and tests pass. Only the Netlify deploy preview, which runs a real build, catches it.

**A fresh-clone setup step.** A new Nuxt clone fails Vitest until `npx nuxt prepare` generates `.nuxt/tsconfig.*`. Several workers rediscovered this in a single run, and each one burned time on it.

**A different runtime.** One test passed locally across all 3,933 tests and failed twice in CI. The machine had Node 24, and `.nvmrc` pinned Node 26. happy-dom expires a `max-age=0` cookie as `expires = Date.now()` and then checks `expires < Date.now()` strictly, so a read in the same millisecond keeps the cookie. Node 26 was fast enough to hit that. Node 24 wasn't.

## Fix one: run exactly what CI runs

The shared worker brief now treats the CI config as the source of truth for what "checked" means. A worker can't decide on its own which checks are relevant.

```bash
npm ci
npx nuxt prepare                 # Nuxt repos: generates .nuxt/tsconfig.*
npm run lint:ci                  # the CI gate, not just `lint`
npm run typecheck                # if the script exists, always
npm run test:ci                  # the CI test script, not `test`
npm run build                    # any PR that touches imports or module layout

# CI-only failure unrelated to your diff? Reproduce on the pinned Node:
npx -p node@$(cat .nvmrc) npm run test:ci
```

Workers that edit `.github/workflows/` also have to grep `tests/` for every job name they rename or remove. Workflow-only changes are not test-free in these repos.

## Fix two: demand the receipt

The bigger change is in what a worker has to report. A worker can't just say "tests pass." It has to paste the literal summary line from the test runner, like this one from a recent report:

```text
      Tests  3933 passed (3933)
```

That line does two things. A worker can't produce it without finding the actual end of the actual run, which eliminates the skim. And I can compare it to CI in five seconds. If the PR's CI log shows `1 failed` and the report shows all passed, I know which one to believe and which worker needs a closer look.

This doesn't make lying impossible, and it doesn't need to. The failures I saw weren't deception. They were lossy summaries. A summary line is harder to summarize away.

## Green isn't durable either

One more trap: a verified green can go red with no new commits. `npm audit` runs against the live advisory database, so a PR that passed at 03:13 failed at 03:20 because an advisory was published in between. The orchestrator now re-checks `gh pr checks` right before it requests my review, not only when the worker finishes.

If you run coding agents, try asking for the receipt on the next "tests pass" and see how often it matches CI. Treat it the way you'd treat "works on my machine" from a new teammate: sincere, and not yet evidence.
