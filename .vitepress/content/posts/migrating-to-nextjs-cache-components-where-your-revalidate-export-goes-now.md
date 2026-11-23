---
date: "2026-11-23T02:14:36.000-08:00"
tags: ["next.js", "react", "performance", "tooling"]
draft: false
title: "Migrating to Next.js Cache Components: Where Your revalidate Export Goes Now"
image: "/images/posts/migrating-to-nextjs-cache-components-where-your-revalidate-export-goes-now.jpg"
topic: "development"
description: "Cache Components become the Next.js 17 default. Here is where dynamic, revalidate, and fetchCache go, plus the cache persistence trap the codemod won't flag."
---

Open almost any App Router codebase from the last two years and you will find a little stack of exports at the top of the page files: `export const dynamic = 'force-dynamic'`, `export const revalidate = 3600`, maybe a `fetchCache` someone added during a late-night caching bug. Those knobs worked at the route level, and that was the problem. One cookie read deep in a component could flip an entire page to dynamic, and nobody could tell from reading the file what was actually cached.

Next.js 16.4 shipped in October with a clear message: Cache Components is now the recommended model for every app, `create-next-app` enables it by default, and it becomes the default in Next.js 17. Turn on `cacheComponents: true` and every one of those route segment configs stops building. So the question is no longer whether to migrate, but where each export goes.

## Every config has a new home

The mental model flips. Under Cache Components nothing is cached unless you say so with `'use cache'`, and anything uncached simply runs at request time while Next.js prerenders the static parts around it. Most of the old configs either disappear or turn into a `cacheLife` call.

`revalidate` becomes a cache profile on the data or UI that should be cached:

```tsx
// Before
export const revalidate = 3600;

export default async function Page() {
  const posts = await getPosts();
  return <PostList posts={posts} />;
}
```

```tsx
// After
import { cacheLife } from "next/cache";

export default async function Page() {
  "use cache";
  cacheLife("hours");
  const posts = await getPosts();
  return <PostList posts={posts} />;
}
```

The built-in profiles are `seconds`, `minutes`, `hours`, `days`, `weeks`, and `max`. Each sets three numbers: `stale` (how long the client router reuses it), `revalidate` (when the server refreshes in the background), and `expire` (when a request has to wait for fresh content). `hours` is 5 minutes, 1 hour, and 1 day. If your old `revalidate` value doesn't match a preset, define a named profile in `next.config.ts` instead of rounding:

```ts
// next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  cacheLife: {
    editorial: { stale: 600, revalidate: 1800, expire: 86400 },
  },
};

export default nextConfig;
```

The rest of the list is mostly deletion. `dynamic = 'force-dynamic'` and `revalidate = 0` go away because uncached is already the default. `fetchCache` goes away because caching now lives at the data source. `unstable_noStore()` goes away for the same reason. Per-request `fetch` options move too: `cache: 'force-cache'` with `next: { revalidate, tags }` becomes a small `'use cache'` function that calls `cacheLife` and `cacheTag`.

## The two changes that will actually bite you

**`force-static` is not a straight swap.** The old config forced prerendering and made `cookies()`, `headers()`, and `useSearchParams()` quietly return empty values. Wrapping the page in `'use cache'` with `cacheLife('max')` caches it, but request-time APIs now read real values again. If a page truly must stay static, Next.js 16.4 added `export const ensureStatic = 'navigation'`, which fails the build if anything dynamic sneaks in. That is a better guarantee than the old behavior, which silently handed your component empty cookies.

**`use cache` does not persist like the Data Cache did.** This is the one no codemod will warn you about. The old `fetch` Data Cache and `unstable_cache` persisted entries across deployments and serverless instances. `'use cache'` defaults to in-memory storage, scoped to one instance and one deployment. On serverless, a function you migrated from `unstable_cache` can quietly go from a near-100% hit rate to recomputing on every cold start. If that data is expensive, use `'use cache: remote'` or configure a cache handler, and still expect a recompute after each deploy.

There's a cousin trap in dynamic routes: `generateStaticParams` returning `[]` used to mean "render everything on first visit." With Cache Components it errors. Return at least one real param so Next.js can validate a non-empty static shell; unlisted paths still render on demand.

## Migrate one route at a time

You don't need a big-bang branch. Enable the flag, then run the codemod that adds `export const instant = false` to every page, layout, and default:

```bash
npx @next/codemod@canary cache-components-instant-false ./app
```

That marks each segment as allowed to block, so the app builds while dev-mode validation is deferred. One check is not deferrable: synchronous calls like `new Date()`, `Math.random()`, and `crypto.randomUUID()` during prerender still fail the build. Move them behind `await connection()` inside a `<Suspense>` boundary, or into a Client Component. Then remove `instant = false` from one route, follow the insights in the dev overlay (cache it, or wrap it in Suspense), and repeat. Pass `./src/app` if you use a `src/` directory; a wrong path reports `0 ok` instead of failing.

Two things you can leave alone for now: `unstable_cache` keeps working, and `React.cache` still deduplicates within a render. Migrate them when the persistence tradeoff above makes sense for your data.

## The takeaway

The old configs answered "is this route static?" Cache Components asks a better question: "which pieces of this route are cached, and for how long?" The answer now sits next to the code that fetches the data instead of at the top of a file. Start with the route that has the most stacked exports, delete what the new defaults make redundant, and check every migrated `unstable_cache` call for persistence before you ship. The [official migration guide](https://nextjs.org/docs/app/guides/migrating-to-cache-components) covers every config in detail, and the [`cacheLife` reference](https://nextjs.org/docs/app/api-reference/functions/cacheLife) has the exact profile timings.
