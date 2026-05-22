---
date: '2026-05-22T22:59:50.000+00:00'
tags: ['css', 'javascript', 'web-apis', 'frontend']
draft: true
title: "CSS Scroll-Driven Animations: No JavaScript Required"
image: '/images/posts/css-scroll-driven-animations-no-javascript-required.jpg'
topic: 'development'
description: "CSS scroll-driven animations let you create silky-smooth scroll effects — progress bars, reveal animations, parallax — using pure CSS with zero JavaScript."
---

If you've ever added a scroll progress bar to a page or built a "reveal on scroll" effect, you've probably reached for Intersection Observer, a scroll event listener, or a library like GSAP. They work fine, but they run on the main thread, add weight to your bundle, and often require careful cleanup. The browser has a better idea.

CSS scroll-driven animations are now stable across Chrome, Edge, and Safari 18, with Firefox catching up fast. They let you tie CSS animations directly to scroll position — no JavaScript involved. The result is compositor-thread animations that stay buttery-smooth even when your main thread is busy.

## The Two Timeline Types

The core of the API is the `animation-timeline` property, which replaces the default time-based animation timeline with a scroll-based one. There are two flavors: `scroll()` and `view()`.

**`scroll()`** tracks how far a scroll container has been scrolled from top (0%) to bottom (100%). It's the right tool for things that should reflect the document's overall scroll progress — like a reading progress bar.

```css
@keyframes grow-bar {
  from { transform: scaleX(0); }
  to   { transform: scaleX(1); }
}

.progress-bar {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 4px;
  background: oklch(60% 0.2 250);
  transform-origin: left;

  animation: grow-bar linear;
  animation-timeline: scroll(root block);
  animation-fill-mode: both;
}
```

That's it. `scroll(root block)` tells the browser to use the root scrolling container's block (vertical) axis as the timeline. No scroll listeners. No `requestAnimationFrame`. The browser handles it entirely at the compositor level.

**`view()`** tracks an element's visibility within its scroll container as it enters and exits the viewport. It's purpose-built for reveal animations — animating each card or section as it scrolls into view.

```css
@keyframes fade-up {
  from {
    opacity: 0;
    translate: 0 40px;
  }
  to {
    opacity: 1;
    translate: 0 0;
  }
}

.card {
  animation: fade-up linear both;
  animation-timeline: view();
  animation-range: entry 0% entry 40%;
}
```

The `animation-range` property is the secret weapon here. It lets you specify which phase of the element's journey through the viewport should drive the animation. `entry 0% entry 40%` means "animate during the first 40% of the element's entrance into the viewport" — a crisp reveal that finishes before the element is fully on screen.

## Scroll-Triggered Animations (Chrome 145+)

There's a newer addition worth knowing about: **scroll-triggered animations**. Unlike scroll-driven animations (which continuously update based on position), scroll-triggered animations fire once when a scroll threshold is crossed — similar to IntersectionObserver, but declarative in CSS.

```css
@keyframes highlight-nav {
  to { background: oklch(25% 0 0); box-shadow: 0 2px 12px oklch(0% 0 0 / 30%); }
}

header {
  animation: highlight-nav linear forwards;
  animation-timeline: scroll(root);
  animation-range: 80px 81px;
}
```

This changes the header background once the user has scrolled past 80px and holds that state. It's a one-liner replacement for the classic sticky-nav-scroll-listener pattern.

## Progressive Enhancement

Browser support is solid but not universal — Firefox still has partial support behind a flag. Always wrap scroll-driven animations in a `@supports` check so the experience degrades gracefully:

```css
@supports (animation-timeline: scroll()) {
  .progress-bar {
    animation: grow-bar linear;
    animation-timeline: scroll(root block);
    animation-fill-mode: both;
  }
}
```

Without the `@supports` guard, browsers that don't understand `animation-timeline` will simply ignore those declarations. For the progress bar case that's fine — no bar is better than a broken one. For critical reveal animations, ensure elements are visible by default and only animate them when the feature is supported.

## When to Reach for This

Scroll-driven animations shine when the effect is purely visual and directly tied to scroll position: reading indicators, sticky header transitions, parallax backgrounds, element reveals, and image carousels. For anything that needs to trigger side effects — updating state, fetching data, analytics events — you still want Intersection Observer or a scroll event. CSS animations can't call your JavaScript.

MDN's [scroll-driven animations guide](https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Scroll-driven_animations) is the most complete reference, and [scroll-driven-animations.style](https://scroll-driven-animations.style/) has a fantastic playground of real-world examples to steal from. Give it a scroll.
