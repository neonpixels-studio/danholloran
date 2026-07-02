---
date: '2026-07-02T02:07:22.000-05:00'
tags: ['css', 'web-apis', 'accessibility', 'forms']
draft: true
title: "CSS field-sizing: Auto-Growing Textareas Without a Line of JavaScript"
image: '/images/posts/css-field-sizing-auto-growing-textareas-without-javascript.jpg'
topic: 'development'
description: "The auto-growing textarea has been a JavaScript rite of passage for years. A single CSS declaration now does the whole job, and it works on inputs and selects too."
---

Every frontend developer has written the auto-growing textarea at least once. You listen for `input`, reset the height to `auto`, read `scrollHeight`, and set the height to match. Then you discover it breaks on paste, fights with `box-sizing`, flickers on the first render, and needs a `ResizeObserver` to survive a font swap. It is a surprising amount of code for "make the box as tall as the text."

That whole dance collapses into one line now. The `field-sizing` CSS property tells a form control to size itself to its content instead of to a fixed box, and it does it natively, in the browser's layout engine, with no listeners and no reflow thrash.

## One declaration, done

The property takes two keywords: `fixed` (the default, the behavior you already know) and `content`. Set `content` and the field shrink-wraps what is inside it, growing as the user types.

```css
textarea {
  field-sizing: content;
  min-height: 4lh;   /* start at four lines tall */
  max-height: 20lh;  /* cap it, then scroll */
}
```

That is the entire feature. No `rows` attribute needed, in fact `rows` and `cols` are ignored once `field-sizing: content` is set. The textarea behaves like a single-line control that happens to wrap: when it hits a width constraint it grows in height instead, and when it hits your `max-height` it finally shows a scrollbar. The `lh` unit here is worth knowing too, it means "one line-height," so your min and max read as line counts rather than magic pixel values.

The important best practice: do not pair `field-sizing: content` with a fixed `height`. A hard `height` reimposes exactly the fixed box you are trying to escape. Reach for `min-height` and `max-height` (or `min-width`/`max-width`) instead. They let the control breathe while still bounding it, and they are what keep a chat composer from swallowing the whole viewport when someone pastes an essay.

## It is not just for textareas

This is the part most people miss. `field-sizing` works on `input` and `select` too, and that is where it quietly solves a pile of annoying layout problems.

An `input` with `field-sizing: content` sizes to its value, which is perfect for inline-editable UI, tag editors, or a numeric stepper that should be exactly as wide as its digits rather than a fixed 200px slab.

```css
input[type="text"],
input[type="number"] {
  field-sizing: content;
  min-width: 3ch;
}
```

Selects are the real sleeper. A `<select>` normally sizes to its *widest* option, so one long entry pads out the control even when a short value is chosen. With `field-sizing: content`, the closed select is only as wide as the currently selected option, and a `multiple` list box grows to show its rows without an inner scrollbar. Filter bars and toolbars stop looking lopsided for free.

## Shipping it safely

`field-sizing` landed in Chromium back in Chrome 123 and has since spread across Chromium browsers and Safari, with Firefox as the notable holdout as of mid-2026. Check [caniuse](https://caniuse.com/mdn-css_properties_field-sizing) for the current picture before you lean on it, because this list moves.

Here is why you can adopt it today anyway: the failure mode is graceful. A browser that does not understand `field-sizing` ignores the declaration and renders the field at its normal fixed size, which is precisely the behavior you have now. That makes it a textbook progressive enhancement, so you can drop it in without a polyfill and without a fork in your code.

```css
.composer {
  field-sizing: content;
  min-height: 2lh;
  max-height: 40vh;
}
```

If you want the *exact* behavior everywhere, keep your JavaScript resizer as a fallback and gate it behind a feature check:

```js
if (!CSS.supports("field-sizing", "content")) {
  enableManualAutoGrow(textarea);
}
```

Most teams will not bother. The number of production UIs that genuinely break when a textarea stays a fixed height in old Firefox is small, and shrinking a bundle by deleting a resize utility is its own reward. After years of treating auto-sizing form fields as a scripting problem, it turns out the platform just needed one property. Delete the `ResizeObserver`, delete the `input` listener, and let CSS do layout.
