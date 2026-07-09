---
date: "2026-07-09T02:08:31.000-05:00"
tags: ["css", "web-apis", "accessibility"]
draft: false
title: "CSS light-dark(): Stop Duplicating Your Dark Mode Colors"
image: "/images/posts/css-light-dark-stop-duplicating-your-dark-mode-colors.jpg"
topic: "development"
description: "The CSS light-dark() function collapses your two dark-mode palettes into a single declaration. Here is how it works, the color-scheme gotcha that trips everyone up, and how to wire up a manual theme toggle."
---

Dark mode used to mean writing every color twice. You would define your palette, then duplicate the whole thing inside a `@media (prefers-color-scheme: dark)` block, flipping each value by hand. Miss one selector and you get white text on a white background in the one theme you forgot to test. The `light-dark()` CSS function collapses that duplication into a single declaration, and it has been Baseline since 2024, so you can reach for it in production today.

The catch is that it does nothing on its own. `light-dark()` reads the active color scheme, and the browser only knows the scheme if you tell it.

## color-scheme is the switch, not the media query

The function pairs with the `color-scheme` property. Set it once on the root and the whole document opts into automatic theming:

```css
:root {
  color-scheme: light dark;
}
```

That single line does two things. It tells the browser your page supports both schemes, so native UI (form controls, scrollbars, the default page background) follows the user's system preference. And it activates `light-dark()` for everything below it.

This is the number one gotcha: if you write `light-dark()` without declaring `color-scheme`, the browser defaults to light and you always get the first value. No error, no warning, just a page that never goes dark. If you ever find yourself debugging a `light-dark()` that "isn't working," check for the `color-scheme` declaration first.

## One function, both values

Once the scheme is set, you pass two colors and the browser picks based on the active theme. The first value is light, the second is dark:

```css
:root {
  color-scheme: light dark;
}

body {
  background: light-dark(#ffffff, #12141a);
  color: light-dark(#1a1a1a, #e6e6e6);
}

a {
  color: light-dark(#0b66c3, #6cb6ff);
}
```

No media query, no second block, no chance of the two lists drifting apart. It composes with custom properties too, which is how you keep a real design system readable:

```css
:root {
  color-scheme: light dark;
  --surface: light-dark(#f7f7f8, #1b1d22);
  --text: light-dark(#1a1a1a, #e6e6e6);
  --accent: light-dark(#0b66c3, #6cb6ff);
}

.card {
  background: var(--surface);
  color: var(--text);
  border-color: light-dark(#e2e2e5, #2c2f36);
}
```

Reach for the variable form when a color is reused across many rules or you need to read it from JavaScript. Reach for the inline form for one-off, theme-aware values where a variable would just be noise.

## Overriding the system and falling back

`color-scheme` also gives you a manual toggle without touching every color. Because the property inherits, you can force a subtree into one theme by setting it on a container. A common pattern is a `data-theme` attribute on `:root` that a toggle button flips:

```css
:root {
  color-scheme: light dark;
}
:root[data-theme="light"] {
  color-scheme: light;
}
:root[data-theme="dark"] {
  color-scheme: dark;
}
```

Now the same `light-dark()` values respond to a user's explicit choice and fall back to their OS preference when no attribute is set. You store the choice, set the attribute, and every `light-dark()` on the page updates at once.

Support sits around 95% in 2026, which is strong but not universal. For the stragglers, declare a plain fallback first and let the modern value override it in browsers that understand it:

```css
body {
  color: #1a1a1a; /* old browsers stop here */
  color: light-dark(#1a1a1a, #e6e6e6);
}
```

Browsers that do not recognize `light-dark()` treat the second declaration as invalid and keep the first. If you need those old browsers to support dark mode too, wrap the fallback in a `prefers-color-scheme` block; for most projects a sensible single fallback color is enough.

## Where it leaves the media query

`light-dark()` does not retire `prefers-color-scheme` entirely. When a theme change means swapping a background image, restructuring a layout, or loading a different asset rather than just recoloring, the media query is still the right tool. But for the common case of recoloring your interface, `light-dark()` turns two maintained palettes into one. Start with `color-scheme: light dark` on your root, move your colors into single declarations, and delete the duplicate media block you have been babysitting.
