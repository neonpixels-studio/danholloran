---
date: "2026-09-17T02:08:05.000-07:00"
tags: ["css", "accessibility"]
draft: false
title: "CSS reading-flow: Fix the Tab Order Your Layout Broke"
image: "/images/posts/css-reading-flow-fix-the-tab-order-your-layout-broke.jpg"
topic: "development"
description: "Grid and flexbox let you rearrange a layout without touching the DOM, which quietly breaks keyboard navigation. The reading-flow and reading-order properties finally let CSS tell the browser which order actually counts."
---

Put a card grid on a page, give one card `grid-row: 1 / 3` so it sits up top as the hero, and the layout looks exactly right. Then press Tab. Focus lands somewhere in the middle of the page, jumps back up to the hero, skips sideways, and generally behaves like it is reading a different document than the one on screen. It is, in a way: the browser follows DOM order, and you just spent an afternoon making the visual order disagree with it.

This has been the standing tax on grid and flexbox since they shipped. `order`, `row-reverse`, `grid-area`, and auto-placement all move boxes around without moving a single node, and sequential focus navigation never got the memo. The usual workaround was positive `tabindex`, which trades one bug for a worse one. `reading-flow` and `reading-order` are the CSS Display Level 4 answer, and they are in browsers now.

## The disconnect, in eight lines

Here is the smallest version of the problem. Three links in a flex container, reversed, with one of them reordered on top of that:

```css
.box {
  display: flex;
  flex-direction: row-reverse;
}

.box :nth-child(1) {
  order: 2;
}
```

Visually you read **One, Three, Two**. Tab through it and you get One, Two, Three, because that is the source order. Nothing is broken according to the spec, and everything is broken according to the person using a keyboard.

One property fixes it:

```css
.box {
  reading-flow: flex-visual;
}
```

Focus order becomes One, Three, Two, matching what is on screen in a left-to-right writing mode. If you would rather keep the reversed intent instead of the visual left-to-right sweep, `reading-flow: flex-flow` gives you Two, Three, One. Both respect `order`.

## Picking the right keyword

`reading-flow` is set on the **container**, and the value you want depends on the layout it creates:

- `normal` (the default) keeps DOM order, exactly as before.
- `flex-visual` follows the visual order of flex items, accounting for writing mode.
- `flex-flow` follows the flex-flow direction.
- `grid-rows` walks the grid visually, row by row.
- `grid-columns` walks it column by column.
- `grid-order` follows the modified order when `order` is applied to grid items, and behaves like `normal` when it is not.
- `source-order` works in grid, flex, and block containers, and is the one that enables manual overrides.

That last one pairs with `reading-order`, which is set on the **item** and takes an integer. It is the escape hatch for the case no keyword describes, such as an absolutely positioned item in a block container that visually sits above everything else:

```css
.wrapper {
  display: block;
  reading-flow: source-order;
}

.wrapper .top {
  reading-order: -1;
}
```

Focus visits `.top` first, then falls back to source order for the rest. `reading-order` only does anything inside a container whose `reading-flow` is not `normal`, so the two are always used together.

## Why this is not just tabindex with extra steps

You could approximate the flex example with `tabindex="1"`, `tabindex="2"`, `tabindex="3"` plus an `aria-owns` attribute to keep the accessibility tree in sync. People have been doing exactly that for years, and it is fragile for a specific reason: positive `tabindex` values are document-global. Another component elsewhere on the page with `tabindex="1"` joins the same bucket, and focus starts teleporting between unrelated regions of the page.

`reading-flow` avoids that by making the container a **focus scope owner**. Sequential navigation visits every focusable element inside the container before moving on, and the direct children are ordered by the property rather than by any positive `tabindex` on them, which is ignored for ordering purposes. The reordering also applies to how the container's children are exposed to assistive tech, not just to the Tab key, so the screen reader and the keyboard agree.

One sharp edge worth knowing: an element with `display: contents` inherits `reading-flow` from its layout parent and becomes a valid reading flow container itself. If you use `display: contents` as a wrapper, check your focus order after adding this.

## Where support stands

Chrome has shipped both properties since version 137, Safari added support in 26.4, and Firefox still has it behind a flag as of September 2026 — so this is not Baseline yet. It degrades cleanly, though: browsers that do not understand `reading-flow` simply keep using DOM order, which is what they do today.

That makes it a real progressive enhancement, with one caveat. `reading-flow` is a fix for the cases where source order genuinely cannot match the visual layout, not a license to stop caring about markup order. Get the DOM close to right first, then reach for this to close the gap that grid and flexbox opened. The MDN pages for [reading-flow](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/reading-flow) and [reading-order](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/reading-order) have the full value tables, and Chrome's [reading-flow examples](https://chrome.dev/reading-flow-examples/) are worth tabbing through with your eyes closed.
