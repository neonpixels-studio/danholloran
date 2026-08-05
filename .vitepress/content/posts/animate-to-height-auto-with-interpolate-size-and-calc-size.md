---
date: "2026-07-26T02:07:35.000-05:00"
tags: ["css", "animation", "web-apis", "frontend"]
draft: false
title: "Animate to height: auto in CSS with interpolate-size and calc-size()"
image: "/images/posts/animate-to-height-auto-with-interpolate-size-and-calc-size.jpg"
topic: "development"
description: "Transitioning an element to height: auto used to mean JavaScript measurements or fragile max-height hacks. interpolate-size and calc-size() finally make it a one-line CSS opt-in."
---

You have an accordion. Click the header, the panel expands. You want that expansion to slide open smoothly instead of snapping. So you reach for a `transition` on `height`, set the closed state to `height: 0`, the open state to `height: auto`, and... nothing animates. The panel just pops open like the transition isn't there.

That's because it isn't, really. Browsers can only interpolate between two resolved lengths, and `auto` is not a length. It's a keyword the layout engine resolves at paint time, so there's no numeric endpoint to tween toward. For years the workarounds were all bad in their own way: measure the content height with JavaScript and animate to that pixel value, animate `max-height` to some number larger than the content will ever be (and accept the janky easing that causes), or animate a `grid-template-rows` from `0fr` to `1fr`. Two new CSS features, `interpolate-size` and `calc-size()`, make the problem go away.

## interpolate-size: the one-line opt-in

`interpolate-size` is a property whose only job is to tell the browser it's allowed to interpolate between a length and an intrinsic sizing keyword like `auto`, `min-content`, `max-content`, or `fit-content`. Its default value is `numeric-only`, which is the old behavior. Flip it to `allow-keywords` and the animation you always expected just works.

Because the property inherits, the recommended approach is to set it once on the root so the whole document opts in:

```css
:root {
  interpolate-size: allow-keywords;
}
```

Now your accordion transition needs nothing special:

```css
.panel {
  height: 0;
  overflow: hidden;
  transition: height 0.3s ease;
}

.panel.open {
  height: auto;
}
```

That's the entire trick. No `ResizeObserver`, no reading `scrollHeight`, no magic `max-height: 9999px`. If you'd rather not opt in globally, scope it to a subtree by moving the declaration off `:root` and onto, say, `main`, leaving the rest of the page on the default behavior.

This also unlocks the pairing everyone actually wants: animating an element that's toggling `display: none`. Combine `interpolate-size` with `@starting-style` and `transition-behavior: allow-discrete`, and a `<details>` element or a popover can fade and grow in from nothing to its natural height in pure CSS.

## calc-size() when you need math

`interpolate-size` is the right tool when you're animating straight to the intrinsic size. But sometimes you want the intrinsic size _plus or minus something_, and that's where `calc-size()` comes in. It takes two arguments: a basis (the intrinsic keyword) and a calculation that refers to that basis with the `size` keyword.

```css
/* the auto height, minus 10px */
height: calc-size(auto, size - 10px);

/* half the max-content width */
width: calc-size(max-content, size * 0.5);

/* snap the auto height up to the nearest 50px */
height: calc-size(auto, round(up, size, 50px));
```

A useful side effect: dropping `calc-size()` into a value automatically enables keyword interpolation for that property, so you don't need the `interpolate-size` declaration for transitions using it to work. One gotcha worth internalizing: percentages inside the calculation resolve against the containing block, not against `size`. So `size + 50%` is not "150% of the resolved size." To scale the size itself, multiply by a unitless number: `size * 1.5`.

## Shipping it today

The honest caveat: as of mid-2026 these features are Chromium-only, shipping since Chrome and Edge 129 (September 2024), and still absent from Firefox and Safari, which means they aren't Baseline yet. The good news is the fallback is graceful. Without support, the element still toggles to its open state; it just snaps instead of sliding. Nobody's accordion breaks, they just lose the flourish.

Because of that, treat the animation as progressive enhancement and gate it behind a feature query so you're only paying for the transition where it actually runs:

```css
@supports (interpolate-size: allow-keywords) {
  :root {
    interpolate-size: allow-keywords;
  }
}
```

The layout works everywhere; the polish shows up where the browser can deliver it. That's exactly the posture you want for a feature this new. Wire it into your accordions and disclosure widgets now, keep the non-animated path as the baseline, and the experience upgrades itself automatically as Firefox and Safari catch up. For the full picture, the [Chrome for Developers writeup](https://developer.chrome.com/docs/css-ui/animate-to-height-auto) and the [MDN reference](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/interpolate-size) are both worth a read.
