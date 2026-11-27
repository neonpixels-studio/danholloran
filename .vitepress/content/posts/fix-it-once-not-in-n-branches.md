---
date: "2026-12-16T09:00:00.000-08:00"
tags: ["ai", "agents", "ci", "dependencies"]
draft: false
title: "Fix It Once, Not in N Branches"
image: "/images/posts/fix-it-once-not-in-n-branches.jpg"
topic: "ai"
description: "When main goes red, every open PR inherits it, and letting each agent patch it creates N conflicting fixes. Here is the ci-held and ci-fix pattern instead."
series: "Lessons from an agent fleet"
series_part: 6
---

On November 17th, a ReDoS advisory was published for `picomatch` 4.0.7 and below. There was no patched version. Every repo in my fleet had it somewhere in its lockfile, mostly through build tooling. By the next day, every new PR in five repos had a red `dependency-audit` check, and not one of those PRs had caused it.

This happens a lot more often than I expected. `npm audit` runs against the live advisory database, so a single new advisory reds every open PR at once with zero new commits. Over five months I watched it happen with `nanoid`, `image-size`, `basic-ftp`, `picomatch`, and `brace-expansion` (three separate times). An agent fleet sees the red, and its instinct is to fix it right there in the PR.

## Why the naive fix fails

Say six PRs in one repo are red on the same advisory. Six workers each add the same `overrides` block to `package.json` and regenerate the lockfile. Every PR is now green on its own, and they all conflict with each other in `package.json` and `package-lock.json` as soon as the first one merges. You've turned one fix into six, plus five merge conflicts, plus a feature PR that now carries an unrelated security change.

The diagnosis goes wrong too. Early on, a worker compared its PR's audit (21 vulnerabilities) against `main`'s last CI run from three days earlier (9 vulnerabilities) and concluded that its dependency bump had added 12 advisories. When it re-ran `npm audit` on both in the same session, `main` showed 23 and the PR showed 21. The PR was actually cleaner. The stale run had made up the regression.

## The pattern: hold, fix once, release

The orchestrator now treats a red `main` as a fleet event, not a per-PR task:

1. **Detect it.** Check the latest CI run on each repo's `main`. Skip the GitHub `Dependabot` check, since that's the security-update job reporting that it couldn't bump something, not a project check failing.
2. **Hold the PRs.** Label every open PR that's red for the inherited reason `ci-held`. Held PRs don't request my review.
3. **Fix it once.** Open one `ci-fix` PR per repo that repairs `main`, and only that.
4. **Release.** After the fix merges, bring each held PR up to date and let CI rerun.

```bash
# Release held PRs after the ci-fix merges
for pr in $(gh pr list --label ci-held --json number --jq '.[].number'); do
  gh pr update-branch "$pr"
done
```

Step 4 had two traps. A plain `gh run rerun` doesn't help, because `pull_request` CI tests the merge ref computed when the run was triggered, which still points at the old `main`. And `@dependabot rebase` refuses to touch a Dependabot PR that an agent has already pushed a commit to. `gh pr update-branch` works for both.

For the `picomatch` advisory, that meant five `ci-fix` PRs and 23 held PRs. Without the pattern, it would have been 23 overlapping fixes.

## Choosing the fix: override or allowlist

The `ci-fix` worker has to make the right call between two kinds of fix.

**If a patched version exists, override it.** `nanoid` 3.3.17 fixed its advisory, so the fix was a one-line override plus an in-place `npm install`:

```json
{
  "overrides": {
    "nanoid": "^3.3.17",
    "brace-expansion": "^5.0.12"
  }
}
```

`brace-expansion` shows why the override sometimes has to be the fix. A transitive chain (`glob@10` pins `minimatch@9`, which pins `brace-expansion@2`) meant no top-level version bump could reach a patched release. The override flattened the whole chain. It also had to move twice as new advisories widened the vulnerable range, from `^5.0.8` to `^5.0.9` to `^5.0.12`.

**If no patched version exists, allowlist it with an expiry date.** `image-size` and `picomatch` had no fixed release. The worker greps to confirm that nothing reachable at runtime calls the vulnerable code, then adds the advisory ID to the repo's audit allowlist with a dated justification and a review-by date. When that date passes, the gate fails again even with no new advisories. That's on purpose. Seven weeks after allowlisting `image-size`, the expiry forced a recheck, and by then a real fix had shipped. A plain `npm audit fix` cleared it.

## Coupled bumps belong together

A related failure: Dependabot opened `pinia` 4 and `@pinia/nuxt` 1.0 as two separate PRs in three repos. Each one needs the other, so each PR alone fails at `npm install`. Six PRs were delegated, and six came back blocked. `vitest` and `@vitest/ui` did the same thing at their 5.0 release. The fix is the same shape as `ci-fix`: put the pair in one PR and close the redundant twin.

One more rule came from this work and applies everywhere: never resolve a lockfile conflict by deleting `package-lock.json`. In one app, a fresh resolve moved `nuxt` to a newer minor within its existing range. That pulled in a pre-release major version of its HTTP layer, and every authenticated route returned 500. Install over the existing lockfile so that only what you meant to bump actually changes.

The general lesson: when the same red shows up in N places, the fix belongs in one place. An agent sees one PR and fixes the one in front of it. The orchestrator is the only part of the system that sees all N, so that decision has to live there.
