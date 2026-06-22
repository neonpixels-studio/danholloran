---
date: '2026-06-22T07:08:29.000+00:00'
tags: ['css', 'animation', 'tooling']
draft: true
title: "CSS @property: Typed, Animatable Custom Properties"
image: '/images/posts/css-property-typed-animatable-custom-properties.jpg'
topic: 'development'
description: "Unregistered CSS custom properties can't animate — they just snap. @property fixes that by giving the browser a type, a default, and an inheritance rule, unlocking smooth transitions for gradients, counters, and design tokens."
---

There's a quiet frustration that hits every developer who first tries to animate a CSS custom property. You write a clean gradient, put the color stop in a variable, add a `transition` — and it snaps. No animation. Just an instant cut from one value to the next.

The reason is straightforward: the browser doesn't know what `--brand-color` is. It's just a string as far as CSS is concerned. You can't interpolate a string. `@property` fixes this by letting you register a custom property with a type, an initial value, and an inheritance rule — turning an opaque blob of text into something the browser can actually reason about and animate.

As of 2026, `@property` is Baseline Widely Available. Chrome, Firefox, Safari, and Edge all support it. There's no reason not to use it for any non-trivial design system.

## The Syntax

A `@property` declaration requires three descriptors: `syntax`, `inherits`, and `initial-value` (required unless `syntax` is `"*"`).

```css
@property --brand-hue {
  syntax: '<angle>';
  inherits: false;
  initial-value: 220deg;
}
```

`syntax` is the type. The full list of supported types includes `<color>`, `<length>`, `<percentage>`, `<number>`, `<integer>`, `<angle>`, `<time>`, `<resolution>`, `<transform-function>`, `<transform-list>`, `<image>`, and `<url>`. You can also combine types with `|`, accept a space-separated list with `+`, or accept any value with `"*"`.

`inherits` is a boolean. Set it to `true` if child elements should be able to inherit the value from a parent (like font-related properties). Set it to `false` to scope it locally — useful for per-component counters or animation state that shouldn't bleed upward.

`initial-value` is the fallback when no value is set. For most types it's required and must be a computationally independent value — `10px` works, `calc(var(--base) * 2)` doesn't.

## The Killer Use Case: Animating Gradients

Before `@property`, animating a gradient background required JavaScript to interpolate values and update a style attribute on every frame. CSS had no way to do it natively. With `@property`, you register the color stops as typed properties and transition them directly:

```css
@property --stop-one {
  syntax: '<color>';
  inherits: false;
  initial-value: #6366f1;
}

@property --stop-two {
  syntax: '<color>';
  inherits: false;
  initial-value: #ec4899;
}

.card {
  background: linear-gradient(135deg, var(--stop-one), var(--stop-two));
  transition: --stop-one 0.4s ease, --stop-two 0.4s ease;
}

.card:hover {
  --stop-one: #0ea5e9;
  --stop-two: #22d3ee;
}
```

The browser knows `--stop-one` is a `<color>`, so it can interpolate between `#6366f1` and `#0ea5e9` across frames. Smooth, GPU-composited, zero JavaScript.

The same pattern applies to angles for conic gradients, lengths for clip paths, or percentages for color stop positions. Any place you previously needed JS to animate something inside a CSS function, `@property` is the answer.

## Design System Benefits: Type Safety and Scoped Defaults

Beyond animation, `@property` adds a layer of predictability to token-based design systems. An unregistered custom property set to an invalid value silently falls back to whatever the inherited value or browser default is — which can cause subtle layout bugs that are hard to trace. A registered property with `syntax: '<length>'` ignores an invalid assignment entirely and keeps the `initial-value`, which is at least predictable.

The `inherits: false` flag is particularly useful for component-scoped state. Say you're building a progress indicator that tracks a `--progress` percentage internally:

```css
@property --progress {
  syntax: '<percentage>';
  inherits: false;
  initial-value: 0%;
}

.progress-bar {
  --progress: 0%;
  width: var(--progress);
  transition: --progress 0.6s ease;
}
```

Setting `inherits: false` means each `.progress-bar` instance manages its own `--progress` independently. Parent values don't leak in, sibling values don't interfere.

You can also register properties in JavaScript using `CSS.registerProperty()`, which accepts the same options as the at-rule but lets you do it conditionally at runtime:

```js
CSS.registerProperty({
  name: '--theme-angle',
  syntax: '<angle>',
  inherits: false,
  initialValue: '0deg',
});
```

The at-rule and the JS API are equivalent — use whichever fits your workflow. The at-rule is usually cleaner for static design tokens; the JS API is handy when the property name or initial value needs to be dynamic.

## One Rule to Check

If a CSS transition or animation on a custom property is snapping instead of interpolating, the missing `@property` registration is almost always why. Add the rule, match the type to what you're actually setting, and the transition starts behaving like any built-in property.

It's a small addition to the stylesheet that unlocks a category of effects that were genuinely impossible in CSS alone just a few years ago.
