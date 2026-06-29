---
date: "2026-06-29T07:08:24.000+00:00"
tags: ["javascript", "web-apis", "routing", "spa"]
draft: false
title: "The Navigation API: Stop Wrestling with history.pushState"
image: "/images/posts/the-navigation-api-stop-wrestling-with-history-pushstate.jpg"
topic: "development"
description: "The Navigation API hit Baseline in early 2026, giving SPAs a single, purpose-built place to intercept and manage routing. Here's why it finally replaces the History API."
---

If you have ever hand-rolled a router, you know the ritual. You call `history.pushState`, then you wire up a `popstate` listener, then you discover `popstate` does not fire for `pushState` so you patch the URL change separately, then you intercept every link click yourself, then you give up and reach for a framework router. The History API was never designed for single-page apps. It was a thin patch bolted onto multi-page navigation, and we have spent more than a decade working around its gaps.

The Navigation API is the fix, and as of early 2026 it is finally something you can ship. It reached Baseline Newly Available in January 2026, with support in Chrome, Edge, Firefox 147, and Safari 26.2. That means a centralized, purpose-built interface for client-side routing now works across every major engine on desktop and mobile.

## One event to rule every navigation

The core idea is a single `navigate` event on the global `navigation` object. It fires for _every_ kind of navigation: a link click, a form submission, a programmatic call, even a back/forward button press. Instead of scattering click handlers across your app and praying you caught them all, you handle routing in one place.

```js
navigation.addEventListener("navigate", (navigateEvent) => {
  // Let the browser handle anything we shouldn't touch.
  if (shouldNotIntercept(navigateEvent)) return;

  const url = new URL(navigateEvent.destination.url);

  if (url.pathname.startsWith("/articles/")) {
    navigateEvent.intercept({
      async handler() {
        renderPlaceholder();
        const content = await getArticleContent(url.pathname);
        renderArticle(content);
      },
    });
  }
});
```

That `intercept({ handler })` call is the heart of it. It tells the browser "I am taking over this navigation, it is a same-document update, and it may take a moment." If your handler returns a promise (which an `async` function does automatically), the browser knows exactly when the navigation starts, finishes, or fails. That is a real semantic the platform understands now, which is why Chrome shows its native loading indicator and enables the stop button during your async route change. You get accessibility wins for free that you simply could not get by mutating `history` by hand.

## The decisions the old API made you guess at

The `navigateEvent` carries the context you used to reconstruct manually. A small guard function keeps you from intercepting navigations you have no business touching:

```js
function shouldNotIntercept(navigateEvent) {
  return (
    !navigateEvent.canIntercept || // cross-origin, etc.
    navigateEvent.hashChange || // same-page anchor jump
    navigateEvent.downloadRequest || // it's a download
    navigateEvent.formData // a POST form submission
  );
}
```

`canIntercept` tells you up front whether interception is even allowed (cross-origin navigations and cross-document traversals are off limits). `hashChange` flags in-page anchor links you should leave alone. `downloadRequest` is set for `download` links. And `formData` is non-null for form POSTs, so checking it lets you handle GET navigations only. Each of these used to be a fragile inference; now they are properties on the event.

## Async routes that cancel themselves

Because handlers are async, a user can start one navigation and then fire another before the first finishes. The History API gave you nothing here. The Navigation API hands you an `AbortSignal` on the event that fires the moment your navigation becomes redundant, and you can pipe it straight into `fetch`:

```js
navigateEvent.intercept({
  async handler() {
    renderPlaceholder();
    const res = await fetch(`/api/content?path=${url.pathname}`, {
      signal: navigateEvent.signal,
    });
    renderArticle(await res.json());
  },
});
```

If the user clicks a different link mid-load, the in-flight request is cancelled, the promise rejects, and your stale DOM update never runs. No race conditions, no flicker of the wrong page.

Beyond routing, the API also exposes the full history as `navigation.entries()`, a clean `navigation.currentEntry`, and methods like `navigation.navigate(url)`, `navigation.back()`, and `navigation.traverseTo(key)` that all return objects you can `await`. It is the API the web should have had all along.

You probably will not rip out your framework's router tomorrow, and you may still want a tiny polyfill for the long tail of old browsers. But if you are building something custom, or you just want to understand what the next generation of routers is built on, the Navigation API is worth an afternoon. Start with the [Chrome for Developers guide](https://developer.chrome.com/docs/web-platform/navigation-api) and the [MDN reference](https://developer.mozilla.org/en-US/docs/Web/API/Navigation_API), then go delete some `popstate` code.
