---
date: "2026-07-16T02:08:01.000-05:00"
tags: ["javascript", "performance", "web-apis", "core-web-vitals"]
draft: false
title: "The Soft Navigations API: Core Web Vitals Finally Work in SPAs"
image: "/images/posts/soft-navigations-api-core-web-vitals-finally-work-in-spas.jpg"
topic: "development"
description: "Chrome ships the Soft Navigations API unflagged in 151, giving single-page apps a standardized way to measure LCP, INP, and CLS per route change instead of only on the first load."
---

Here's an uncomfortable fact about every SPA you've ever shipped: your Core Web Vitals numbers describe the first page the user landed on, and nothing after that. Someone loads your product listing, clicks through to a detail page, then a checkout, then a confirmation — four "pages" as far as they're concerned — and your RUM data has exactly one LCP value, from the landing. The three route changes that followed are invisible.

That's not a tooling gap, it's an architectural one. The browser finalizes LCP on the first interaction, and it only resets metrics on a real navigation. A soft navigation — JavaScript swapping the DOM and calling `pushState` — isn't a navigation from the browser's point of view. It's still the same page it loaded twenty minutes ago. Chrome is fixing this, and as of the June 2026 Intent to Ship, the Soft Navigations API lands unflagged in **Chrome 151**.

## What actually counts as a soft navigation

Chrome had to pin down a definition that works across React Router, Nuxt, SvelteKit, and whatever else, without asking any of them to opt in. Three conditions, all required:

- The navigation is initiated by a user action.
- It results in a visible URL change.
- The interaction results in a visible paint.

Note what's _not_ in there: no framework hook, no `emit('navigation')` call. This is deliberate. Chrome explicitly rejected building on top of the Navigation API or letting frameworks declare navigations themselves, for two reasons — it means every existing SPA gets measured with zero code changes, and it means the definition is consistent no matter how a given framework handles routing. A `replaceState` counts too, added after developer feedback that filter and tab changes often _are_ navigations to users.

The tradeoff is honest false positives and false negatives. A tab switch that changes the URL and paints will register as a navigation whether you consider it one or not.

## The two new entries

The API adds `soft-navigation` and `interaction-contentful-paint` performance entries. Feature-detect before you observe:

```js
if (PerformanceObserver.supportedEntryTypes.includes("soft-navigation")) {
  const observer = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      // entry.name        → the new URL
      // entry.navigationId → unique per navigation (same URL can repeat)
      // entry.interactionId → the interaction that triggered it
      // entry.startTime   → when the interaction started
      console.log(entry.name, entry.navigationId);
    }
  });
  observer.observe({ type: "soft-navigation", buffered: true });
}
```

`supportedEntryTypes` is frozen on first use, so if you're activating this via an origin trial token injected at runtime, check `'SoftNavigationEntry' in window` instead.

LCP for soft navigations comes from `interaction-contentful-paint`, and this is where it gets subtle. Those entries fire for _every_ interaction that paints, not just navigating ones — so you can't just take the latest. Map them by `interactionId` back to the `soft-navigation` entry, not by `navigationId`, because a paint can land before the URL updates and carry the previous navigation's ID. The `soft-navigation` entry also exposes `getLargestInteractionContentfulPaint()`, which hands you the largest paint seen so far so you don't have to buffer and look backwards.

One more gotcha: all timings are still relative to the original hard navigation. To get an LCP that means anything, subtract the soft navigation's `startTime`:

```js
const lcp = icpEntry.largestContentfulPaint.startTime - softNavEntry.startTime;
```

And that `startTime` is the interaction start — the click — not a commit point. It includes your event handler code, which hard navigations don't. Your numbers will look worse than you expect, and they should.

## Don't hand-roll this

Everything above is why you should reach for the [`web-vitals` library](https://github.com/GoogleChrome/web-vitals) instead. The `soft-navs` branch has experimental support and handles the ID mapping, the start-time math, and URL attribution for you:

```js
import {
  onLCP,
  onCLS,
  onINP,
} from "https://unpkg.com/web-vitals@soft-navs/dist/web-vitals.js?module";

onLCP(reportSoftNav, { reportSoftNavs: true });
onCLS(reportSoftNav, { reportSoftNavs: true });
onINP(reportSoftNav, { reportSoftNavs: true });
```

It reports TTFB as `0` for soft navigations — same convention as bfcache restores — because "first byte" is meaningless when the content may already be in memory. It's still on a branch, not the stable release, so pin it and watch for changes.

Two things worth planning for. This is Chromium-only, so a chunk of your traffic won't report soft-nav metrics at all; if you need cross-browser comparison or historical continuity, measure both ways and beacon twice. And slicing by soft navigation means your _hard_ navigation metrics get finalized earlier than they used to — the first route change now closes the book on the landing page's CLS and INP.

Before you write a line of code, open DevTools' Performance panel and record a trace. Soft navigation markers have shown up there since Chrome 145, no flag needed, marked with a `*`. It's the fastest way to find out whether Chrome's definition agrees with yours — and if it doesn't, the [WICG repo](https://github.com/WICG/soft-navigations/issues) is still taking feedback while changing the API is cheap.
