---
date: "2026-07-20T02:08:06.000-05:00"
tags: ["css", "web-apis", "accessibility"]
draft: false
title: "CSS :has() in Practice: The Parent Selector You Can Finally Ship"
image: "/images/posts/css-has-in-practice-the-parent-selector-you-can-finally-ship.jpg"
topic: "development"
description: "The :has() selector is Baseline and fast in 2026. Here's how to use it for parent styling, sibling reactions, and quantity queries without reaching for JavaScript."
---

For years, "there's no parent selector in CSS" was one of the first hard truths you learned. You could style a child based on its parent all day, but going the other way meant a class toggle in JavaScript, a `MutationObserver`, or some framework state. That constraint shaped how we wrote components. It's gone now, and a lot of the JavaScript we wrote to work around it can go with it.

`:has()` lets an element style itself based on what it contains, what follows it, or the state of something deep inside it. It shipped in Firefox 121, which was the last holdout, and as of 2026 it sits in Baseline Widely Available with support north of 93 percent globally. The old performance warnings have mostly aged out too: modern engines lean on Bloom filters and ancestor invalidation, so a well-scoped `:has()` runs about as fast as an ordinary descendant selector. It is safe to use in production without a fallback.

## Styling a parent by its contents

The canonical example is a card that adapts to whether it actually has an image. Instead of adding a `.has-image` class in your template logic, let the CSS ask the question:

```css
.card:has(img) {
  display: grid;
  grid-template-columns: 120px 1fr;
  gap: 1rem;
}

.card:not(:has(img)) {
  display: block;
  text-align: center;
}
```

The markup stays dumb. The layout decision lives entirely in the stylesheet, right next to the rest of the card's styles, which is where it belongs. This pattern scales to anything conditional: a form row that grows a helper column only when it contains an error, a figure that tightens its spacing when there's no caption, a section that drops its border when it's empty.

## Reacting to descendant state without JavaScript

This is where `:has()` quietly deletes event listeners. Because it can read pseudo-classes like `:checked`, `:focus`, and `:invalid` on descendants, a wrapper can respond to interaction happening several levels down.

```css
/* Highlight the whole field group when its input is focused */
.field:has(input:focus-within) {
  outline: 2px solid var(--focus);
}

/* Turn a fieldset red only when it holds an invalid control */
fieldset:has(input:user-invalid) legend {
  color: var(--danger);
}

/* A pure-CSS "select all" reaction */
.list:has(input[type="checkbox"]:checked) .bulk-actions {
  visibility: visible;
}
```

Floating labels, accordion open states, validation styling, even a page-level theme toggle driven by a hidden checkbox with `html:has(#dark:checked)` all become CSS-only. Note the use of `:user-invalid` rather than `:invalid` so the field doesn't scream at someone before they've typed anything, which is a small but real accessibility win.

## Quantity queries that read like English

Styling a layout based on how many children it has used to be a genuinely obscure trick involving `:nth-last-child` paired with a general sibling combinator. With `:has()` the intent is legible:

```css
/* Switch a gallery to a tighter grid once it has 4+ items */
.gallery:has(:nth-child(4)) {
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
}
```

You can read that and know exactly what it does, which is not something anyone said about the old approach.

## Keep it scoped and shallow

The one habit worth building early is discipline about scope. Prefer `:has(> .child)` over `:has(.descendant)` when a direct child will do, since the direct-child check is cheaper. Anchor the selector to a specific container like `nav:has(.active)` rather than a broad `body:has(.anything)`, which forces the engine to reconsider huge swaths of the tree on every change. And avoid pairing `:has()` with the universal selector. Follow those and you'll never notice a performance cost.

If you still support an ancient browser, gate the enhancement with `@supports selector(:has(*))` and ship a sane default underneath. But for most projects in 2026, that's belt-and-suspenders. The parent selector is here, it's fast, and it's ready. Go delete some JavaScript.
