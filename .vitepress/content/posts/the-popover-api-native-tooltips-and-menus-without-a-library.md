---
date: '2026-06-22T07:08:29.000+00:00'
tags: ['javascript', 'css', 'web-apis', 'accessibility']
draft: true
title: "The Popover API: Native Tooltips and Menus Without a Library"
image: '/images/posts/the-popover-api-native-tooltips-and-menus-without-a-library.jpg'
topic: 'development'
description: "The Popover API is now Baseline Widely Available — meaning you can build fully accessible tooltips, menus, and overlays with a single HTML attribute and zero JavaScript."
---

For years, building a tooltip meant pulling in a library, wiring up a bunch of event listeners, wrestling with `z-index`, and hoping your focus trap actually trapped focus. The browser had no concept of "a thing that floats above other content and closes when you click away." You had to simulate it from scratch every time.

That era is over. The Popover API — Baseline Widely Available since April 2025 — gives the browser a native understanding of popovers. Chrome, Firefox, Safari, and Edge all support it. The basic pattern requires nothing but HTML.

## The Basics: One Attribute, One Target

The minimal setup is two attributes:

```html
<button popovertarget="my-menu">Open Menu</button>

<ul id="my-menu" popover>
  <li>Edit</li>
  <li>Duplicate</li>
  <li>Delete</li>
</ul>
```

The `popover` attribute on the `<ul>` registers it as a popover element. The `popovertarget` on the button wires the two together. Click the button — the menu appears. Click outside, or press Escape — it closes. That's it. No JavaScript, no custom event listeners, no `document.addEventListener('click', ...)` to handle light dismissal.

You can control the behavior more precisely with `popovertargetaction`:

```html
<button popovertarget="my-menu" popovertargetaction="show">Open</button>
<button popovertarget="my-menu" popovertargetaction="hide">Close</button>
<button popovertarget="my-menu" popovertargetaction="toggle">Toggle</button>
```

And if you need JavaScript control, there's a matching imperative API:

```js
const menu = document.getElementById('my-menu');
menu.showPopover();
menu.hidePopover();
menu.togglePopover();
```

The `popover` element is also removed from the normal flow and placed in the [top layer](https://developer.mozilla.org/en-US/docs/Glossary/Top_layer) — the same layer used by `<dialog>`. This means you never fight `z-index` again. The popover is always above everything else, by design.

## Popover Types: auto, hint, and manual

The `popover` attribute accepts three values that control dismissal behavior.

**`auto`** (the default when you write just `popover`) is the right choice for most interactive UI — menus, dropdowns, command palettes. It supports light dismissal (click outside to close) and enforces exclusivity: opening one `auto` popover automatically closes any other `auto` popover that's already open. Keyboard users get Escape handling for free.

**`manual`** (`popover="manual"`) turns off light dismissal entirely. The popover stays open until you explicitly close it via JavaScript or a `popovertargetaction="hide"` button. This is the right mode for things like notification toasts or tutorial overlays that shouldn't vanish when the user happens to click elsewhere.

**`hint`** (`popover="hint"`) is newer and fills the gap between the two. Hint popovers don't close auto popovers when they open, but they will close other hint popovers. They support light dismissal. The intended use case is hover tooltips — the kind that appear on `mouseenter` and should coexist with a menu already open.

```html
<span id="tip" popover="hint">This field is required</span>
<label aria-describedby="tip">Email</label>
```

## Styling, Animation, and Anchor Positioning

By default, a closed popover is `display: none`. The `:popover-open` pseudo-class lets you style it in its open state:

```css
[popover] {
  opacity: 0;
  transition: opacity 0.2s, display 0.2s allow-discrete;
}

[popover]:popover-open {
  opacity: 1;
}

@starting-style {
  [popover]:popover-open {
    opacity: 0;
  }
}
```

The `@starting-style` block defines where the element should animate *from* when it first enters the open state — this is what makes entry animations work without JavaScript. `allow-discrete` tells the browser to animate `display` as a discrete property so the element isn't instantly hidden at the end of a close transition.

For positioning the popover relative to its trigger, combine with [CSS Anchor Positioning](https://danholloran.me/posts/css-anchor-positioning-stop-using-javascript-for-tooltips): any element with a `popovertarget` attribute automatically becomes an implicit anchor for the popover it controls, so you can reference it with `position-anchor: auto`:

```css
[popover] {
  position: absolute;
  position-anchor: auto;
  top: anchor(bottom);
  left: anchor(left);
}
```

This is the browser finally connecting all the pieces: the trigger knows about the popover, the popover knows where to anchor itself, and the stacking context is handled by the top layer. The pattern that used to require Popper.js or Floating UI now needs zero dependencies.

## When to Reach for It

The Popover API covers a wide surface: action menus, dropdowns, command palettes, notification toasts, teaching overlays, content pickers, and custom `<select>`-style inputs. It's *not* a full replacement for `<dialog>` — dialogs have `role="dialog"`, trap focus, and block the rest of the page. Popovers don't block the page and are better for non-modal UI.

The accessibility story is solid out of the box. `aria-expanded` updates automatically on the controlling button. Tab and Shift+Tab work normally inside the popover. Escape closes it (for `auto` and `hint`). For most use cases, you get a semantically appropriate, keyboard-navigable, screen-reader-friendly overlay for free.

If you're still using a JS library purely to handle click-outside and z-index for a dropdown, it's time to uninstall it.
