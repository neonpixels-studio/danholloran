---
date: '2026-06-25T07:09:07.000+00:00'
tags: ['javascript', 'web-apis', 'html', 'accessibility']
draft: true
title: "The Popover API: Native Popovers Without the JavaScript Ceremony"
image: '/images/posts/popover-api-native-popovers-without-javascript.jpg'
topic: 'development'
description: "The Popover API gives you tooltips, dropdown menus, and toast notifications as a first-class browser feature — no focus traps, no outside-click listeners, and no accessibility bugs to chase down."
---

Every app has popovers. A help tooltip here, a settings dropdown there, a toast notification when something saves. And for years, every team has been building the same thing: a `useState` for open/closed, a `useEffect` for the Escape key, a `ref` and `mousedown` listener to detect clicks outside, and some frantic ARIA attribute shuffling so screen readers don't get lost. You've written this code. I've written this code. It's always slightly different and always slightly broken in at least one browser.

The Popover API is the browser's answer to all of that. It's a small set of HTML attributes that give you floating overlays with built-in light-dismiss, keyboard handling, top-layer rendering, and correct accessibility semantics — and in most cases you don't need a single line of JavaScript to wire it up.

## The Three Pieces

There are really only three attributes to learn.

The `popover` attribute goes on the element you want to float. It accepts three values: `auto` (the default — light-dismissable, only one open at a time), `hint` (for transient tooltips that coexist alongside `auto` popovers), and `manual` (you control showing and hiding entirely).

The `popovertarget` attribute goes on any `<button>` or `<input type="button">` that should toggle the popover. Set its value to the ID of the popover element.

That's it for a basic dropdown:

```html
<button popovertarget="settings-menu">Settings</button>

<div id="settings-menu" popover>
  <ul>
    <li>Profile</li>
    <li>Notifications</li>
    <li>Sign out</li>
  </ul>
</div>
```

The browser handles opening on click, closing on Escape, closing when the user clicks outside, rendering above everything else in the top layer (no `z-index` wars), and wiring up the accessibility relationship between button and panel. What used to require a focus trap library and a `popper.js` dependency is now four attributes.

`popovertargetaction` is the third attribute — optional, and used when you want a button to only show or only hide rather than toggle:

```html
<button popovertarget="toast" popovertargetaction="show">Save</button>
<button popovertarget="toast" popovertargetaction="hide">Dismiss</button>
<div id="toast" popover="manual" role="status">Changes saved!</div>
```

## Picking the Right Mode

**`popover="auto"`** is for things the user intentionally opens: dropdowns, menus, command palettes. It light-dismisses when the user clicks outside or presses Escape, and it closes any other open `auto` popover first. This is the right default.

**`popover="hint"`** is for tooltips — things that appear on hover or focus, not on click. Hints close other hints when a new one opens, but they leave `auto` popovers alone. So a toolbar with a dropdown *and* hover tooltips on the buttons works without them fighting each other. This mode is newer (shipped in Chrome 129 and Safari 18.4) and you'll need a small event listener to show/hide on hover:

```js
const tip = document.getElementById('btn-tooltip');

button.addEventListener('mouseenter', () => tip.showPopover());
button.addEventListener('mouseleave', () => tip.hidePopover());
button.addEventListener('focus',      () => tip.showPopover());
button.addEventListener('blur',       () => tip.hidePopover());
```

**`popover="manual"`** opts out of all automatic behavior. You call `showPopover()` and `hidePopover()` yourself. Useful for toast notifications where you want to control exactly when something appears and disappears — typically on a timer.

## Combining with CSS Anchor Positioning

The Popover API handles visibility; it doesn't handle *placement*. Out of the box, the popover appears in the center of the viewport. To position it relative to its trigger, pair it with CSS Anchor Positioning, which now has baseline support across Chrome 125+, Firefox 132+, and Safari 18.2+.

```html
<button id="menu-btn" popovertarget="menu">Options ▾</button>

<ul id="menu" popover anchor="menu-btn">
  <li>Edit</li>
  <li>Delete</li>
</ul>
```

```css
#menu {
  position: absolute;
  position-anchor: --menu-btn;
  anchor-name: --menu-btn; /* set on the button via JS or CSS */
  top: anchor(bottom);
  left: anchor(left);
  margin-top: 4px;
}
```

The browser keeps the menu anchored to the button and handles edge detection automatically when you add `@position-try` fallbacks. No Popper, no Floating UI, no scroll event listeners.

## What the Popover API Is Not

It's not a replacement for `<dialog>`. If you need a true modal — one that traps focus, blocks interaction with everything behind it, and requires explicit user action to dismiss — use `dialog.showModal()`. The Popover API creates non-modal overlays that still let the user interact with the rest of the page.

It also doesn't position the element for you without CSS Anchor Positioning, and it doesn't animate in/out by default. For entry and exit animations, combine it with `@starting-style` and `transition: display` (both part of discrete property animations available in modern browsers).

## Where to Start

The Popover API works in Chrome 114+, Safari 17.4+, Firefox 125+, and Edge 114+ — broad enough that there's no reason to hold off. The practical migration path: find the next tooltip or dropdown you'd normally reach for a library to build, and build it with `popover` instead. The amount of code you delete will be motivating.
