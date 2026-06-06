---
date: '2026-06-06T07:08:27.000+00:00'
tags: ['css', 'web-apis', 'accessibility']
draft: true
title: "CSS ::search-text: Style the Browser's Find-in-Page Highlights"
image: '/images/posts/css-search-text-style-find-in-page-highlights.jpg'
topic: 'development'
description: "The new ::search-text pseudo-element lets you style the highlights from Ctrl+F find-in-page, so they finally match your site instead of clashing with it."
---

Hit Ctrl+F (or Cmd+F) on any page and the browser paints its matches in that unmistakable shade of default yellow. It has looked that way for decades, and until recently there was nothing you could do about it. If your site has a dark theme, the highlights glow like hazard tape. If your brand palette happens to include yellow, the current match blends into your own UI. Find-in-page was the one piece of text selection styling that stayed permanently out of reach.

That changed with `::search-text`, a new highlight pseudo-element that shipped in Chrome 144. It targets exactly what the name suggests: the text fragments the browser highlights when the user runs a find-in-page search. Combined with the `:current` pseudo-class for the active match, you can finally bring those highlights into your design system.

## How it works

`::search-text` is part of the same family as `::selection`, `::target-text`, and `::spelling-error` — the highlight pseudo-elements defined in the CSS Pseudo-Elements Module Level 4 spec. You use it at the top level of your stylesheet, not chained to a selector, when you want to restyle every match on the page:

```css
::search-text {
  background-color: #1e3a5f;
  color: #e2e8f0;
}
```

There are usually multiple matches on a page, and the browser distinguishes the one you've stepped to with Enter or the next/previous buttons. That's where `:current` comes in:

```css
::search-text:current {
  background-color: #f97316;
  color: #111827;
  text-decoration: underline wavy;
}
```

By default, Chrome renders matches in yellow and the current match in orange. The snippet above swaps that scheme for something that works on a dark background: muted blue for passive matches, a high-contrast orange only for the match in focus.

You can also scope the styling to part of the page by prefixing a selector, like `article ::search-text`, if you only want custom highlights inside your main content area.

## What you can and can't change

Like the other highlight pseudo-elements, `::search-text` only accepts a "safe" subset of CSS. You can set `color`, `background-color`, `text-decoration` and its longhands, `text-shadow`, and similar paint-only properties. You cannot touch layout: no `padding`, no `margin`, no `font-size`, no `display`. The restriction exists for performance and security reasons — highlights are painted over live text and the browser won't reflow the page just because a search ran.

In practice that constraint is freeing. The whole job is picking two color pairs:

```css
/* All matches: visible but calm */
::search-text {
  background-color: oklch(87% 0.17 90);
  color: black;
}

/* The active match: impossible to miss */
::search-text:current {
  background-color: oklch(62% 0.22 38);
  color: white;
}
```

One thing worth doing before you ship: run both pairs through a contrast checker. The main legitimate reason to override browser defaults is improving contrast, especially on dark themes where the default yellow-on-dark-text combination can be hard to read. If your custom highlight is prettier but less legible, you've made find-in-page worse, and users who rely on it — which skews toward keyboard-first and assistive-tech users — will feel it.

## Progressive enhancement by default

Browser support is still settling, with Chromium leading the way. The good news is that the failure mode is perfect: an unsupported browser simply ignores the rule and keeps its default highlights. There is no polyfill to load, no feature detection needed, no fallback to write. You add the rules, supporting browsers honor them, everyone else carries on.

That makes `::search-text` one of those rare features you can adopt the same afternoon you learn about it. If you maintain a documentation site, a blog, or anything text-heavy where readers actually use find-in-page, drop in a pair of rules that match your theme and check it off. The MDN page on [::search-text](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Selectors/::search-text) covers the property allowlist in detail, and the [CSS-Tricks almanac entry](https://css-tricks.com/almanac/pseudo-selectors/s/search-text/) has live demos worth poking at.
