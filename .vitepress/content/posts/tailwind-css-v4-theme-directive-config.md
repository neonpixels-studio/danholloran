---
date: '2026-06-02T07:10:22.000+00:00'
tags: ['css', 'tailwind-css', 'tooling', 'javascript']
draft: true
title: "Tailwind CSS v4: Ditch the Config File, Embrace @theme"
image: '/images/posts/tailwind-css-v4-theme-directive-config.jpg'
topic: 'Tailwind CSS'
description: "Tailwind CSS v4 moves design token configuration out of tailwind.config.js and into your CSS with the @theme directive — here's what that means for your workflow."
---

If you've been using Tailwind CSS for a while, you know the ritual: install tailwind, postcss, and autoprefixer, generate a `tailwind.config.js`, add three `@tailwind` directives to a CSS file, wire up your content paths. It works, but it's a lot of ceremony before you write a single utility class.

Tailwind CSS v4 tears most of that down.

## One Import, Automatic Detection

The most visible change in v4 is setup. Instead of three `@tailwind` directives and a PostCSS config, you get one line:

```css
@import "tailwindcss";
```

Content detection is now automatic — Tailwind crawls your project and finds template files without you specifying paths. For Vite projects, the first-party plugin replaces the PostCSS setup entirely:

```bash
npm install tailwindcss @tailwindcss/vite
```

```js
// vite.config.js
import tailwindcss from '@tailwindcss/vite'

export default {
  plugins: [tailwindcss()]
}
```

No PostCSS config. No autoprefixer. The Vite plugin handles everything through the new Rust-based engine (Lightning CSS), which also means incremental builds in the single-digit millisecond range — full rebuilds that took 3.5 seconds in v3 now complete in under 100ms.

## Design Tokens Live in Your CSS Now

The bigger architectural shift is where you customize Tailwind. In v3, colors, fonts, and spacing all lived in `tailwind.config.js`:

```js
// tailwind.config.js (v3)
module.exports = {
  theme: {
    extend: {
      colors: {
        brand: '#6366f1',
        'brand-dark': '#4f46e5',
      },
      fontFamily: {
        display: ['Satoshi', 'sans-serif'],
      },
    },
  },
}
```

In v4, that configuration moves into your CSS via the `@theme` directive:

```css
/* globals.css */
@import "tailwindcss";

@theme {
  --color-brand: oklch(0.62 0.19 256);
  --color-brand-dark: oklch(0.55 0.22 264);
  --font-display: "Satoshi", sans-serif;
  --breakpoint-3xl: 120rem;
}
```

The namespace prefix determines what utility gets generated:
- `--color-*` → `bg-brand`, `text-brand`, `border-brand`
- `--font-*` → `font-display`
- `--spacing-*` → padding, margin, gap, and size utilities
- `--breakpoint-*` → responsive prefixes (`3xl:`)
- `--shadow-*` → shadow utilities

The tokens also become real CSS custom properties, so you can reference them anywhere in your styles without duplication:

```css
.hero-gradient {
  background: linear-gradient(
    to right,
    var(--color-brand),
    var(--color-brand-dark)
  );
}
```

Your design system and plain CSS now share the same source of truth. No more keeping values in sync between a JS config and a CSS variables file.

## Runtime Theming Without Rebuilds

Because all tokens are CSS variables, switching themes at runtime is straightforward. Define your palette under a `[data-theme]` selector, then point your `@theme` tokens at those variables:

```css
@import "tailwindcss";

/* Light theme defaults */
:root {
  --background: oklch(0.99 0 0);
  --foreground: oklch(0.15 0 0);
  --primary: oklch(0.62 0.19 256);
}

/* Dark theme overrides */
[data-theme="dark"] {
  --background: oklch(0.14 0 0);
  --foreground: oklch(0.95 0 0);
  --primary: oklch(0.72 0.19 256);
}

/* Wire Tailwind utilities to the theme variables */
@theme {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-primary: var(--primary);
}
```

Toggle the theme with a single attribute change — no JavaScript class swapping, no recompilation:

```js
document.documentElement.setAttribute('data-theme', 'dark')
```

Every `bg-primary`, `text-foreground`, and `border-background` utility in your markup responds instantly.

## One Breaking Change to Know

V4 renames gradient utilities to align with native CSS syntax. This is the most common migration bump:

```html
<!-- v3 -->
<div class="bg-gradient-to-r from-blue-500 to-purple-600">

<!-- v4 -->
<div class="bg-linear-to-r from-blue-500 to-purple-600">
```

The official upgrade tool handles most renames automatically:

```bash
npx @tailwindcss/upgrade
```

It covers `bg-gradient-to-*`, `flex-shrink-0`, `flex-grow`, and other canonicalized class names. Review the diff before committing — it catches around 90% of mechanical changes, but custom utilities and third-party component libraries may need manual attention.

## Worth the Switch

The move from a JS config to `@theme` in CSS is one of those changes that feels small until you live with it. You stop context-switching between files when tweaking a color value. Editor autocomplete works off the same CSS file your components use. And if you've been using Tailwind in a non-JS environment — Laravel, Rails, Django — dropping `tailwind.config.js` from the toolchain simplifies the whole setup considerably.

If you're starting a new project, the single `@import "tailwindcss"` and a `@theme` block is all you need. For existing projects, the [v4 upgrade guide](https://tailwindcss.com/docs/upgrade-guide) and `npx @tailwindcss/upgrade` will get you most of the way there.
