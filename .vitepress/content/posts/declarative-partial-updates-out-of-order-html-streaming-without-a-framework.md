---
date: "2026-08-20T02:07:27.000-05:00"
tags: ["javascript", "web-apis", "performance", "frontend"]
draft: false
title: "Declarative Partial Updates: Out-of-Order HTML Streaming Without a Framework"
image: "/images/posts/declarative-partial-updates-out-of-order-html-streaming-without-a-framework.jpg"
topic: "development"
description: "Chrome 148 ships experimental support for filling HTML placeholders out of order and streaming markup into the DOM. Here's how the new template-for and streamHTML APIs work, and what they replace."
---

HTML has one stubborn rule that has quietly shaped a decade of frontend architecture: it renders in the order it arrives. If the third section of your page needs a slow database query, everything after it waits. The usual escape hatches are all compromises. You buffer the whole response and give up streaming entirely, you reorder with CSS and break the accessibility tree, or you ship a framework whose main job is turning that server delay into a client-side spinner.

Chrome 148 has an experimental answer that skips all three. Under the umbrella name **Declarative Partial Updates**, two related APIs let the server send a placeholder now and fill it in later, and let JavaScript stream markup into an element instead of waiting for the full string. They are behind `chrome://flags/#enable-experimental-web-platform-features` today, with polyfills on npm and positive noises from other vendors.

## Placeholders you fill in later

The declarative half revives something HTML has ignored for its entire life: processing instructions. In XML they carry metadata; in HTML they have always been parsed as comments and thrown away. The new API gives them a job.

```html
<div><?marker name="user-panel"></div>

<!-- ...the rest of the page streams... -->

<template for="user-panel"> Welcome back, <strong>Dan</strong>. </template>
```

When the parser reaches `<template for="user-panel">`, it finds the matching `<?marker>` and swaps its own content in. The DOM you end up with contains no marker and no template, just the paragraph. The server never had to hold back the rest of the document while it waited on that user lookup.

There is a range form too, which is the one you will reach for most, because it gives you a loading state for free:

```html
<ul id="results">
  <?start name="results">
  <li class="skeleton">Loading…</li>
  <?end>
</ul>
```

Everything between `<?start>` and `<?end>` renders immediately and gets replaced when the template shows up. Better still, a template can re-emit a marker, which turns this into an append loop. Stream one `<template for="results">` per row as your query yields them, each ending with `<?marker name="results">`, and the list grows in place. No `appendChild`, no framework, no client-side JavaScript at all.

The scoping rule is the important restriction: a `<template for>` can only patch markers inside its own parent element. That is deliberate, and it means a template dropped into `<body>` has reach over the entire document including `<head>`. Worth knowing before you generate one from user input.

## The JavaScript side got a rewrite too

The second half addresses a mess most of us have stopped noticing. Ask yourself, honestly, which of `innerHTML`, `setHTML`, `setHTMLUnsafe`, `insertAdjacentHTML`, and `createContextualFragment` sanitize their input, which run `<script>` tags, and which respect Trusted Types. Nobody remembers, because the answers were never consistent.

The proposal replaces that with a grid you can actually reason about. Six positions, each with a static and a streaming form:

| Action                     | Static                         | Streaming                                  |
| -------------------------- | ------------------------------ | ------------------------------------------ |
| Replace contents           | `setHTML()`                    | `streamHTML()`                             |
| Replace the element itself | `replaceWithHTML()`            | `streamReplaceWithHTML()`                  |
| Insert as first child      | `prependHTML()`                | `streamPrependHTML()`                      |
| Insert as last child       | `appendHTML()`                 | `streamAppendHTML()`                       |
| Insert before / after      | `beforeHTML()` / `afterHTML()` | `streamBeforeHTML()` / `streamAfterHTML()` |

Every one has an `Unsafe` twin. The naming is the whole point: the plain versions sanitize by default, the `Unsafe` versions do not and additionally accept `runScripts: true` if you actually want scripts to execute. The word "unsafe" is a speed bump, not a prohibition.

The streaming versions are the genuinely new capability. They return a `WritableStream`, so a fetch response can go straight into the DOM as it arrives:

```js
const el = document.querySelector("#content");
const response = await fetch("/api/content.html");

response.body
  .pipeThrough(new TextDecoderStream())
  .pipeTo(el.streamHTMLUnsafe());
```

That is the thing SPAs have never been able to do. Initial page loads have always streamed; every client-side route change since has thrown that away and waited for a complete payload before touching the DOM.

## Where this actually goes

The two halves compose, and that is where it gets interesting. Because `streamHTMLUnsafe()` behaves like the main parser, it processes `<template for>` instructions as they land. So a client-side route change can be an outline page full of markers plus a stream of templates slotting into them, with no per-element `querySelector` bookkeeping. That is a surprising amount of a component framework, expressed in markup.

Temper expectations on timing. This is one engine, behind a flag, and the sanitizer that `setHTML` depends on is still missing in Safari. The two polyfills (`template-for-polyfill` and `html-setters-polyfill`) are worth a spike, but read the fine print: the setters polyfill buffers rather than streams, so it gives you the API shape without the performance win. Treat it as a preview of where the platform is heading, not something to put in front of users this quarter.

Sources: [Declarative partial updates (Chrome for Developers)](https://developer.chrome.com/blog/declarative-partial-updates) and the [WICG explainer](https://github.com/WICG/declarative-partial-updates).
