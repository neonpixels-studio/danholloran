---
date: "2026-05-23T13:53:50.000+00:00"
tags: ["tooling", "javascript", "bundlers", "performance"]
draft: false
title: "Vite 8 + Rolldown: Rust-Powered Builds That Are 10–30x Faster"
image: "/images/posts/vite-8-rolldown-rust-powered-builds.jpg"
topic: "development"
description: "Vite 8 replaces its dual esbuild/Rollup pipeline with Rolldown, a Rust-based bundler that delivers 10–30x faster production builds — and real teams are already seeing dramatic results."
---

If you've ever watched a production build spin for a minute while your terminal mocks you with its progress bar, Vite 8's arrival is worth paying attention to. The headline change is a new bundler under the hood — Rolldown — and the performance numbers coming out of early adopters are hard to ignore.

## Why Vite Needed a New Bundler

For years, Vite juggled two separate bundlers to cover different scenarios. During development it leaned on esbuild for its raw speed, and at build time it handed off to Rollup for its sophisticated chunking and plugin ecosystem. This split worked well enough, but it created a persistent headache: the two pipelines didn't always behave the same way. You'd write a plugin that worked in dev, only to hit a subtle edge case in production. Or you'd track down a build inconsistency that turned out to be a difference in how esbuild and Rollup resolved a module. The glue code holding everything together kept growing.

Rolldown solves this by being a single bundler that handles both jobs. It's written in Rust (hence the speed), it supports the Rollup plugin API, and it's built by the VoidZero team — the same people who maintain Vite. The goal was a unified toolchain: Vite for orchestration, Rolldown for bundling, and Oxc for parsing, transforming, and linting, all from one team.

## What the Numbers Actually Look Like

The benchmarks aren't theoretical. Teams migrating to `rolldown-vite` (the technical preview that shipped before Vite 8) reported some striking results:

- **Linear** cut production build times from 46 seconds to 6 seconds
- **Beehiiv** reduced their build time by 64%
- **Ramp** saw a 57% reduction

Those kinds of improvements don't come from configuration tweaks — they come from replacing JavaScript-based bundling with native Rust code. Rolldown benchmarks at 10–30x faster than Rollup for production bundling, while matching esbuild's performance in transformation speed.

## Upgrading and What Changes

The migration story is deliberately smooth. Rolldown supports the same plugin hooks as Rollup and Vite, so most projects can drop in Vite 8 without rewriting configs. There's also a compatibility layer that auto-converts existing esbuild and Rollup options to their Rolldown equivalents.

```bash
npm install vite@8
```

For straightforward projects, that's often the whole migration. For larger or more complex setups, the recommended path is a two-step upgrade: first move to the `rolldown-vite` package to isolate any Rolldown-specific issues, then upgrade to Vite 8 proper.

```bash
# Step 1: try the rolldown-vite preview
npm install rolldown-vite

# Step 2: update package.json to point to the official release
npm install vite@8
```

Vite 8 also ships two smaller quality-of-life features worth knowing about. First, built-in `tsconfig` `paths` resolution — enable it with `resolve.tsconfigPaths: true` in your Vite config and stop manually mirroring path aliases between TypeScript and Vite. Second, automatic support for TypeScript's `emitDecoratorMetadata`, which is a welcome relief for Angular and NestJS users who previously needed a separate plugin.

```ts
// vite.config.ts
export default defineConfig({
  resolve: {
    tsconfigPaths: true, // reads paths from tsconfig automatically
  },
});
```

If your project depends on a meta-framework like Nuxt, Astro, or uses Vitest, you'll need to override Vite in your package manager until those frameworks ship their own updates:

```json
// package.json (npm)
{
  "overrides": {
    "vite": "^8.0.0"
  }
}
```

## What's Coming Next

The Rolldown integration opens the door to features that weren't possible in the split-bundler model. Full Bundle Mode — currently experimental — promises 3× faster dev server startup and 10× fewer network requests for large projects by letting Rolldown handle the entire dev pipeline instead of serving unbundled modules. There's also ongoing work on raw AST transfer, which would let JavaScript plugins access Rolldown's Rust-produced AST with near-zero overhead, closing the performance gap between native and JS plugins.

If you haven't tried Vite 8 yet, it's worth upgrading even just to measure the build time difference on your own project. For most teams, the migration will take minutes and the payoff will be immediate. The era of waiting 45 seconds for a frontend build should finally be behind us.
