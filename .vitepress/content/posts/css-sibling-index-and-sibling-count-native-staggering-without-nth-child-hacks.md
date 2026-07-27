---
date: "2026-07-27T02:08:47.000-05:00"
tags: ["css", "animation", "web-apis"]
draft: false
title: "CSS sibling-index() and sibling-count(): Native Staggering Without nth-child Hacks"
image: "/images/posts/css-sibling-index-and-sibling-count-native-staggering-without-nth-child-hacks.jpg"
topic: "development"
description: "CSS sibling-index() and sibling-count() turn an element's position into a number you can drop into calc(), replacing walls of nth-child rules and inline JavaScript for staggered animations and math-driven layouts."
---

If you have ever built a staggered animation, where menu items or cards fade in one after another instead of all at once, you know the ritual. You reach for `:nth-child()`, then you write out a delay for the first item, the second, the third, and you keep going until you run out of patience or elements. Add a row to the list and the whole hand-tuned ladder is off by one. It is the kind of code that works but quietly resents you.

CSS now has a better answer. Two functions, `sibling-index()` and `sibling-count()`, let the browser count for you. They turn an element's position in its parent into a plain number you can drop into `calc()`, which means delays, offsets, and layout math that used to require JavaScript or a wall of selectors collapse into a single declaration that never needs updating.

## What the two functions return

`sibling-index()` returns an integer for the current element's position among its siblings, starting at `1` for the first child. `sibling-count()` returns the total number of sibling elements sharing the same parent, including the element itself. Both are live: add or remove a sibling and the values recompute automatically, with no selector to edit.

The important detail is that they return raw integers, not lengths or times. On their own they are not much use, but inside `calc()` they multiply cleanly against any unit. That is where the leverage comes from.

```css
.card {
  /* 1st card gets 0ms, 2nd gets 80ms, 3rd gets 160ms... */
  animation: fade-in 400ms ease both;
  animation-delay: calc((sibling-index() - 1) * 80ms);
}
```

Subtracting `1` keeps the first element at a zero delay so the sequence starts immediately. That single line replaces however many `:nth-child(n)` rules you would otherwise have written, and it scales to a list of five or fifty without another edit.

## Staggering, reversing, and laying out with math

Because the functions are just numbers, you can do real arithmetic with them. Combine `sibling-index()` with `sibling-count()` and you can reverse the direction of a stagger so the last item animates first:

```css
.card {
  animation: fade-in 400ms ease both;
  animation-delay: calc((sibling-count() - sibling-index()) * 80ms);
}
```

The same trick powers layout, not just motion. Want each item in a stack to sit a little further down and a little more transparent than the one before it? Feed the index straight into `translateY` and `opacity`:

```css
.stack > .item {
  transform: translateY(calc(sibling-index() * 8px));
  opacity: calc(1 - (sibling-index() - 1) * 0.1);
}
```

This is the part that used to be genuinely painful. Fanned-out cards, staircase menus, radial layouts where each element rotates by a slice of a circle, all of it previously meant either a preprocessor loop that baked in a fixed count or a bit of JavaScript setting inline custom properties on load. Now the geometry lives in the stylesheet and stays correct as the DOM changes.

## Shipping it without breaking older browsers

Support arrived fast but is not universal yet. Chromium browsers shipped `sibling-index()` and `sibling-count()` in version 138 in mid-2025, and Safari followed in the 26.x line. Firefox has a positive spec position and active implementation work but had not shipped stable support as of mid-2026. That means Firefox users, plus anyone on an older Chrome or Safari, will not see the effect unless you plan for them.

The right mental model is progressive enhancement. Write a sane baseline that works everywhere, then layer the functions on top behind a feature query:

```css
.card {
  animation: fade-in 400ms ease both; /* everyone gets the fade */
}

@supports (top: calc(1px * sibling-index())) {
  .card {
    animation-delay: calc(
      (sibling-index() - 1) * 80ms
    ); /* supporting browsers get the stagger */
  }
}
```

Browsers without support simply fade everything in at once, which is a perfectly acceptable fallback rather than a broken layout. The `@supports` test wraps the function in a `calc()` that produces a length so the query only passes where the browser genuinely understands it.

Staggered reveals and math-driven layouts have been a stubborn reason to keep small amounts of JavaScript around for years. These two functions quietly remove that reason. Start dropping them in behind an `@supports` block now, and the day Firefox ships, your effects light up for everyone with no extra work.
