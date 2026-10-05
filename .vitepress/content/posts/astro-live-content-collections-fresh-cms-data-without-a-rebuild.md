---
date: "2026-10-05T02:15:44.000-07:00"
tags: ["jamstack", "javascript", "typescript", "performance"]
draft: false
title: "Astro Live Content Collections: Fresh CMS Data Without a Rebuild"
image: "/images/posts/astro-live-content-collections-fresh-cms-data-without-a-rebuild.jpg"
topic: "development"
description: "Astro's live content collections fetch CMS and API data at request time with the same typed API as build-time collections, and Astro 7's route caching keeps them fast."
---

Every Jamstack site eventually hits the same wall. The marketing team fixes a typo in the CMS, hits publish, and then asks why the site still shows the old copy. The honest answer is "because the site is a pile of HTML that was generated twenty minutes ago, and the rebuild is still in the queue." Webhooks, incremental builds, and on-demand revalidation all exist to paper over that gap, and each one adds another moving part you have to babysit.

Astro's answer is live content collections. They shipped as stable in Astro 6 and picked up first-class caching in Astro 7. The pitch is simple: keep the content collection API you already know, but fetch the data when the page is requested instead of when the site is built. No rebuild, no webhook, and the same typed `entry.data` you get from build-time collections.

## Build-time vs. live: two configs, one mental model

Build-time collections live in `src/content.config.ts`, run their loaders during `astro build`, and persist the results in Astro's data store. That is still the right default. It is fast, works with MDX, and lets Astro optimize images.

Live collections live in a separate file, `src/live.config.ts`, and use `defineLiveCollection()`. They require an adapter for on-demand rendering, because the whole point is that the data is fetched per request. There are no built-in live loaders, so you write one or install a community loader.

A live loader is an object with a `name` and two methods: `loadCollection()` for lists and `loadEntry()` for a single item. Each returns data or an `Error`, never throws.

```ts
// src/loaders/changelog.ts
import type { LiveLoader } from "astro/loaders";

interface Release {
  id: string;
  title: string;
  html: string;
  updatedAt: string;
}

export function changelogLoader(opts: {
  apiUrl: string;
  token: string;
}): LiveLoader<Release, { id: string }, { tag?: string }> {
  const headers = { Authorization: `Bearer ${opts.token}` };

  return {
    name: "changelog-loader",
    loadCollection: async ({ filter }) => {
      try {
        const qs = filter?.tag ? `?tag=${encodeURIComponent(filter.tag)}` : "";
        const res = await fetch(`${opts.apiUrl}/releases${qs}`, { headers });
        const releases: Release[] = await res.json();
        return {
          entries: releases.map((r) => ({ id: r.id, data: r })),
          cacheHint: { tags: ["releases"] },
        };
      } catch (error) {
        return {
          error: new Error("Failed to load releases", { cause: error }),
        };
      }
    },
    loadEntry: async ({ filter }) => {
      try {
        const res = await fetch(`${opts.apiUrl}/releases/${filter.id}`, {
          headers,
        });
        if (res.status === 404)
          return { error: new Error("Release not found") };
        const r: Release = await res.json();
        return {
          id: r.id,
          data: r,
          rendered: { html: r.html },
          cacheHint: {
            tags: [`release-${r.id}`],
            lastModified: new Date(r.updatedAt),
          },
        };
      } catch (error) {
        return { error: new Error("Failed to load release", { cause: error }) };
      }
    },
  };
}
```

Then register it. The Zod schema is optional, but if you provide one it wins over the loader's generic types and validation errors come back as a typed error instead of a crash:

```ts
// src/live.config.ts
import { defineLiveCollection } from "astro:content";
import { z } from "astro/zod";
import { changelogLoader } from "./loaders/changelog";

const releases = defineLiveCollection({
  loader: changelogLoader({
    apiUrl: import.meta.env.CMS_URL,
    token: import.meta.env.CMS_TOKEN,
  }),
  schema: z.object({
    id: z.string(),
    title: z.string(),
    html: z.string(),
    updatedAt: z.coerce.date(),
  }),
});

export const collections = { releases };
```

## Querying live data with explicit errors

On the page side you swap `getEntry()` for `getLiveEntry()` and `getCollection()` for `getLiveCollection()`. The difference that matters is the return shape: you get `{ entry, error }` back rather than an exception, which forces you to decide what a CMS outage looks like for your users.

```astro
---
// src/pages/changelog/[id].astro
export const prerender = false;
import { getLiveEntry, render } from 'astro:content';
import { LiveEntryNotFoundError } from 'astro/content/runtime';

const { entry, error } = await getLiveEntry('releases', Astro.params.id);

if (error) {
  if (error instanceof LiveEntryNotFoundError) return Astro.rewrite('/404');
  return new Response('Changelog temporarily unavailable', { status: 503 });
}

Astro.cache.set(entry);
Astro.cache.set({ maxAge: 300, swr: 60 });

const { Content } = await render(entry);
---
<h1>{entry.data.title}</h1>
<Content />
```

The error union is narrow: `LiveEntryNotFoundError`, `LiveCollectionValidationError`, `LiveCollectionCacheHintError`, or a generic `LiveCollectionError`. Because the loader returned a `rendered.html` property, `render()` and `<Content />` work exactly like they do for Markdown collections.

## Caching is what makes this not-a-regression

Fetching from a CMS on every request is slower than serving static HTML, and the Astro docs say so plainly. That is where Astro 7's route caching comes in. Configure a provider once (the in-memory one for Node, or the experimental CDN providers for Netlify, Vercel, and Cloudflare) and pass the live entry to `Astro.cache.set()`. Astro pulls the loader's cache hint off it, tagging the response and setting `Last-Modified` for you. Multiple `set()` calls merge: tags accumulate, `lastModified` takes the newest date, and `maxAge` is last-write-wins.

Invalidation then becomes a tiny endpoint your CMS webhook can hit:

```ts
// src/pages/api/revalidate.ts
export async function POST({ request, cache }) {
  const { id } = await request.json();
  await cache.invalidate({ tags: [`release-${id}`] });
  return Response.json({ purged: id });
}
```

Notice the inversion. In the classic Jamstack setup, the webhook triggers a full rebuild. Here it purges one cache tag, and the next request fetches fresh data.

## When to stay on build-time collections

Live collections give up a few things: no MDX rendering at runtime, no image optimization, and no persistence in the content layer data store. If your content changes a few times a week, build-time collections plus a deploy hook are still simpler and faster. Reach for live collections when freshness is the feature: inventory, pricing, changelogs, CMS draft previews, or filters driven by request parameters.

The nice part is you don't have to pick one for the whole site. Both kinds coexist, so your docs can stay static while the one page that always goes stale finally doesn't. Start with the [content collections guide](https://docs.astro.build/en/guides/content-collections/#live-content-collections) and the [route caching docs](https://docs.astro.build/en/guides/caching/), and try converting your most-complained-about page first.
