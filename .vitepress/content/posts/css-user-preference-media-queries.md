---
date: '2026-06-14T07:08:24.000+00:00'
tags: ['css', 'accessibility', 'web-apis']
draft: true
title: "CSS User Preference Media Queries: Build Accessible Experiences Without JavaScript"
image: '/images/posts/css-user-preference-media-queries.jpg'
topic: 'development'
description: "A practical guide to prefers-reduced-motion, prefers-color-scheme, prefers-contrast, and forced-colors — the CSS media queries that respect user accessibility settings with zero JavaScript."
---

Your users have already told your browser what they need. They've toggled "Reduce Motion" in System Settings, switched their OS to dark mode, or cranked up contrast because their display washes out in sunlight. The question is whether your CSS is listening.

User preference media queries let you respond to those signals directly in CSS — no `window.matchMedia`, no state management, no JavaScript overhead. They've been creeping into browser support for years, but as of 2026 all four major ones are universally supported and underused. Here's how to put them to work.

## `prefers-reduced-motion`: Stop Animating People Into Headaches

Motion on the web can be genuinely harmful. For people with vestibular disorders, autoplay animations and parallax effects can trigger vertigo, nausea, or migraines. The `prefers-reduced-motion` media query maps directly to the "Reduce Motion" accessibility preference in macOS, Windows, iOS, and Android.

The pattern is to write your animated default, then strip it back for users who opt out:

```css
.hero-banner {
  animation: slide-in 0.6s ease-out both;
}

@media (prefers-reduced-motion: reduce) {
  .hero-banner {
    animation: none;
  }
}
```

A cleaner pattern inverts this — start from no animation and only add it when motion is okay:

```css
@media (prefers-reduced-motion: no-preference) {
  .hero-banner {
    animation: slide-in 0.6s ease-out both;
  }
}
```

This approach means users who haven't touched the setting still get animations (`no-preference` is the default), but you're making motion opt-in at the code level rather than opt-out. It also makes it easier to audit during a review — every animated element lives inside a `no-preference` block.

Don't nuke everything with a blanket `* { animation: none }` rule. Focus indicators and loading spinners may rely on animation to communicate state. Audit each one and decide whether to remove, slow down, or replace with a static alternative.

## `prefers-color-scheme`: Native Dark Mode Without the Toggle

If your app ships its own dark mode toggle, `prefers-color-scheme` lets you default to whatever the user's OS is already set to — and it updates instantly when they switch, no page reload required.

The typical setup pairs it with CSS custom properties:

```css
:root {
  --bg: #ffffff;
  --text: #111111;
  --surface: #f4f4f4;
  --border: #d1d1d1;
}

@media (prefers-color-scheme: dark) {
  :root {
    --bg: #0f0f0f;
    --text: #e8e8e8;
    --surface: #1c1c1c;
    --border: #2e2e2e;
  }
}

body {
  background: var(--bg);
  color: var(--text);
}
```

Everything else in your stylesheet uses the custom properties, so theme switching happens in exactly one place. If you want to layer a user-controlled toggle on top, store the override in a `data-theme` attribute on `<html>` and let CSS check that first:

```css
[data-theme="light"] { --bg: #ffffff; --text: #111111; }
[data-theme="dark"]  { --bg: #0f0f0f; --text: #e8e8e8; }

@media (prefers-color-scheme: dark) {
  :root:not([data-theme]) {
    --bg: #0f0f0f;
    --text: #e8e8e8;
  }
}
```

No attribute = fall back to the OS setting. User hits the toggle = set the attribute. Clean layering, no JavaScript required for the default path.

## `prefers-contrast`: Don't Assume Your Palette Is Readable

`prefers-contrast` responds to Windows' "High Contrast" mode and macOS's "Increase Contrast" accessibility setting. The two useful values are `more` (user wants higher contrast) and `less` (some users with light sensitivity prefer reduced contrast).

```css
.card {
  border: 1px solid var(--border);
  background: var(--surface);
}

@media (prefers-contrast: more) {
  .card {
    border: 2px solid currentColor;
    outline: 2px solid currentColor;
  }
}
```

This is most valuable for subtle UI elements — muted borders, low-contrast placeholder text, ghost buttons. Those choices look polished on a calibrated display but disappear for users with low vision or in bright environments. A `prefers-contrast: more` block can harden those edges without touching the default design at all.

## `forced-colors`: Respect Windows High Contrast Mode

`forced-colors: active` fires when Windows High Contrast Mode (or the broader Forced Colors spec) is enabled. The OS overrides most of your colors with a restricted system palette — which is intentional. The problem is it can erase things you're using color to communicate: custom focus rings, SVG icon fills, disabled state styling.

The answer isn't to fight the OS. Let the forced palette do its job, but use the CSS [system color keywords](https://developer.mozilla.org/en-US/docs/Web/CSS/system-color) to opt specific elements into the forced palette explicitly:

```css
@media (forced-colors: active) {
  .icon {
    fill: ButtonText;
  }

  .badge {
    border: 1px solid ButtonText;
  }
}
```

This doesn't restore your brand colors — it hands off to the OS palette, which is exactly what forced-colors users expect. Background images and decorative SVGs will still disappear, and that's fine; they're decorative. What matters is that your UI's meaning survives.

## Putting It Together

None of these require a framework, a library, or a line of JavaScript. They're hooks into decisions users have already made about how they need to experience the web. Start with `prefers-reduced-motion` if your site has any animation. Layer in `prefers-color-scheme` if you're not responding to OS theme. Add `prefers-contrast` and `forced-colors` blocks where your UI relies on subtle visual cues.

Users who need these settings have already done their part. Meeting them there is the smallest lift with the biggest payoff — and it's pure CSS.
