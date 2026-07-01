---
date: '2026-07-01T07:08:04.000+00:00'
tags: ['tooling', 'typescript', 'javascript', 'fallow']
draft: true
title: "Fallow: A Codebase Truth Layer for Agent-Written Code"
image: '/images/posts/fallow-a-codebase-truth-layer-for-agent-written-code.jpg'
topic: 'development'
description: "Fallow is a Rust-native tool that maps your whole TS/JS codebase to catch dead code, duplication, and architecture drift. Here's how it fits alongside ESLint, Prettier, and agent guidelines when you're reviewing PRs you didn't write."
---

Most of the code in my side projects lately wasn't typed by me. I write the issue, an agent writes the branch, and I review the PR. That workflow is fast, but it quietly moves the hard part downstream. When you review a lot of generated diffs, you stop worrying about whether a function works and start worrying about the stuff a diff never shows you: the export nothing imports anymore, the near-identical helper that already exists two folders over, the module that just started reaching across a boundary it had no business touching.

ESLint and Prettier don't catch any of that, because they can't. A linter reads one file at a time. The problems I actually run into are relationships between files, and that's exactly the gap [Fallow](https://github.com/fallow-rs/fallow) fills.

## What Fallow actually checks

Fallow calls itself a "codebase truth layer," and the framing is accurate. Instead of linting files, it builds a module graph across your whole TypeScript/JavaScript project and answers questions no file-local tool can:

- **Dead code** — unused files, exports, dependencies, types, and circular dependencies
- **Duplication** — copy-pasted blocks, from exact matches to semantic clones with renamed variables
- **Complexity** — the riskiest functions and the files worth refactoring first
- **Architecture drift** — imports that cross layer or module boundaries they shouldn't

The pitch that sold me is the honest one on the README: "Built for AI-assisted development. No AI inside." It's a Rust binary, it's deterministic, and it's fast enough that speed never becomes an excuse to skip it. On a 20,000-file Next.js project it finishes dead-code analysis in under two seconds. On anything I'm building solo, it's basically instant.

```bash
npx fallow
```

```
 Dead code   3 unused files, 12 unused exports, 2 unused deps       18ms
 Duplication 4 clone groups (2.1% of codebase)                      31ms
 Complexity  7 functions exceed thresholds                           4ms
```

No config for the first run. It ships 90 framework plugins, so it already knows what an entry point looks like in Next, Nuxt, SvelteKit, Astro, and the rest.

## Where it fits with my other guardrails

Fallow didn't replace anything in my setup. It filled the one hole the others left.

The way I think about it now, each tool owns a different scale. Prettier owns formatting. ESLint owns file-local correctness. My `CLAUDE.md` (or `AGENTS.md`) owns intent: a handful of rules I want every generated change to respect, like rule of three before you abstract, early returns over nested conditionals, and keep functions small. Those guidelines shape the code as the agent writes it. Fallow owns the part none of the others can see, which is what the change did to the codebase as a whole.

The command that ties it into review is `audit`:

```bash
npx fallow audit --format json
```

It scopes dead code, duplication, and complexity to just the changed files and returns a verdict: pass, warn, or fail, with a real exit code. That runs cleanly in CI, but it's just as useful the moment before I open a PR. If the agent left an orphaned export or quietly duplicated a utility, I see it as a fact instead of hoping I'll spot it by eye at line 300 of a diff.

Because the JSON output includes a per-issue `actions` array, the agent itself can consume it. The loop becomes: generate the change, run `fallow --format json`, read the findings, fix the obvious ones, and hand me a cleaner PR to review. There's an MCP server for wiring it directly into Claude Code, Cursor, and friends, but honestly the CLI plus a line in the agent instructions gets you most of the value.

## Getting started

Running it once costs nothing:

```bash
npx fallow            # dead code + duplication + health
fallow dead-code      # just cleanup candidates
fallow health --score # project health score, 0-100
fallow fix --dry-run  # preview automatic cleanup
```

When you're ready to make it stick, `fallow init` writes a tailored `.fallowrc.json` and can scaffold a pre-commit hook. Start every rule at `warn` so it surfaces problems without blocking you, then promote the ones you care about to `error`:

```json
{ "rules": { "unused-files": "error", "unused-exports": "warn" } }
```

In CI it's a one-liner (`uses: fallow-rs/fallow@v2`), and the `--baseline` flag means you only fail on *new* issues, which makes it painless to adopt on a codebase that's already a little messy.

Delegating code to agents doesn't remove the need for review. It just changes what review is about. Fallow gives me a factual read on what a change did to the whole project, so I can spend my attention on the parts that actually need judgment instead of playing spot-the-dead-export. If you're shipping code you didn't personally type, that's a trade worth making.
