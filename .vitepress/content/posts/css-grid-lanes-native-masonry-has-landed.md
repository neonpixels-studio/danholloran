---
date: "2026-07-05T02:08:53.000-05:00"
tags: ["css", "grid-lanes", "accessibility", "web-apis"]
draft: false
title: "CSS Grid Lanes: Native Masonry Has Finally Landed"
image: "/images/posts/css-grid-lanes-native-masonry-has-landed.jpg"
topic: "development"
description: "Masonry layout is coming to CSS as grid-lanes, and Safari shipped it first. Here's how the new display value works, why it beats the JavaScript libraries, and what it fixes for keyboard users."
---

For over a decade, "masonry" meant reaching for a JavaScript library. You know the layout: a Pinterest-style wall of cards with different heights, each one tucked up snugly under the shortest column so there are no ragged gaps. CSS Grid could not do it, Flexbox could fake a broken version of it, and so everyone loaded Masonry.js or Isotope, measured every element in JavaScript, and absolutely-positioned the results. It worked, but it fought the browser the whole way: reflows on resize, layout thrash, and a tab order that jumped all over the page.

That era is ending. After a multi-year debate at the CSS Working Group, the feature landed with a name that finally makes sense: **Grid Lanes**. Apple's WebKit team shipped it first in Safari Technology Preview, with Chrome and Firefox implementing behind flags and expected to follow during 2026. It is not a new layout engine bolted onto the side of CSS. It is CSS Grid, with the row-tracking relaxed so items flow into whichever lane gets them closest to the top.

## Three lines, zero media queries

Here is the whole thing for a classic photo wall:

```css
.gallery {
  display: grid-lanes;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 16px;
}
```

You set `display: grid-lanes` to opt into the new behavior, then define your columns with the full `grid-template-columns` syntax you already know. `repeat(auto-fill, minmax(250px, 1fr))` says "make as many flexible columns as fit, each at least 250px wide." The `gap` applies both between lanes and between items stacked within a lane. That is it: a responsive masonry wall with no breakpoints, no container queries, and no JavaScript measuring anything.

The WebKit team's mental model is bumper-to-bumper highway traffic. Each item is a car, and as the browser places them in source order, every new car merges into whichever lane gets it furthest "down the road," meaning closest to the top of the container. That is the same greedy shortest-column packing the old libraries did by hand, except now the layout engine owns it.

## You still have all of Grid

Because lanes are defined with the real `grid-template-*` properties, everything you know about Grid still applies. You can make alternating narrow and wide columns, span an item across several lanes, or pin one to a specific position:

```css
.newspaper {
  display: grid-lanes;
  grid-template-columns: repeat(auto-fill, minmax(20ch, 1fr));
  gap: 2lh;
}
.newspaper article:nth-child(1) {
  grid-column: span 4; /* a hero teaser that dominates the top */
}
```

Define rows instead of columns and the flow flips ninety degrees into a "brick" layout that stacks left to right, thanks to a new `normal` default for `grid-auto-flow` that reads your intent from whichever template axis you set. The Working Group is still bikeshedding the exact property that will control flow direction explicitly, but because `normal` is the initial value either way, the basic syntax is safe to memorize now.

## The part that actually matters: accessibility

The old JavaScript approach had a nasty side effect. Because it absolute-positioned everything, the DOM order and the visual order drifted apart, so a keyboard user tabbing through a gallery would leap erratically around the screen, and infinite-scroll feeds needed constant JavaScript babysitting to re-lay-out. Grid Lanes keeps source order intact, so tabbing moves across visible content in a sane way and infinite feeds just keep flowing with no script involved.

Grid Lanes also introduces one genuinely new property, `flow-tolerance` (briefly named `item-tolerance` before a January 2026 rename). It controls how fussy the packing algorithm is about tiny height differences. With zero tolerance, an item might jump to a far lane just to sit two pixels higher, scrambling the reading order. The default of `1em` tells the browser to treat near-ties as ties, keeping items in a more predictable left-to-right grouping. Raise it if your content varies a lot and you want calmer placement; the goal is a layout that does not send screen-reader and keyboard users bouncing up and down the page.

## What to do today

Grid Lanes is still experimental everywhere, so ship it as progressive enhancement. Wrap it in `@supports (display: grid-lanes)` and let non-supporting browsers fall back to a plain single-column or equal-height grid; nobody gets a broken page, and Safari users get the good version now. It is worth building a demo this week, because the syntax is stable enough that the WebKit team is telling people to commit it to memory. After ten years of shipping a layout library to do a browser's job, the browser is finally ready to do it itself.
