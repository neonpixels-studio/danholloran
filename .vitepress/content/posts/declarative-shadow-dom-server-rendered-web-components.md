---
date: "2026-07-13T02:07:09.000-05:00"
tags: ["javascript", "web-apis", "performance"]
draft: false
title: "Declarative Shadow DOM: Web Components That Render Before Your JavaScript Does"
image: "/images/posts/declarative-shadow-dom-server-rendered-web-components.jpg"
topic: "development"
description: "Shadow DOM used to mean a blank page until your bundle loaded. The shadowrootmode attribute changed that, and it has been in every major browser since early 2024."
---

The classic knock on web components was never encapsulation. It was the blank rectangle. You shipped a `<user-card>` to the browser, the parser saw an unknown element with nothing inside it, and the actual content did not exist until your JavaScript downloaded, parsed, executed, defined the custom element, called `attachShadow()`, and stamped a template into it. Server rendering, the thing every framework spent a decade optimizing, simply did not work: a shadow root could only be created imperatively, so there was nothing to serialize and nothing to send.

Declarative Shadow DOM fixes that at the parser level, and it is not a proposal anymore. It has shipped in every major browser since February 2024, which means it is now just how HTML works.

## The whole feature is one attribute

Put a `<template>` with a `shadowrootmode` attribute directly inside an element and the HTML parser attaches a shadow root to that element as it reads the markup. No JavaScript involved.

```html
<user-card>
  <template shadowrootmode="open">
    <style>
      :host {
        display: block;
        border: 1px solid #e2e2e2;
        border-radius: 8px;
        padding: 1rem;
      }
      ::slotted(h2) {
        margin: 0;
        font-size: 1.1rem;
      }
    </style>
    <slot name="name"></slot>
    <slot name="title"></slot>
  </template>

  <h2 slot="name">Dan Holloran</h2>
  <p slot="title">Frontend Developer</p>
</user-card>
```

Load that with JavaScript disabled and it still renders, styled, encapsulated, slotted. `shadowrootmode` takes `open` or `closed`, the same two values you would pass to `attachShadow()`. The `:host` and `::slotted()` selectors work exactly as they do in an imperatively created shadow root, because it _is_ one. Two sibling attributes are worth knowing: `shadowrootclonable` lets the shadow root survive `cloneNode()`, and `shadowrootdelegatesfocus` does what its imperative counterpart does.

The payoff is the boring, valuable kind. Content is in the initial HTML, so it paints on first byte instead of after hydration. Layout is stable from the start, which kills the shift you used to eat when a component finally mounted and pushed everything down the page. And a crawler that never runs your bundle still sees real text.

## Serializing and parsing it from script

The parser change came with an API change, because the old string APIs deliberately ignore declarative shadow roots. `innerHTML` will not parse a `<template shadowrootmode>` into a shadow root, by design, so that a legacy sanitizer cannot be tricked into creating one. Two newer methods handle it explicitly.

```js
// Serialize an element INCLUDING its shadow roots
const html = document.querySelector("user-card").getHTML({
  serializableShadowRoots: true,
});

// Parse a string that contains declarative shadow roots
container.setHTMLUnsafe(html);
```

`getHTML()` only emits shadow roots you have opted in, either with the `shadowrootserializable` attribute or `serializable: true` on `attachShadow()`. And treat the name `setHTMLUnsafe()` as the warning it is: it does no sanitization at all. If the HTML came from anywhere near a user, reach for `setHTML()` instead, which parses declarative shadow roots _and_ strips XSS-unsafe elements and attributes.

## Where it hurts

Declarative Shadow DOM is verbose in the exact place you would rather it were not. The shadow root belongs to the _instance_, not the class, so a page listing ten team members ships that entire `<template>` block ten times. Gzip handles it better than your patience will, but it is a real cost and it is why this is a server-rendering feature rather than something you hand-author.

That is the part the ecosystem has already absorbed. Lit's SSR package emits `<template shadowrootmode>` for every server-rendered `LitElement`, streams the output, and then rehydrates on the client once you load `@lit-labs/ssr-client/lit-element-hydrate-support.js` before Lit itself. Astro does the same for its web component integrations. You write the component once and the tooling produces the repetition.

The mental shift is small but real: a shadow root is now a thing your server can _print_, not just a thing your browser can _build_. If you have been avoiding web components because they meant shipping JavaScript to see anything at all, that objection expired two years ago. Start with [the web.dev article on Declarative Shadow DOM](https://web.dev/articles/declarative-shadow-dom), then read [MDN's shadow DOM guide](https://developer.mozilla.org/en-US/docs/Web/API/Web_components/Using_shadow_DOM) for the styling selectors, and try converting one server-rendered partial. The first time you disable JavaScript and the component is still there, it clicks.
