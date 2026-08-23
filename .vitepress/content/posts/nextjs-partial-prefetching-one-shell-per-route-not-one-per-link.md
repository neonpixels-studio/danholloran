---
date: "2026-08-23T02:07:37.000-05:00"
tags: ["next.js", "react", "performance", "javascript"]
draft: false
title: "Next.js Partial Prefetching: One Shell Per Route, Not One Per Link"
image: "/images/posts/nextjs-partial-prefetching-one-shell-per-route-not-one-per-link.jpg"
topic: "development"
description: "Next.js 16.3 stops firing a prefetch request for every link in the viewport and caches one reusable loading shell per route instead. Here's what changes and how to turn it on."
---

Open the Network tab on a production Next.js app and scroll a page with a long list of links. You get a waterfall of prefetch requests, one per link, most of them hitting the same route with different params. A sidebar with twenty chat threads fires twenty requests to render twenty variations of the same `/chat/[id]` page. The Next.js team's own writeup calls this "ridiculous," which is refreshingly blunt for a framework changelog.

Next.js 16.3 replaces that model. Instead of prefetching a page per link, it prefetches a reusable shell per route and caches it on the client for the session. Vercel calls this Partial Prefetching, and it ships as part of a bundle of opt-in behaviors called Instant Navigations.

## Two gaps, two different fixes

A navigation feels slow for two independent reasons. The client has to talk to the server, which costs a network roundtrip. And the server has to actually generate a response, which costs however long your data layer takes.

Server Components fixed a lot of things but made this worse in one specific way: click a link, nothing happens, then the whole page appears. That's the server-generation gap. Under Cache Components, Next.js now forces you to make an explicit choice for every route that awaits data. Stream it with `<Suspense>` so the user sees a loading state immediately. Cache it with `'use cache'` so the user sees previously rendered UI immediately. Or deliberately opt out:

```tsx
// app/posts/[slug]/page.tsx
export const instant = false;
```

That last one is a real option, not a failure state. A blog post route may genuinely be better off blocking than flashing a skeleton for 80ms. Marking it `instant = false` tells the framework you meant it, and the dev-mode warning goes away.

Partial Prefetching handles the other gap: the network hop. If the shell for `/chat/[id]` is already sitting in the client cache before you click, there is no roundtrip at click time at all.

## Turning it on

Both behaviors are gated behind config flags in 16.3, and both are slated to become defaults in a future major:

```ts
// next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
};

export default nextConfig;
```

`cacheComponents` is the prerequisite. It's the flag that turns on the `'use cache'` model and, with it, the dynamic-by-default behavior with no implicit caching. If you're upgrading an existing app, expect this to surface routes you didn't know were blocking. That's the point. The new Instant Insights panel in DevTools lists every navigation that isn't instant, so you work a queue instead of guessing.

There's also a Navigation Inspector that pauses a navigation at the shell so you can see exactly what a user would see mid-load. This matters more than it sounds, because prefetching is disabled in development, which historically made loading states nearly impossible to eyeball.

## Prefetching more than the shell

The shell is the new baseline, and it is deliberately small. Sometimes that's not enough. If you want a chat header or a product title to pop in instantly rather than stream, opt that specific link into deeper prefetching:

```tsx
<Link href={`/chat/${id}`} prefetch={true}>
  {thread.title}
</Link>
```

Even then, Next.js won't try to render the whole route. It renders down to whatever is available synchronously, derivable from the URL params or search params, or marked `'use cache'`. So `prefetch={true}` is no longer the all-or-nothing hammer it used to be. Pair it with `'use cache'` on the components you want warm, and you get a graded response instead of a binary one.

## Keeping it from rotting

The failure mode here is subtle. A route navigates instantly today. Six weeks from now someone adds a `cookies()` read to a shared header, the route de-opts to request-time rendering, and the instant UI quietly disappears. Nothing errors. Nothing fails CI.

16.3 ships an `instant()` Playwright helper that asserts what must be visible without waiting on the network:

```ts
import { expect, test } from "@playwright/test";
import { instant } from "@next/playwright";

test("product title is available immediately", async ({ page }) => {
  await page.goto("/products/shoes");

  await instant(page, async () => {
    await page.click('a[href="/products/hats"]');
    await expect(page.locator("h1")).toContainText("Baseball Cap");
    await expect(page.getByText("Checking inventory...")).toBeVisible();
  });

  await expect(page.getByText("12 in stock")).toBeVisible();
});
```

Write one of these for the two or three navigations users actually notice and you've turned a perception problem into a test failure.

## Worth trying now

If you're already on 16.x, `npm install next@latest` gets you the non-flagged wins for free: up to 90% less dev-server memory, cached repeat builds, and roughly 22% more requests handled under load from swapping web streams for native Node streams. None of that requires touching your code.

The flags are the bigger commitment. Turn on `cacheComponents` in a branch, let Instant Insights tell you which routes are blocking, and decide per route whether you want to stream, cache, or block. The answer won't be the same for all of them, and that's the improvement.
