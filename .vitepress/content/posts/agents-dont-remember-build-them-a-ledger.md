---
date: "2026-12-19T09:00:00.000-08:00"
tags: ["ai", "agents", "memory", "jq"]
draft: false
title: "Agents Don't Remember. Build Them a Ledger."
image: "/images/posts/agents-dont-remember-build-them-a-ledger.jpg"
topic: "ai"
description: "An append-only JSONL ledger gave my coding agents memory between runs. Then drifting ID prefixes quietly polluted it. What held up and what did not."
series: "Lessons from an agent fleet"
series_part: 7
---

Every scheduled run of my agent fleet starts from nothing. The orchestrator doesn't remember what it decided at 06:05 when it wakes up at 11:05. For most tasks that's fine, since GitHub is the state: open issues, open PRs, CI results. But one feature needed real memory, and building it taught me more about agent state than anything else in the project.

The feature is the improvement scan. When a worker finishes a PR, it adds a few follow-up suggestions to the PR body: an edge case it noticed, a refactor it skipped. An intake step harvests those suggestions. A weekly pass ranks the backlog and promotes the best ones to GitHub issues, which the fleet then works on. Without memory, a suggestion I had already rejected would come back every week, and a promoted one could get promoted twice.

## Why append-only JSONL

Each repo gets a ledger file, `.ledger/<repo>.jsonl`, with one JSON record per line. Here's an illustrative pair: Records are never edited. A status change is a new line with the same `id`, and the latest line for an `id` wins.

```json
{"id":"reader-pr412-2","status":"held","title":"Retry feed fetch on 429 with backoff","origin_pr_url":"https://github.com/...","date":"2026-11-02"}
{"id":"reader-pr412-2","status":"promoted","issue":431,"date":"2026-11-09"}
```

```bash
# Latest status per id
jq -s 'group_by(.id) | map(last) | .[] | {id, status}' .ledger/reader.jsonl
```

The obvious alternative is a mutable state file, but agents rewrite whole files, and one bad rewrite loses everything. Append-only means a bad write damages at most one line, history is free, and `git diff` on the ledger reads like an audit log. That part held up.

## How it rotted anyway

The ID format is `<repo>-pr<NUM>-<n>`: the repo, the PR that produced the suggestion, and the bullet's position. Nothing enforced the repo part, and each run worked it out again from scratch.

For one repo the ledger ended up with **three** prefixes for the same suggestions: `wanderist-`, `wand-`, and `wan-`. Then the repo was renamed and a fourth (`farflung-`) appeared. By late September, 7 of 8 ledgers mixed prefixes, and the mixing was happening fresh each day, not just in old history. Duplicate `held` records went into the ranker, and in at least one case a suggestion that had already been promoted got promoted again, which created a duplicate GitHub issue.

Every mitigation I added missed the next case:

- **Dedup by full ID** missed the prefix variants.
- **Dedup by the `-pr<NUM>-<n>` suffix** missed the case where bullet numbering shifted between runs (0-based one day, 1-based the next).
- **Dedup by title** missed suggestions that a later intake pass had reworded, and it even missed one exact title match because the check wasn't reliably running at promotion time.

The tooling around the ledger had bugs of its own:

```bash
# Wrong: comm needs lexical order, not numeric
comm -23 <(sort -n open_prs.txt) <(sort -n ledgered_prs.txt)   # ~40 false "new" PRs

# Right
comm -23 <(sort open_prs.txt) <(sort ledgered_prs.txt)
```

Older records were written as `"id": "x"` and newer `jq -c` appends as `"id":"x"`, so any `grep` for one spacing missed the other. A loop over `$nums` ran once with the whole list, because the agent's shell was zsh, which doesn't split words. One record that was built by string interpolation had an unescaped quote in its summary. Every `jq` read after that line failed with "Invalid numeric literal", so every later record disappeared from dedup without any warning.

The fixes that worked were boring. Build records with `jq -c -n --arg`, never with string templates. Run `jq -c . ledger.jsonl > /dev/null` after every append. Dedup with `jq`, not `grep`. The real fix, picking one canonical prefix and normalizing every existing record, still hasn't been done. Rewriting history in an append-only log is a judgment call, and an agent shouldn't make it alone.

## The world moves under the ledger

Even a perfect ledger can't tell you that its subject has changed since it was written. These cost real worker runs:

- A promoted bug was already fixed on `main` by the time a worker picked it up.
- A promoted issue already had an open PR that said `Closes #N`, so the issue got worked twice.
- GitHub keeps showing `CHANGES_REQUESTED` after the branch is fixed, so the same review feedback looked unfinished on every run.
- Some workers posted their suggestions as a PR comment instead of in the body, so intake never saw them.

The safety net is one rule in every worker brief: read the target code before you write anything. Several duplicates were caught that way when the ledger let them through.

## This series is a ledger too

Besides the ledger, the orchestrator keeps memory notes: one markdown file per lesson, each with what happened, why, and how to apply it. When a lesson turns out to be wrong, the note is corrected in place with a dated note explaining the correction. After five months there are 98 of them, and this series is built from those notes.

The ledger and the notes taught the same thing. Agent memory is a database. Give it a schema, validate every write, and assume it's subtly wrong. Then design the workers to check the real world before acting on it.
