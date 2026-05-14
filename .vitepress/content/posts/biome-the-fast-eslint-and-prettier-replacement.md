---
created_at: '2026-05-05T16:05:00.000-08:00'
tags: ['tooling', 'javascript', 'typescript']
draft: true
title: "Biome: The Fast All-in-One ESLint and Prettier Replacement"
image: '/images/posts/biome-the-fast-eslint-and-prettier-replacement.jpg'
topic: 'development'
description: "Biome is a Rust-based toolchain that replaces ESLint and Prettier with a single fast binary. Here's what it does well, where it falls short, and how to migrate."
---

ESLint and Prettier have been the linting and formatting standard for JavaScript and TypeScript for years. They work, but they also carry significant complexity: plugin ecosystems, version compatibility matrices, slow startup in large codebases, and the perennial `eslint-config-prettier` dance to prevent the two tools from fighting each other. Biome enters as a single Rust-powered binary that handles both jobs, and it's dramatically faster.

## What Biome Is

Biome is a formatter and linter built with Rust, designed to be a drop-in replacement for ESLint and Prettier in most projects. It covers JavaScript, TypeScript, JSX, TSX, JSON, and CSS. One tool, one config file, one `npm install`:

```bash
npm install --save-dev --save-exact @biomejs/biome
npx biome init
```

This generates a `biome.json` with sensible defaults:

```json
{
  "$schema": "https://biomejs.dev/schemas/1.9.0/schema.json",
  "organizeImports": {
    "enabled": true
  },
  "linter": {
    "enabled": true,
    "rules": {
      "recommended": true
    }
  },
  "formatter": {
    "enabled": true,
    "indentStyle": "space",
    "indentWidth": 2,
    "lineWidth": 100
  },
  "javascript": {
    "formatter": {
      "quoteStyle": "single",
      "trailingCommas": "all"
    }
  }
}
```

## The Speed Difference Is Significant

Biome processes files using parallelism across CPU cores. On large projects, the difference over ESLint + Prettier is striking:

```bash
# Typical times on a 1000-file TypeScript project:
# ESLint check:    ~8s
# Prettier check:  ~4s
# Combined:        ~12s (sequential in CI)

# Biome check:     ~0.4s

biome check --write .   # Format + lint + fix in one pass
```

In CI pipelines that run linting on every commit, shaving 10+ seconds is meaningful at scale.

## Linting Coverage

Biome's recommended ruleset covers the most impactful ESLint rules — correctness, suspicious patterns, style — with hundreds of rules stable and many more being added each release:

```ts
// Biome catches these (examples of recommended rules):

// noUnusedVariables
const unused = 'never referenced'; // error

// noExplicitAny
function parse(data: any) {} // warning

// useConst
let x = 5; // x is never reassigned → suggest const

// noArrayIndexKey (React-aware)
items.map((item, i) => <li key={i}>{item}</li>); // warning
```

The rule philosophy mirrors ESLint's "recommended" config — it won't nag you about stylistic preferences that don't affect correctness.

## Migrating from ESLint + Prettier

Biome provides a migration command that reads your existing config:

```bash
npx biome migrate eslint --write
npx biome migrate prettier --write
```

These commands translate your ESLint rules and Prettier options to `biome.json` equivalents where mappings exist, and flag rules that have no Biome equivalent so you can decide whether to drop them or keep ESLint for those specific cases.

The most common gap is ESLint plugins that don't have Biome equivalents yet — `eslint-plugin-import`, complex accessibility rules, and framework-specific plugins like `eslint-plugin-react-hooks` are the most frequently cited. For those, the pragmatic approach is to run Biome for formatting and core linting, and keep a minimal ESLint config just for the plugin rules that don't have Biome coverage yet.

## Editor Integration

Biome has VS Code and Zed extensions that hook into the formatter and linter in real time:

```json
// .vscode/settings.json
{
  "editor.defaultFormatter": "biomejs.biome",
  "editor.formatOnSave": true,
  "[javascript]": { "editor.defaultFormatter": "biomejs.biome" },
  "[typescript]": { "editor.defaultFormatter": "biomejs.biome" },
  "[json]": { "editor.defaultFormatter": "biomejs.biome" }
}
```

For teams starting new projects, Biome is an easy call — zero compatibility surface between tools, fast feedback, and one config file to maintain. For existing projects, the migration is incremental and the speed gains will be immediately noticeable.
