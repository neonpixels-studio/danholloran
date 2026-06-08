---
date: "2026-06-08T07:09:08.000+00:00"
tags: ["css", "javascript", "accessibility"]
draft: false
title: "CSS if(): Inline Conditionals for Smarter Styling"
image: "/images/posts/css-if-function-inline-conditionals.jpg"
topic: "development"
description: "CSS finally has native conditional logic with the new if() function — write style queries, media checks, and feature detection directly inside property declarations without extra selectors or JavaScript."
---

There's a moment every CSS developer knows: you want to tweak a single property based on some condition — a viewport width, a user preference, a custom property — and instead of a clean one-liner you end up with a whole new `@media` block, duplicated selectors, and maybe a dash of JavaScript to handle the edge cases. It works, but it never feels right.

The CSS `if()` function changes that. Shipping in Chrome 137, it brings inline conditional logic directly into your property declarations, letting you express branching style logic without leaving the property itself.

## How if() Works

The syntax is a sequence of condition-value pairs, evaluated top to bottom until one matches:

```css
property: if(condition: value; else: fallback);
```

The function supports three types of conditions:

- **`style()`** — queries computed CSS custom property values
- **`media()`** — runs an inline media query
- **`supports()`** — feature-detects a CSS property or syntax

You can chain them with `else`:

```css
button {
  padding: if(media(width >= 1024px): 0.5rem 1.5rem; else: 0.75rem 1.25rem);
}
```

That's a responsive padding rule with zero extra `@media` blocks.

## Three Practical Uses

### 1. Touch-Friendly Targets with media()

The pointer media feature lets you distinguish mouse users from touchscreen users. The accessible minimum tap target is 44px; mouse users can get away with smaller:

```css
.icon-button {
  width: if(media(any-pointer: fine): 32px; else: 44px);
  height: if(media(any-pointer: fine): 32px; else: 44px);
}
```

Previously this needed a full `@media (any-pointer: coarse)` block. Now it reads like what it is — a single property with two states.

### 2. Theme Switching with style()

Custom properties are often used to carry design tokens — theme flags, component variants, status values. The `style()` query lets you branch on them inline:

```css
.status-badge {
  --status: pending;

  background: if(
    style(--status: complete): #22c55e; style(--status: error): #ef4444;
      else: #f59e0b
  );
  color: if(style(--status: complete): #fff; else: #111);
}
```

Set `--status` anywhere up the cascade (a data attribute, a parent class, JavaScript) and the badge adapts without touching the rule itself.

### 3. Progressive Enhancement with supports()

Feature detection used to require `@supports` wrapper blocks that mirror your regular rules. Inline, it's much less verbose:

```css
.hero {
  background-color: if(
    supports(color: oklch(0.7 0.2 180)): oklch(0.7 0.2 180) ;
      else: hsl(180deg 40% 55%)
  );
}
```

Modern browsers get the perceptually uniform `oklch` color; older ones get a safe `hsl` fallback — all in one declaration.

## Browser Support and Progressive Enhancement

As of mid-2026, `if()` is supported in Chrome 137+, Edge, and Opera — Chromium browsers only. Firefox support is in progress, and Safari has it on the roadmap for 2026–2027. That means you shouldn't lean on `if()` for anything structural yet.

The recommended approach is to write your safe default first, then layer `if()` on top behind a `@supports` guard:

```css
/* Safe default for all browsers */
.card {
  padding: 1rem;
}

/* Enhanced padding for browsers that support if() */
@supports (padding: if(media(width >= 768px): 1.5rem; else: 1rem)) {
  .card {
    padding: if(media(width >= 768px): 1.5rem; else: 1rem);
  }
}
```

It's a bit redundant today, but the `@supports` block drops away cleanly once the feature reaches baseline. This is the same progressive enhancement pattern CSS scroll-driven animations and anchor positioning used while support was building.

## Worth Watching Now

`if()` won't replace `@media` blocks wholesale — complex breakpoint logic with many properties still reads better in a dedicated rule. Where it genuinely shines is in the small conditional cases you'd otherwise scatter across your stylesheet: a size tweak for touch targets, a color swap for a status flag, a palette upgrade when a modern color space is available.

The feature is experimental enough that you should keep an eye on the [MDN reference](https://developer.mozilla.org/en-US/docs/Web/CSS/if) and the [CSS-Tricks coverage](https://css-tricks.com/lightly-poking-at-the-css-if-function-in-chrome-137/) as browser support widens. But if you're already running Chrome 137+ in development, it's a great time to start reaching for it in low-risk, progressively enhanced places and see where it clicks.
