---
date: "2026-08-13T02:08:20.000-05:00"
tags: ["css", "accessibility"]
draft: false
title: "CSS text-box-trim: The End of Fudging Vertical Padding"
image: "/images/posts/css-text-box-trim-the-end-of-fudging-vertical-padding.jpg"
topic: "development"
description: "Buttons that look bottom-heavy at padding: 12px aren't your fault, they're half-leading. text-box-trim finally lets CSS cut that invisible space, and it goes Baseline this month."
---

You give a button `padding: 12px` and it comes out looking bottom-heavy. So you split it: `padding: 10px 12px 14px`, squint, nudge the numbers, ship it. Two sprints later design swaps the type family and every one of those hand-tuned values is wrong again, because the new font reserves a different amount of invisible space than the old one did.

That invisible space has a name, and as of this month you can finally cut it off.

## Where the extra space comes from

Every font ships with metrics that describe more than the letters you can see. There's room above the capitals for accents and diacritics, and room below the baseline for descenders, and the browser reserves all of it whether or not a single "p" appears in your text. On top of that, `line-height` adds leading, which the web splits in half and distributes evenly above and below the content area. Matthias Ott's [The Thing With Leading In CSS](https://matthiasott.com/notes/the-thing-with-leading-in-css) walks through the typesetting history behind that split, but the practical upshot is simple: a text box is always taller than its text, by an amount that changes per font and per `line-height`.

Symmetric padding on top of an asymmetric box gives you an asymmetric-looking result. That's the whole bug.

## The two properties

`text-box-trim` says which edges to cut. `text-box-edge` says where to cut to.

```css
h1 {
  text-box-trim: trim-both; /* trim-start | trim-end | trim-both | none */
  text-box-edge: cap alphabetic; /* over-edge, then under-edge */
}
```

`cap` trims the over edge down to the top of the capital letters. `ex` trims to the x-height instead, which is a nicer optical match for some display faces. `alphabetic` trims the under edge flush with the baseline. There's a `text` value on both sides if you want the font's own text edges rather than the letterform edges.

In practice you'll write the shorthand and move on:

```css
button {
  text-box: trim-both cap alphabetic;
  padding: 12px;
}
```

That's the version you want roughly all of the time. Now `padding: 12px` actually means twelve pixels of visible space on every side, in every font, and swapping the type family doesn't silently re-break your spacing.

## Where it actually pays off

**Optical centering.** Buttons, badges, pill-shaped tags, anything small and intrinsically sized. These are the components where half-leading is proportionally largest and most obvious.

**Aligning text next to non-text.** Put a 40px avatar beside a heading and the heading's box is taller than its letters, so the two never quite line up. Trim the heading and they do.

**Gaps that mean something.** In a stacked block of text, `gap` and `margin-block` measure box edges, which include the invisible band on both sides. Trim the leading and your rhythm values start describing the space a reader actually perceives, instead of that space minus an unknown font-dependent constant.

One caveat worth being deliberate about: trimming removes _visual_ space, not just visual space you didn't want. If you trim a button and don't add the padding back, you've quietly shrunk the tap target. WCAG 2.2's target size minimum is 24 by 24 CSS pixels, and half-leading was doing invisible work toward that number. Trim, then set the padding you actually meant.

Multi-line text behaves the way you'd hope: the trim applies above the first formatted line and below the last one, never between lines. And because it's defined in terms of over and under rather than top and bottom, it follows `writing-mode` correctly without any extra work.

## Shipping it

Chrome and Edge have had this since 133, Safari since 18.2, and Firefox 154 turns it on by default. That release is dated August 18, 2026, which makes `text-box` a Baseline newly-available feature about a week from now.

Even before that lands everywhere, the failure mode is the kindest one CSS offers: a browser that doesn't recognize the property ignores the declaration and renders the spacing it always did. Nothing collapses, nothing overlaps, you just don't get the tightening. That makes it safe to add today with no fallback at all.

If the trimmed spacing is load-bearing in a particular component, gate the compensating padding behind a feature query so the two values stay in sync:

```css
.tag {
  padding: 6px 12px;
}

@supports (text-box: trim-both cap alphabetic) {
  .tag {
    text-box: trim-both cap alphabetic;
    padding: 10px 12px;
  }
}
```

If you've ever used Figma's vertical trim control and wondered why the handoff never matched, this is the missing half. Adam Argyle's [Chrome for Developers post](https://developer.chrome.com/blog/css-text-box-trim) has an interactive playground that's worth ten minutes of poking at with your own type stack, and the [MDN reference](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/text-box-trim) has the full value grammar. Start with your buttons. The difference is small, and you will not be able to unsee it.
