---
date: "2026-07-06T02:08:23.000-05:00"
tags: ["web-apis", "javascript", "routing"]
draft: false
title: "URLPattern: The Browser Finally Has a Built-In Router"
image: "/images/posts/urlpattern-the-browser-finally-has-a-built-in-router.jpg"
topic: "development"
description: "URLPattern went Baseline in late 2025, giving the platform a native, framework-free way to match and parse URLs. Here is how it works and where it earns its place."
---

Every router you have ever used, from Express to React Router, solves the same small problem in its own slightly different way: take a URL, check it against a pattern, and pull out the interesting pieces. `/products/:category/:id` should match `/products/audio/42` and hand you back `category` and `id`. For years the browser had no opinion about this, so we reached for `path-to-regexp`, hand-rolled regular expressions, or leaned on whatever our framework shipped.

That gap is closed now. `URLPattern` went [Baseline Newly available](https://web.dev/blog/baseline-urlpattern) in September 2025, which means Chrome, Edge, Firefox, and Safari all ship it in their current stable versions. It is a real routing primitive baked into the platform, with a syntax borrowed directly from `path-to-regexp`, so most of what you already know carries over.

## Matching and extracting in two methods

You construct a pattern, then use one of two methods against a URL. `test()` returns a boolean. `exec()` returns a match object with the captured groups, or `null` when there is no match.

```js
const pattern = new URLPattern({ pathname: "/products/:category/:id" });

pattern.test("https://shop.example.com/products/audio/42");
// true

const match = pattern.exec("https://shop.example.com/products/audio/42");
match.pathname.groups;
// { category: 'audio', id: '42' }
```

Named groups (`:category`) surface as properties on `groups`. Anonymous wildcards (`*`) show up as numeric indexes, `0` for the leftmost. You can also constrain a group with a regular expression, so `:id(\\d+)` only matches when the segment is all digits. That one detail removes a whole category of "why did my route match the wrong thing" bugs.

The constructor is flexible about input. Pass a single string for a full URL pattern, an object to target specific components, or a string plus a `baseURL` when you want a relative pattern resolved against an origin. One caveat worth internalizing: with the object form, any component you omit defaults to the `*` wildcard, but with the string form an absent component is treated as an empty string that only matches when empty. So `new URLPattern({ pathname: '/foo' })` ignores the query string, while `new URLPattern('/foo', location.origin)` will not match a URL that has one.

## Where it actually earns its place

The obvious use is a client-side router with no dependency. A tiny table of patterns is enough to dispatch to views:

```js
const routes = [
  { pattern: new URLPattern({ pathname: "/" }), view: renderHome },
  {
    pattern: new URLPattern({ pathname: "/products/:category/:id" }),
    view: renderProduct,
  },
  { pattern: new URLPattern({ pathname: "/about" }), view: renderAbout },
];

function route(url) {
  for (const { pattern, view } of routes) {
    const match = pattern.exec(url);
    if (match) return view(match.pathname.groups);
  }
  return renderNotFound();
}
```

The place `URLPattern` really pulls ahead of most libraries is the origin. Unlike routers that only care about the pathname, it can match protocol, hostname (with wildcards), and port. That makes it a clean fit inside a service worker's `fetch` handler, where you genuinely need to reason about cross-origin requests and pick a caching strategy per pattern:

```js
const imageCdn = new URLPattern({
  hostname: ":sub.cdn.example.com",
  pathname: "/*.:ext(jpg|png|webp)",
});

self.addEventListener("fetch", (event) => {
  if (imageCdn.test(event.request.url)) {
    event.respondWith(cacheFirst(event.request));
  }
});
```

No `url.includes()` guesswork, no brittle regex escaping. And because the syntax is shared, the same mental model applies whether you are routing in the main thread, a worker, or increasingly on the server.

## The tradeoffs

It is not a full framework router. There is no built-in link interception, no history management, no nested layout resolution. Pair it with the [Navigation API](https://danholloran.me/posts) for the interception half and you have a capable homegrown setup, but if you want batteries included, your framework's router still does more. Templating is another gap: `path-to-regexp` can reverse a pattern back into a URL, and `URLPattern` cannot do that yet.

Support is Baseline Newly available, not Widely available, so if you ship to older browsers or run in a Node version without it, the [`urlpattern-polyfill`](https://github.com/kenchris/urlpattern-polyfill) fills in, and a quick `'URLPattern' in globalThis` check lets you load it only where it is missing. For a small SPA, a service worker, or any place you were about to add a routing dependency, it is worth reaching for the built-in first.
