---
created_at: '2026-05-09T02:09:09.000+00:00'
tags: ['css', 'web-apis']
draft: false
title: 'CSS Anchor Positioning: Stop Using JavaScript for Tooltips'
---

If you've ever built a tooltip, a floating dropdown, or a context menu, you've probably reached for a library like Floating UI or Popper.js. Not because the logic is hard to understand, but because getting a floating element to reliably follow its trigger — and flip positions when it hits the viewport edge — requires a non-trivial amount of JavaScript. The browser just didn't give you the primitives. Until now.

CSS Anchor Positioning, which reached baseline "widely available" status in early 2026, is the browser-native API for tethering one element to another entirely in CSS. No scroll listeners. No `getBoundingClientRect`. No ResizeObserver juggling. Just a handful of new CSS properties and you're done.

## The Core API: Name Your Anchor, Target It

The system works in two steps: you give the reference element an anchor name, then tell the floating element which anchor to attach to.

```css
/* Step 1: Name the anchor */
.trigger {
  anchor-name: --my-trigger;
}

/* Step 2: Attach the floating element */
.tooltip {
  position: absolute;
  position-anchor: --my-trigger;
  position-area: top center;
}
```

The `anchor-name` property takes a custom ident (must start with `--`, just like a CSS variable). The `position-anchor` property on the target element points to that name, establishing the relationship.

The real magic is `position-area`. It divides the space around the anchor into a 3×3 grid — think of it like a compass rose plus center. Values like `top`, `bottom center`, `inline-end`, and `block-start` describe which cell of that grid the floating element should occupy. No coordinates, no offsets — just a declarative placement.

For cases where you need more precise control, the `anchor()` function lets you reference specific edges of the anchor in your `inset` properties:

```css
.tooltip {
  position: absolute;
  position-anchor: --my-trigger;
  bottom: calc(anchor(top) + 8px);
  left: anchor(center);
  translate: -50% 0;
}
```

## Automatic Fallbacks with `position-try-fallbacks`

Here's where anchor positioning goes from "neat" to genuinely great. One of the hardest parts of floating UI is handling overflow: what happens when the user scrolls the trigger near the bottom of the viewport and your tooltip clips off screen? Previously, you'd calculate available space in JS and conditionally flip the element. Now you just describe the fallback order in CSS.

```css
.tooltip {
  position: absolute;
  position-anchor: --my-trigger;
  position-area: top center;
  position-try-fallbacks: bottom center, left center, right center;
}
```

The browser tries each option in order and uses the first one that doesn't overflow the containing block. You can also use predefined flip keywords for the common cases:

```css
.tooltip {
  position: absolute;
  position-anchor: --my-trigger;
  position-area: top center;
  position-try-fallbacks: flip-block, flip-inline, flip-block flip-inline;
}
```

`flip-block` tries flipping on the block axis (top ↔ bottom), `flip-inline` on the inline axis (left ↔ right). You get smart repositioning for free, with zero JavaScript involved.

## Pairing with the Popover API

Anchor positioning pairs perfectly with the [Popover API](https://developer.mozilla.org/en-US/docs/Web/API/Popover_API), another browser-native feature that handles show/hide behavior and top-layer promotion. Together they replace the entire tooltip/dropdown pattern end-to-end:

```html
<button popovertarget="my-tip" anchor-name="--btn">Hover me</button>
<div id="my-tip" popover>Helpful context here</div>
```

```css
button {
  anchor-name: --btn;
}

[popover] {
  position: absolute;
  position-anchor: --btn;
  position-area: top center;
  position-try-fallbacks: flip-block;
  margin: 0;
  inset: unset;
}
```

The popover attribute handles accessibility (focus trapping, light-dismiss, `aria-expanded`) and renders the element in the top layer so it's never clipped by `overflow: hidden` ancestors. Anchor positioning handles placement. Between the two, you have a fully functional, accessible tooltip with about fifteen lines of HTML and CSS.

## Browser Support and When to Use It

As of 2026, anchor positioning is available in Chrome, Edge, and Safari, with Firefox support shipping behind a flag and expected to be enabled by default later this year. For most production apps targeting a broad audience, you'll want a progressive-enhancement approach — use it confidently in Chrome/Edge/Safari, and let older browsers fall back to a simpler static position.

For new projects, it's worth skipping Floating UI entirely for simple tooltips and dropdowns. For existing projects heavily invested in JS-based positioning, there's no rush — the library still works. But when you next find yourself writing a `useFloating()` call, it's worth pausing to ask whether the browser can just handle it now. Often, it can.

For a deep dive into the full API including `@position-try` rules and `position-visibility`, the [MDN anchor positioning guide](https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Anchor_positioning) and [Chrome Developers intro](https://developer.chrome.com/blog/anchor-positioning-api) are the best places to go.
