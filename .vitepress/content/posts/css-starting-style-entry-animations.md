---
date: '2026-06-15T07:09:11.000+00:00'
tags: ['css', 'animation', 'web-apis']
draft: true
title: "CSS @starting-style: Animate Elements as They Enter the DOM"
image: '/images/posts/css-starting-style-entry-animations.jpg'
topic: 'development'
description: "The @starting-style rule gives CSS transitions a starting point when elements first appear, enabling smooth entry animations from display:none or fresh DOM insertion — no JavaScript required."
---

There's a small but persistent frustration in frontend work: CSS transitions are great at animating *between* states, but they've never had a clean answer for the moment an element first appears. You toggle a class, the element snaps into view, and you're back to writing JavaScript to add a class on the next frame just to trigger the animation. It works, but it's a hack.

`@starting-style` is the CSS answer to that problem. It's been baseline across all major browsers since late 2024, and it changes how you think about entry animations.

## The Missing "From" State

CSS transitions need two things: a starting value and an ending value. When you hover a button and it changes color, the browser has both — the default color and the hover color. Easy.

But when an element is first rendered in the DOM, or when it switches from `display: none` to `display: block`, the browser has no prior state to transition from. It just renders the element at its final styles, instantly.

`@starting-style` fills that gap by letting you define the style an element should *pretend* to have before its first render:

```css
.toast {
  opacity: 1;
  transform: translateY(0);
  transition: opacity 0.3s ease, transform 0.3s ease;
}

@starting-style {
  .toast {
    opacity: 0;
    transform: translateY(1rem);
  }
}
```

When `.toast` is added to the DOM, it starts invisible and shifted down, then transitions to its visible state. No JavaScript. No `requestAnimationFrame`. No forced reflow tricks.

## Animating display: none Toggling

The trickier case is animating elements that toggle between `display: none` and a visible display value. The `display` property is *discrete* — it has no intermediate state between `none` and `block` — so a standard transition on it does nothing.

Two things unlock this. First, `@starting-style` provides the entry state. Second, `transition-behavior: allow-discrete` tells the browser to treat discrete properties as animatable, holding off the `display: none` switch until the exit transition finishes:

```css
.drawer {
  display: block;
  opacity: 1;
  transform: translateX(0);
  transition:
    opacity 0.4s ease,
    transform 0.4s ease,
    display 0.4s allow-discrete;

  @starting-style {
    opacity: 0;
    transform: translateX(-100%);
  }
}

.drawer.hidden {
  display: none;
  opacity: 0;
  transform: translateX(-100%);
}
```

When `.hidden` is removed, the drawer slides in from the left using `@starting-style` as the starting point. When `.hidden` is added, `allow-discrete` keeps the element visible long enough for the exit transition to complete, *then* sets `display: none`.

Note the nested `@starting-style` syntax above — it's equivalent to the flat form but scoped right to the rule it belongs to, which keeps things readable.

One thing to understand: the starting styles only apply when the element *first appears*. Once it's visible and you transition it back to its default state, `@starting-style` doesn't re-apply — the browser transitions from the current state, not the starting one.

## Pairing with the Popover API

`@starting-style` shines with top-layer elements like popovers and dialogs, because those elements jump in and out of the top layer in a way that used to make smooth animation nearly impossible without JavaScript.

The Popover API exposes a `:popover-open` pseudo-class you can target:

```css
[popover] {
  opacity: 0;
  transform: scale(0.95);
  transition:
    opacity 0.2s ease,
    transform 0.2s ease,
    overlay 0.2s allow-discrete,
    display 0.2s allow-discrete;
}

[popover]:popover-open {
  opacity: 1;
  transform: scale(1);

  @starting-style {
    opacity: 0;
    transform: scale(0.95);
  }
}
```

The `overlay` property (also requiring `allow-discrete`) keeps the element in the top layer for the duration of the exit transition so it stays rendered while fading out — without it, the popover disappears immediately on close.

The HTML side is just:

```html
<button popovertarget="menu">Open Menu</button>
<div id="menu" popover>...</div>
```

No JavaScript event listeners. The browser handles open, close, Escape key, and light-dismiss out of the box.

## Browser Support and When to Use It

`@starting-style` is Baseline across Chrome 117+, Edge 117+, Firefox 129+, and Safari 17.5+. That covers well over 90% of global browser share, so it's safe to use in production without a polyfill — older browsers just skip the entry animation and show the element immediately, which degrades gracefully.

The main thing to watch: `@starting-style` only works with CSS *transitions*, not keyframe animations. If you're using `@keyframes`, you don't need it — animations already define their own starting state with `from` or `0%`.

If you're reaching for JavaScript to add-then-remove a class purely to trigger an entry animation, `@starting-style` is the clean replacement. It's one of those CSS features that, once you understand it, makes you wonder how you managed without it.

[MDN reference for @starting-style](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/@starting-style)
