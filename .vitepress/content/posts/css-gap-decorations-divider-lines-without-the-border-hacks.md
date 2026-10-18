---
date: "2026-10-18T02:14:46.000-07:00"
tags: ["css", "animation"]
draft: false
title: "CSS Gap Decorations: Divider Lines Without the Border Hacks"
image: "/images/posts/css-gap-decorations-divider-lines-without-the-border-hacks.jpg"
topic: "development"
description: "Chrome and Edge 149 let column-rule and the new row-rule draw lines in grid and flexbox gaps, so you can delete the border and pseudo-element tricks you've been maintaining."
---

You have a three-column card grid and the design calls for thin lines between the cards. Not around them, between them. So you reach for the usual tricks: a `border-right` on every card except the last in each row, an `:nth-child(3n)` selector to remove it, a matching `border-bottom` that has to vanish on the final row, and a media query that rewrites all of it when the grid drops to two columns. Or you give up and fake it with a background color showing through a `1px` gap.

The `gap` property has handled spacing in grid and flexbox for years, but the space itself was never stylable. As of Chrome and Edge 149, it is. CSS gap decorations take the `column-rule` property you may remember from multi-column layout, make it work in grid and flexbox, and add a `row-rule` partner for the other axis.

## The basics: `column-rule`, `row-rule`, and `rule`

If you've used `border`, you already know the syntax. Each rule takes a width, a style, and a color:

```css
.cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(16rem, 1fr));
  gap: 2rem;
  column-rule: 1px solid #d4d4d8;
  row-rule: 1px solid #d4d4d8;
}
```

When both axes use the same value, the `rule` shorthand sets them together:

```css
.cards {
  rule: 1px solid #d4d4d8;
}
```

The lines are drawn in the middle of each gap and follow the layout wherever it goes. Change the column count, let `auto-fill` reflow the grid at a narrower viewport, or add a tenth card, and the decorations move with it. There are no selectors that assume a fixed row length, and nothing gets added to the DOM or the accessibility tree. Decorations are purely visual and don't change layout, so turning them on never shifts anything.

Flexbox works the same way. A wrapping nav with dashed separators is one declaration:

```css
nav ul {
  display: flex;
  flex-wrap: wrap;
  gap: 1.5rem;
  column-rule: 2px dashed #71717a;
}
```

## Patterns and per-gap styles

Rules accept comma-separated lists that cycle across gaps, plus a `repeat()` syntax borrowed from grid tracks. That makes alternating styles trivial. Here's a calendar where hour boundaries are solid and half-hours are dashed:

```css
.calendar {
  display: grid;
  row-gap: 0.5rem;
  row-rule-width: 2px, 1px;
  row-rule-style: solid, dashed;
  row-rule-color: #e4e4e7, #f4f4f5;
}
```

And a page-level grid where the first divider is heavy and every one after it is thin, however many sections you add:

```css
body {
  display: grid;
  gap: 4rem;
  row-rule:
    0.5rem solid #e4e4e7,
    repeat(auto, 2px solid #e4e4e7);
}
```

`repeat(auto, ...)` is the important bit. It fills however many gaps remain, so the rule list never needs updating when content grows.

## Fine-tuning: insets, breaks, and empty cells

The defaults look reasonable, but the real win is the control layer on top. A few properties carry most of the weight.

**Insets** shrink lines away from their ends. `column-rule-inset: 1rem` pulls each vertical line in from the top and bottom, which is the "separator that doesn't touch the edges" look from a media card. For more precision, `rule-inset-cap` targets the outer ends of a line and `rule-inset-junction` targets the points where row and column gaps meet. The `overlap-join` keyword joins rules neatly at intersections while keeping the outer ends flush.

**Breaks** decide what happens at intersections. `rule-break: intersection` cuts lines where gaps cross, giving you separate segments per cell. `rule-break: none` draws continuous lines straight through.

**Visibility** solves the dangling-line problem. A grid whose last row is only partly filled would otherwise draw rules next to empty cells. `rule-visibility-items: between` only paints a rule when there are items on both sides, and `around` paints it when at least one side has an item.

**Overlap** sets which axis wins where they cross. With a thick column rule and a thin row rule, `rule-overlap: column-over-row` puts the vertical lines on top.

Put together, a dashboard grid with clean joins and no stray lines looks like this:

```css
.dashboard {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1.5rem;
  rule: 1px solid #3f3f46;
  rule-inset-cap: 0;
  rule-inset-junction: 0.5rem;
  rule-visibility-items: between;
  transition: rule-inset-junction 0.3s;
}

.dashboard:hover {
  rule-inset-junction: 0;
}
```

Yes, that transition works. Rule width, color, and insets are all animatable.

## Shipping it today

This is a Chromium feature right now: Chrome and Edge 149 and other browsers built on the same engine. Firefox and Safari haven't shipped it yet, so it isn't Baseline. A polyfill is in development from Microsoft, but most uses don't need one. In a browser without support, the gaps simply render as plain space, which is usually a perfectly good fallback for a decorative line.

If a missing divider would actually hurt readability, gate a fallback with `@supports`:

```css
.cards > * {
  border-bottom: 1px solid #d4d4d8;
}

@supports (row-rule: 1px solid) {
  .cards > * {
    border-bottom: none;
  }

  .cards {
    rule: 1px solid #d4d4d8;
    rule-visibility-items: between;
  }
}
```

One heads-up if you tried the developer trial back in Chrome 139: some names changed before release. `column-rule-outset` became `column-rule-inset`, the paint-order property is now `rule-overlap`, and the visibility properties are new. Old demos and blog posts may use the earlier names.

Treat gap decorations as progressive enhancement and start deleting those `:nth-child` border rules on the next layout you touch. The [Chrome stable announcement](https://developer.chrome.com/blog/gap-decorations-stable) covers every property, and Microsoft's [interactive playground](https://microsoftedge.github.io/Demos/css-gap-decorations/playground.html) is the fastest way to get a feel for insets and breaks before you write any CSS of your own.
