---
date: "2026-11-01T02:15:35.000-08:00"
tags: ["web-performance", "performance", "javascript", "web-apis"]
draft: false
title: "bfcache: The Instant Back Button Your Site Is Probably Blocking"
image: "/images/posts/bfcache-the-instant-back-button-your-site-is-probably-blocking.jpg"
topic: "development"
description: "The back/forward cache restores whole pages from memory in an instant, but an unload listener, a no-store header, or an open connection can quietly opt you out. Here's how to find and fix the blockers."
---

You can spend weeks shaving 200ms off your Largest Contentful Paint and still lose to a feature you never touched. Chrome's usage data shows that about 1 in 10 desktop navigations and 1 in 5 mobile navigations are a back or forward button press. For those navigations, the browser can skip the network entirely and restore the page from memory, scroll position, JavaScript heap and all. That's the back/forward cache, or bfcache, and it ships in Chrome, Firefox, and Safari.

The catch is that the browser decides whether your page is _eligible_, and a lot of ordinary code makes it ineligible. Nothing errors. Nothing logs. The back button just feels like a fresh page load, and you never find out why.

## How bfcache differs from the HTTP cache

The HTTP cache stores responses. bfcache stores the whole live page. When a user navigates away, the browser freezes the document instead of destroying it: pending timers and unresolved promises are paused, and the task queues stop processing. If the user comes back soon, the browser unpauses everything and shows the page as it was.

That's why a bfcache restore beats even a perfectly tuned HTTP-cached load. There's no parsing, no script execution, no hydration. It also means your code needs to cope with a page that "wakes up" rather than loads. The `pageshow` event is your hook for that, and its `persisted` property tells you which kind of show it was:

```js
window.addEventListener("pageshow", (event) => {
  if (event.persisted) {
    // Restored from bfcache: the DOM and JS state are exactly as the user left them.
    refreshCartBadge();
    refreshRelativeTimestamps();
  }
});
```

That snippet also covers the one real downside. A restored page skips revalidation, so `Cache-Control: no-cache` doesn't apply. If something like a cart count or a signed-in state could be stale, refresh it in `pageshow`.

## The usual blockers

Most ineligible pages trip on one of a short list of causes.

**`unload` listeners.** This is the big one. Firefox on desktop refuses to cache any page with an `unload` handler, and Chrome has deprecated the event entirely, so in Chrome your handler mostly won't even run. Use `pagehide` instead, which fires every time `unload` would and also when the page enters bfcache:

```js
// Before: blocks bfcache in Firefox, unreliable everywhere
window.addEventListener("unload", flushAnalytics);

// After: works with bfcache in every browser
window.addEventListener("pagehide", flushAnalytics);
```

The trap is that the `unload` listener is often not yours. An old analytics snippet or a third-party widget can add one. In Chromium you can forbid it outright with a response header, so nothing on the page can register one:

```http
Permissions-Policy: unload=()
```

**`Cache-Control: no-store` on the document.** Browsers have historically kept `no-store` pages out of bfcache. Chrome now lets some of them in, with a shorter three-minute timeout and eviction if cookies change, but other browsers still block. Reserve `no-store` for pages with sensitive data. If you just want fresh content, `no-cache` or `max-age=0` makes the browser revalidate normal loads without costing you bfcache.

**Open connections.** Some browsers won't cache a page holding an open IndexedDB connection, an in-flight `fetch()`, or a WebRTC connection, because pausing it could stall other tabs on the same origin. Chrome (as of 149) and Safari no longer block on open WebSockets, but other browsers still do. Close those connections in `pagehide` and reopen them in `pageshow`:

```js
let socket;

function connect() {
  socket = new WebSocket("wss://example.com/live");
  socket.addEventListener("message", handleMessage);
}

window.addEventListener("pagehide", () => socket?.close());
window.addEventListener("pageshow", (event) => {
  // Normal loads connect elsewhere; only reconnect on a bfcache restore.
  if (event.persisted) connect();
});

connect();
```

**`window.opener` references.** A page that opened a window it still controls, or that was opened with an opener reference, can't be cached safely. `rel="noopener"` is the default for `target="_blank"` links in modern browsers, so this usually only bites apps that use `window.open()` plus `postMessage`.

**Unconditional `beforeunload`.** It no longer blocks bfcache in modern browsers, but it's still unreliable. Attach it only while there are unsaved changes and remove it once they're saved.

## Find out why you're not getting cached

Start in DevTools: **Application → Back/forward cache → Run test**. Chrome navigates away and back, then lists every blocker, and marks the ones you can fix as **Actionable**. Lighthouse runs the same check as its bfcache audit.

Lab tests only catch what happens on your machine, though. For real users, Chrome (from version 123) exposes `notRestoredReasons` on the navigation timing entry. It's still marked experimental and is Chromium-only, so treat it as a diagnostic, not a feature:

```js
const [nav] = performance.getEntriesByType("navigation");

if (nav?.type === "back_forward" && nav.notRestoredReasons) {
  const reasons = nav.notRestoredReasons.reasons.map((r) => r.reason);
  sendToAnalytics("bfcache_miss", { url: location.pathname, reasons });
}
```

One subtlety: `notRestoredReasons` is `null` for non-history navigations and `undefined` where unsupported, and a `null` value doesn't prove the page was restored. Use `pageshow`'s `persisted` to count actual hits. Also expect a hit rate below 100% even on a perfect page. Browsers evict cached pages to save memory, and a restarted browser or a duplicated tab never uses bfcache.

One more measurement gotcha: bfcache restores replace some of your fastest page loads, so your field load metrics can look _worse_ after you fix eligibility, even though users are getting faster navigations. Segment your metrics by navigation type, and use the `web-vitals` library, which already reports bfcache restores as their own visits.

## The takeaway

bfcache is the rare performance win that's mostly deletion: remove the `unload` listener, drop `no-store` where it isn't protecting anything, and close connections on `pagehide`. Run the DevTools test on your three most-visited pages today, since a single blocker on a high-traffic template is usually the whole story. The [web.dev bfcache guide](https://web.dev/articles/bfcache) and Chrome's [notRestoredReasons docs](https://developer.chrome.com/docs/web-platform/bfcache-notrestoredreasons) cover the long tail.
