---
date: "2026-10-26T07:40:13.000-07:00"
tags: ["nuxt.js", "vue", "performance", "node"]
draft: false
title: "Nuxt SSR Streaming: Faster TTFB and the Response You Can't Change Later"
image: "/images/posts/nuxt-ssr-streaming-faster-ttfb-and-the-response-you-cant-change-later.jpg"
topic: "development"
description: "Nuxt 4.5 can flush your HTML shell before the page finishes rendering. Here's how to turn on experimental SSR streaming, what it actually speeds up, and the one rule about status codes, headers, and cookies you need to know first."
---

Classic server rendering in Nuxt is all or nothing. The server runs every plugin, resolves every awaited `useFetch`, renders the whole Vue tree to a string, and only then sends a single byte back. If one API call on the page takes 600ms, the browser sits staring at a blank tab for 600ms, unable to even start downloading your CSS. Streaming SSR has been one of the longest-standing open issues in the Nuxt repo, and as of Nuxt 4.5 it finally ships behind a flag.

The win is real, but it comes with a contract change that is easy to trip over. Once the first byte is on the wire, the HTTP status and headers are locked in. Let's look at both halves.

## Turning it on

Streaming is experimental and off by default. Enable it in `nuxt.config.ts`:

```ts
export default defineNuxtConfig({
  experimental: {
    ssrStreaming: true,
  },
});
```

With this on, Nuxt immediately flushes an HTML shell (your `<head>`, styles, preload hints, and entry scripts) and then streams the body as Vue renders it. The browser can start fetching CSS, fonts, and the JS entry chunk while your server is still waiting on that slow API.

Bots and crawlers are excluded by default, so Googlebot and friends still get a fully buffered response. If you have an internal crawler or a link-preview service that chokes on streamed HTML, you can widen the match:

```ts
export default defineNuxtConfig({
  experimental: {
    ssrStreaming: {
      botRegex: /googlebot|bingbot|slackbot|my-internal-crawler/i,
    },
  },
});
```

Be realistic about what improves. Time to First Byte drops reliably, because the shell no longer waits on your data. Largest Contentful Paint _may_ improve, depending on how much of the route's JavaScript overlaps the entry chunk and whether your LCP element sits behind the slow fetch. A page whose hero is rendered from an awaited API call still has to wait for that call before the hero arrives; you just stop wasting that time on idle network.

## The rule: the response is committed at byte one

HTTP sends the status line and headers before the body. A buffered renderer can change its mind right up until the end. A streaming renderer cannot. Anything that tries to mutate the response _after_ rendering has begun simply can't reach the client.

That covers more code than you might expect:

```vue
<!-- pages/products/[slug].vue -->
<script setup lang="ts">
const route = useRoute();
const { data: product } = await useFetch(`/api/products/${route.params.slug}`);

if (!product.value) {
  // Too late under streaming: a 200 has already been sent
  setResponseStatus(useRequestEvent()!, 404);
}

// Also too late: the Set-Cookie header is already gone
const lastViewed = useCookie("last-viewed");
lastViewed.value = String(route.params.slug);
</script>
```

The release notes call out `setResponseStatus()` in `<script setup>` and cookie writes during middleware as typical cases. Nuxt does not fail silently here: in development it logs a warning naming each dropped mutation. Treat those warnings as bugs, not noise.

Nuxt also handles the common cases for you. Routes with `redirect`, `cache`, `isr`, `swr`, `noScripts`, or `ssr: false` route rules automatically fall back to the buffered renderer, so caching and redirect setups keep working.

## Living with it: opt out where the response matters

The pragmatic approach is to stream the routes where the response is boring (marketing pages, docs, blog posts, dashboards behind auth) and keep buffering the ones that need to set status codes or cookies based on rendered data. Per-route opt-out uses `routeRules`:

```ts
export default defineNuxtConfig({
  experimental: {
    ssrStreaming: true,
  },
  routeRules: {
    "/products/**": { streaming: false },
    "/checkout/**": { streaming: false },
  },
});
```

For logic that doesn't depend on rendered output, move it earlier instead of opting out. Nitro server middleware runs before the renderer starts, so headers and cookies set there are still in time:

```ts
// server/middleware/visitor-id.ts
export default defineEventHandler((event) => {
  if (!getCookie(event, "visitor-id")) {
    setCookie(event, "visitor-id", crypto.randomUUID(), {
      httpOnly: true,
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 365,
    });
  }
});
```

A quick checklist before you flip the flag on a real app:

1. Search for `setResponseStatus`, `setHeader`, `setResponseHeader`, and cookie writes in `pages/`, `layouts/`, `components/`, and route middleware.
2. Run the app in dev with streaming on and click through your key routes, watching for dropped-mutation warnings.
3. Decide per route: move the logic into server middleware, or add `streaming: false`.
4. Check that 404 pages still return 404 (curl with `-I` is enough), because a soft 404 is an SEO problem you won't see in the browser.

## Where this leaves you

SSR streaming is the kind of feature that rewards a careful rollout: turn it on, read the dev warnings, opt out the handful of routes that need control of their response, and measure TTFB and LCP before and after rather than assuming. Because it is still experimental, expect the details to shift as the Nuxt team works toward v5. The [Nuxt 4.5 release post](https://nuxt.com/blog/v4-5) and the [original pull request](https://github.com/nuxt/nuxt/pull/34411) are the best places to track the fallback rules and caveats as they evolve.
