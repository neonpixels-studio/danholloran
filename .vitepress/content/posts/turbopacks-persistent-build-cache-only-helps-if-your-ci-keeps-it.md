---
date: "2026-09-20T02:08:32.000-07:00"
tags: ["next.js", "tooling", "performance", "bundlers"]
draft: false
title: "Turbopack's Persistent Build Cache Only Helps If Your CI Keeps It"
image: "/images/posts/turbopacks-persistent-build-cache-only-helps-if-your-ci-keeps-it.jpg"
topic: "development"
description: "Next.js 16.3 turned on Turbopack's persistent build cache by default and published numbers as high as 5.5x. Most CI pipelines will see exactly zero of that, because the cache is a directory and containers start empty."
---

You upgrade to Next.js 16.3, read that Turbopack's persistent file system cache is now on by default for `next build`, see a chart claiming up to 5.5x faster builds, push to CI, and watch your pipeline take exactly as long as it did yesterday. Nothing is broken. The feature is doing precisely what it says. The problem is that "persistent" means persisted to a directory, and your build container throws that directory away the moment it exits.

This is the least glamorous kind of performance work: the speedup is real, it's free, and collecting it is an infrastructure chore rather than a code change.

## The cache is a directory, not a feature flag

Turbopack has been persisting its incremental compilation cache to disk for `next dev` since 16.1. In 16.3 the same mechanism graduated for `next build`, and both are enabled by default:

```ts
// next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    turbopackFileSystemCacheForDev: true, // default
    turbopackFileSystemCacheForBuild: true, // default
  },
};

export default nextConfig;
```

Dev writes to `.next/dev/cache/turbopack`, builds write to `.next/cache/turbopack`. On the second build Turbopack reads those entries off disk before compiling anything new, so you only pay for what changed. Vercel's published numbers span a wide range depending on how much of the route graph the change touches: `nextjs.org` went from 21s cold to 9.2s warm, `vercel.com/home` from 66s to 46s, and `vercel.com/geist` from 30s to 5.5s.

Every one of those numbers assumes `.next/cache` survives between runs. Restoring it in GitHub Actions is a handful of lines:

```yaml
- uses: actions/cache@v4
  with:
    path: |
      ~/.npm
      ${{ github.workspace }}/.next/cache
    key: ${{ runner.os }}-nextjs-${{ hashFiles('**/package-lock.json') }}-${{ hashFiles('**/*.[jt]s', '**/*.[jt]sx') }}
    restore-keys: |
      ${{ runner.os }}-nextjs-${{ hashFiles('**/package-lock.json') }}-
```

The `restore-keys` fallback matters more than the exact key. If your lockfile is unchanged but source files moved, you still want the previous cache as a starting point instead of a cold compile.

Docker is the case that quietly eats this. A containerized build starts from a clean layer, so unless you explicitly mount a cache or use `RUN --mount=type=cache`, `.next/cache` is empty on every single build and Turbopack spends time writing a cache that nothing will ever read. If that describes your setup and you don't plan to fix it, turn the thing off rather than paying for it:

```ts
experimental: {
  turbopackFileSystemCacheForBuild: false,
}
```

That's the actual decision in front of you: persist the directory, or opt out. Leaving it on with nothing to restore is the one configuration that costs you something and returns nothing.

## The dev-memory win needs no setup at all

The other half of the release is the part you'll notice without touching any config. Because cached results are now safely on disk, Turbopack can evict them from memory instead of holding every visited route forever. After compiling 50 routes, Vercel measured its own dashboard app dropping from 21.5 GB to 2 GB, and `nextjs.org` from 4,600 MB to 840 MB.

That's roughly a 90% and 82% reduction, and it lands in a moment when your dev machine is more crowded than it used to be. A coding agent, a TypeScript server, a linter, and a test watcher are all competing for the same RAM as your bundler. Eviction requires the dev file system cache to be enabled, and both are on by default. The escape hatch exists if you're debugging cache behavior itself:

```ts
experimental: {
  turbopackMemoryEviction: false, // default is 'auto'
}
```

Your mileage genuinely varies here. The reduction depends on the size of your route graph, how much of it you touched, and how long the session ran. A three-route side project has nothing to evict.

## Two smaller things worth a look

The React Compiler has been stable in Next.js since 16.0, but only as a Babel transform, which meant large apps waited on JS execution during builds. The React team shipped a native Rust port, and Turbopack now wires it up behind an experimental flag with early tests on large apps showing 20-50% compilation wins:

```ts
const nextConfig = {
  reactCompiler: true,
  experimental: {
    turbopackRustReactCompiler: true,
  },
};
```

Turbopack also picked up Vite's `import.meta.glob`, which is a small quality-of-life upgrade for anyone hand-maintaining a list of content files:

```ts
const posts = import.meta.glob("./posts/*.mdx");

for (const path in posts) {
  const post = await posts[path]();
}
```

Pass `eager: true` to import each match immediately. It's Turbopack-only, so it won't work if you're still building with `--webpack`.

Of the four, the build cache is the one with a real chance of being invisible to you. Before you file the 16.3 upgrade as done, go look at whether `.next/cache` actually survives a CI run. If it doesn't, you've been paying for a cache you never read.

Sources: the [Turbopack 16.3 release post](https://nextjs.org/blog/next-16-3-turbopack), the [`turbopackFileSystemCache` reference](https://nextjs.org/docs/app/api-reference/config/next-config-js/turbopackFileSystemCache), and the [CI build caching guide](https://nextjs.org/docs/app/guides/ci-build-caching).
