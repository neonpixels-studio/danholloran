---
date: "2026-09-06T02:07:15.000-07:00"
tags: ["css", "scroll", "web-apis", "animation"]
draft: false
title: "CSS scroll-state() Queries: Styling Stuck, Snapped, and Scrollable"
image: "/images/posts/css-scroll-state-queries-styling-stuck-snapped-and-scrollable.jpg"
topic: "development"
description: "Sticky headers, snapped carousel slides, and scroll shadows have all been JavaScript jobs for a decade. Scroll-state container queries hand that work back to CSS."
---

Every codebase I have worked in has the same file somewhere. It is called `stickyHeader.js` or `useIsStuck.ts`, and it exists because CSS could tell you an element was `position: sticky` but never whether it was currently _stuck_. So you wire up an IntersectionObserver against a one-pixel sentinel div, toggle a class, and hope nobody asks why the shadow flickers on iOS.

The browser has always known the answer. It has to know: it is the thing doing the sticking, the snapping, and the overflowing. Scroll-state container queries are the API that finally exposes that knowledge to the stylesheet.

## The three states, and the container that owns them

The mental model is the one you already have from container queries. You mark an element as a container, then style its **descendants** based on the container's state. The only new part is a `container-type` value:

```css
.header-wrapper {
  container-type: scroll-state;
  position: sticky;
  top: 0;
}

.header-wrapper > nav {
  transition: box-shadow 0.3s ease;

  @container scroll-state(stuck: top) {
    box-shadow: 0 4px 12px rgb(0 0 0 / 0.15);
  }
}
```

That is the whole sentinel-div dance, gone. Three descriptors cover most of what you would reach for JavaScript to do:

- `stuck: top | right | bottom | left` — the sticky element is currently pinned to that edge
- `snapped: x | y | inline | block` — this scroll-snap target is the one the scroller has snapped to
- `scrollable: top | right | bottom | left` — there is more content to scroll in that direction

There is also a fourth, `scrolled`, which reports the direction of the most recent scroll and shipped later than the other three (Chrome 144, January 2026).

The rule that trips everyone up on their first attempt: **the container cannot style itself**. The element carrying `container-type: scroll-state` is the sticky or snapping element, and the thing that reacts has to be a child of it. For a snap carousel that means three levels, not two:

```
scroll container      → scroll-snap-type: x mandatory
  └ snap target       → scroll-snap-align + container-type: scroll-state
      └ child element → @container scroll-state(snapped: x) { ... }
```

## Fading the unsnapped items

Carousels where the centered item is full-strength and its neighbours dim used to require a scroll listener or the `scrollsnapchange` event. With `not` in the query you can invert it and write the effect as a single rule on the inactive state:

```css
.testimonials {
  overflow-x: auto;
  scroll-snap-type: x mandatory;
}

.testimonials > article {
  container-type: scroll-state;
  scroll-snap-align: center;
}

.testimonials > article > * {
  transition: opacity 0.4s ease;

  @container not scroll-state(snapped: x) {
    opacity: 0.25;
  }
}
```

Worth knowing: the snapped query fires like `scrollsnapchanging`, not `scrollsnapchange`. It flips as soon as the browser decides which target it is heading for, before the scroll settles. That is usually what you want for visual feedback, and occasionally too eager, in which case the JavaScript event is still the right tool.

## Scroll affordances that actually know

The `scrollable` descriptor solves a problem that was genuinely hard: knowing whether an overflow area has anywhere left to go. Lea Verou's `background-attachment: local` trick approximated it, and scroll-driven animations approximated it differently, but both were workarounds. Now the gradient just asks:

```css
.pane {
  container-type: scroll-state size;
  overflow: auto;
}

.pane::after {
  content: "";
  position: sticky;
  /* ...pinned overlay spanning the scrollport... */
  opacity: 0;
  transition: opacity 0.3s ease;

  @container scroll-state(scrollable: bottom) {
    opacity: 1;
  }
}
```

Two details in there are easy to miss. A pseudo-element can query its own originating element's container, which is what makes the single-overlay pattern work. And a single element can be both a `size` and a `scroll-state` container, so you are not forced to pick.

## Where this actually stands

Support is Chromium-only. As of August 2026, caniuse puts global coverage around 72% with Chrome and Edge 133+, Opera 118+, and Samsung Internet 29+ shipping it. Safari 27 and Firefox 158 still have not, so this is not Baseline and you should not read a blog post that tells you it is.

That is fine for the use cases above, because every one of them is decoration. A shadow that never appears, a dimmed neighbour that stays bright, a gradient that stays hidden: nothing breaks, the carousel still scrolls, the header still sticks. Wrap the enhancement in `@supports (container-type: scroll-state)` when you need the fallback to be explicit rather than merely harmless, and put `@media (prefers-reduced-motion: no-preference)` around anything that moves.

What I would not do yet is delete the JavaScript from a component where the stuck state changes behaviour rather than appearance. For the other 90% of cases, this is a stylesheet-sized replacement for a file you have been maintaining for years.
