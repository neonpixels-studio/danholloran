---
date: "2026-10-11T02:15:43.000-07:00"
tags: ["css", "web-apis", "container-queries"]
draft: false
title: "CSS Container Style Queries: Let the Parent Set the Theme"
image: "/images/posts/css-container-style-queries-let-the-parent-set-the-theme.jpg"
topic: "development"
description: "Container style queries hit Baseline in May 2026. Here's how to let a parent's custom property drive its children's styles, plus the one gotcha that trips everyone up."
---

Every design system eventually grows a modifier class problem. The card needs a dark version for the footer, a compact version for the sidebar, and a "highlighted" version for the pricing page. So you add `.card--dark`, `.card--compact`, `.card--featured`, and then you need a dark _compact_ card, and then the button inside the card also needs to know it's on a dark background. Now the class has to be threaded through three components, or you're writing selectors like `.card--dark .button`.

Container size queries solved half of this in 2023: components could finally react to the space they're given instead of the viewport. The other half, reacting to the _context_ they're placed in, became Baseline Newly available in May 2026 when Firefox 151 shipped support for container style queries. Chrome and Edge have had them since 111, and Safari since 18, so this is ready for production with a sensible fallback.

## How Style Queries Work

A style query asks a question about the computed value of a custom property on an ancestor. If the answer is yes, the nested rules apply to descendants:

```css
.panel {
  --theme: dark;
}

@container style(--theme: dark) {
  .card {
    background: oklch(0.22 0.02 260);
    color: oklch(0.95 0 0);
  }

  .button {
    border-color: currentColor;
  }
}
```

Two things are different from size queries. First, you don't need `container-type`. Every element is a style container by default, so `@container style(...)` checks the nearest ancestor with no setup at all. Second, only custom properties work today. The spec allows `style(font-weight: bold)` on regular properties, but no browser implements that yet, so stick to `--anything`.

If you have nested contexts (a light card inside a dark panel inside a light page), name the level you care about:

```css
.site-footer {
  container-name: footer;
  --theme: dark;
}

@container footer style(--theme: dark) {
  .newsletter-form input {
    background: transparent;
    color: inherit;
  }
}
```

Without a name, the query targets the nearest ancestor. With one, it targets the nearest ancestor with that `container-name`, which is what you want when themes nest.

## The Gotcha: You Can't Query Yourself

This is the mistake almost everyone makes on day one:

```css
/* Does not work the way you'd expect */
.card[data-variant="featured"] {
  --variant: featured;
}

@container style(--variant: featured) {
  .card {
    border: 2px solid gold;
  }
}
```

The query is evaluated against the card's _ancestor_, not the card. The card's parent never set `--variant`, so the query fails. Custom properties inherit downward, not upward. The fix is to style a child of the element that holds the value, which in practice means having a wrapper:

```html
<article class="card" style="--variant: featured">
  <div class="card__inner">
    <h3>Pro plan</h3>
    <a class="button" href="/signup">Start trial</a>
  </div>
</article>
```

```css
@container style(--variant: featured) {
  .card__inner {
    border: 2px solid gold;
  }

  .button {
    background: gold;
    color: black;
  }
}
```

If you only need a single property on the element itself to change, that's what the `if()` function is for. A useful rule of thumb: `if()` produces a conditional value for one element, while a style query sets context for a whole subtree.

It's also worth registering the property with `@property`. A registered property has a known type and an initial value, so a container that never sets `--variant` resolves to something predictable instead of the guaranteed-invalid value:

```css
@property --variant {
  syntax: "<custom-ident>";
  initial-value: default;
  inherits: true;
}
```

## Range Queries and a Fallback Plan

Exact matching covers themes and variants, but numbers are where it gets interesting. Chrome 142 added range syntax, so you can compare values instead of matching strings:

```css
.meter {
  --fill: 72%;
}

@container style(--fill > 90%) {
  .meter__bar {
    background: oklch(0.6 0.2 25);
  }
}

@container style(--fill > 50%) and style(--fill <= 90%) {
  .meter__bar {
    background: oklch(0.75 0.15 85);
  }
}
```

Both sides of a comparison must resolve to the same numeric type (length, number, percentage, angle, time, frequency, or resolution). Note the split here: plain equality style queries are Baseline, but range syntax is Chromium-only for now. Treat range queries as a progressive enhancement.

The fallback story is simple because style queries are additive. Write your default component styles outside any query, then layer the contextual variants inside `@container style()` blocks. A browser that doesn't understand the at-rule skips it entirely and renders the default card. Nothing breaks; the footer card is just light instead of dark. If that's not acceptable for a given component, keep the old modifier class as a fallback alongside the style query and delete it once your analytics say the stragglers are gone.

## Where to Start

Pick the one place in your codebase where a theme or variant class gets passed down through props or descendant selectors, and replace it with a single custom property on the wrapper and a style query for the children. You'll likely find that the components inside stop needing to know anything about where they live. The [MDN guide to container size and style queries](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_containment/Container_size_and_style_queries#container_style_queries) covers the full syntax, and Una Kravets' [range style queries write-up](https://una.im/range-style-queries) is worth bookmarking for when the range syntax lands everywhere.
