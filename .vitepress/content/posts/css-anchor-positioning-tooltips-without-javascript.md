---
created_at: '2026-05-03T20:00:21.000+00:00'
tags: ['css', 'web-apis', 'accessibility']
draft: true
title: 'CSS Anchor Positioning: Tooltips Without JavaScript'
---

Positioning a tooltip next to its trigger sounds simple until you're actually doing it. The element you want to position next to is somewhere in the DOM, your tooltip is in a portal at the bottom of `<body>` to avoid clipping, and now you need JavaScript to measure both elements, watch for scroll, and reposition on resize. Libraries like Floating UI or Popper.js exist specifically because this problem is annoying enough to abstract away.

CSS Anchor Positioning is the browser's answer to all of it. You describe the spatial relationship between two elements in CSS, and the browser handles the math — no measurements, no scroll listeners, no JavaScript at all. It landed in Chrome and Edge in version 125, Firefox 132, and Safari 18.2+, which puts it firmly in production territory.

## The Core Idea: Name Your Anchor

The mechanism is simple: you give one element an `anchor-name`, then use that name to position another element relative to it.

```css
/* The trigger becomes an anchor */
.tooltip-trigger {
  anchor-name: --my-tooltip;
}

/* The tooltip positions itself relative to that anchor */
.tooltip {
  position: absolute;
  position-anchor: --my-tooltip;

  /* sit just above the anchor, centered horizontally */
  bottom: anchor(top);
  left: anchor(center);
  translate: -50% -8px;
}
```

`anchor(top)` resolves to the top edge of the anchor element. `anchor(center)` resolves to its horizontal midpoint. The tooltip doesn't need to be near the trigger in the DOM — it can be in a completely different part of the tree and the browser will still find the named anchor and position relative to it.

## Pairing with the Popover API

Anchor positioning really shines when combined with the native Popover API. Together they let you build a fully accessible, keyboard-navigable tooltip with zero JavaScript:

```html
<button popovertarget="tip" id="trigger">Hover me</button>

<div id="tip" popover="hint">
  This is a native tooltip, no JS needed.
</div>
```

```css
#trigger {
  anchor-name: --trigger;
}

#tip {
  position: absolute;
  position-anchor: --trigger;
  bottom: anchor(top);
  left: anchor(center);
  translate: -50% -8px;
  margin: 0;

  /* styling */
  background: #1a1a2e;
  color: #fff;
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 0.85rem;
  width: max-content;
}
```

`popover="hint"` makes the browser treat this as a tooltip — it shows on hover or focus of the `popovertarget` element, dismisses on Escape, and handles ARIA automatically. The anchor positioning then ensures it sits right above the button regardless of where either element lives in the DOM.

## Automatic Fallbacks with `@position-try`

The problem with fixed positioning rules like "always above" is that elements near the top of the viewport have no room above them. Floating UI handles this by detecting overflow and flipping the placement. Anchor positioning has a native equivalent: `@position-try`.

```css
@position-try --below {
  bottom: auto;
  top: anchor(bottom);
  translate: -50% 8px;
}

#tip {
  position: absolute;
  position-anchor: --trigger;
  bottom: anchor(top);
  left: anchor(center);
  translate: -50% -8px;

  /* try --below if the default overflows the viewport */
  position-try-fallbacks: --below;
}
```

You define named try-sets with `@position-try`, each containing the overriding position values. The browser tries each fallback in order and applies the first one that keeps the element within the viewport. You can define as many fallbacks as you need — above, below, left, right — and let the browser pick.

## The `position-area` Shorthand

For common placement patterns, there's a more concise syntax using `position-area`. Instead of writing out each edge with `anchor()`, you declare the region around the anchor where you want the element to land:

```css
.tooltip {
  position: absolute;
  position-anchor: --trigger;
  position-area: top center;
  margin-bottom: 8px;
}
```

`top center` means "above the anchor, centered horizontally." You can use `bottom`, `left`, `right`, `start`, `end`, and combine them — `bottom span-right` would place the element below and aligned to the right edge. It's less flexible than the `anchor()` function for precise pixel work, but for standard tooltip and dropdown placement it reads cleanly.

## What This Replaces

The practical implication is that tooltip and popover positioning libraries become optional for most use cases. If you're using Floating UI purely for the placement logic — not for animation or complex middleware — you can likely replace it with anchor positioning and `@position-try` fallbacks. The result is less JavaScript shipped to the browser, fewer dependencies to maintain, and positioning that works even when your tooltip is in a different stacking context.

Browser support is solid enough today that you can ship this without a polyfill for most user bases. If you need wider coverage, the `@oddbird/css-anchor-positioning` polyfill provides a fallback — but the native experience is already available to the vast majority of users hitting your site.
