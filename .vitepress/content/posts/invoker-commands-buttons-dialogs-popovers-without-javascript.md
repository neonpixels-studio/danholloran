---
date: "2026-07-02T08:49:42.000-05:00"
tags: ["web-apis", "html", "accessibility", "javascript"]
draft: false
title: "Invoker Commands: Wiring Buttons to Dialogs and Popovers Without JavaScript"
image: "/images/posts/invoker-commands-buttons-dialogs-popovers-without-javascript.jpg"
topic: "development"
description: "The Invoker Commands API lets a button declare what it controls with command and commandfor, replacing modal and popover glue code with plain HTML."
---

Every time you wire up a modal, you end up writing the same three lines of JavaScript: grab the button, grab the dialog, attach a click listener that calls `showModal()`. Do it again for the close button. Do it again for the next popover, the next dropdown, the next confirmation box. Across a real app, that adds up to a pile of glue code whose only job is connecting one element to another. The Invoker Commands API deletes most of that glue by letting a button say, right in the HTML, what it controls and what it does.

## Two attributes, no listener

The API adds two attributes to `<button>`: `commandfor` points at the `id` of the element you want to control, and `command` names the action. For a dialog, that looks like this:

```html
<button command="show-modal" commandfor="confirm">Delete</button>

<dialog id="confirm">
  <p>Delete this item?</p>
  <button command="close" commandfor="confirm">Cancel</button>
</dialog>
```

There is no script here at all. The first button opens the dialog as a modal; the button inside closes it. The browser ships a set of built-in commands for exactly the elements that used to need boilerplate: dialogs get `show-modal` and `close`, and popovers get `toggle-popover`, `show-popover`, and `hide-popover`.

A popover menu is just as terse:

```html
<button command="toggle-popover" commandfor="menu">Menu</button>

<div id="menu" popover>
  <a href="/profile">Profile</a>
  <a href="/logout">Log out</a>
</div>
```

## Why this beats a click handler

The obvious win is less code, but the real win is behavior you would otherwise have to remember to implement. Because the browser owns the interaction, you inherit correct focus management, the `Escape`-to-close behavior for dialogs and popovers, and the accessibility relationships between the trigger and its target for free. That is a category of bug (the modal that traps focus wrong, the popover that does not close on outside click) that simply stops happening.

There is also a deliberate constraint: only `<button>` can be an invoker. Links and inputs cannot use `commandfor`, because a command is an action, and buttons are the element with the right keyboard and semantic behavior for actions. And since the wiring lives in markup, it works the moment the HTML parses, before any JavaScript hydrates. For server-rendered pages and islands-style architectures, that means your dialogs and menus are interactive without waiting on a bundle.

## Custom commands for your own behavior

Built-ins cover dialogs and popovers, but the API is not limited to them. You can define your own command with a double-dash prefix, following the same "dashed-ident" convention as CSS custom properties. The `--` namespace is reserved: the browser guarantees it will never ship a built-in command starting with it, so your names can never collide with a future addition.

A custom command fires a `command` event on the _target_ element, and you listen there:

```html
<button command="--rotate-left" commandfor="photo">Rotate left</button>
<button command="--reset" commandfor="photo">Reset</button>

<img id="photo" src="/cat.jpg" alt="A cat, upright" />
```

```js
const photo = document.getElementById("photo");

photo.addEventListener("command", (event) => {
  if (event.command === "--rotate-left") {
    // rotate and update alt text
  } else if (event.command === "--reset") {
    // reset
  }
  // event.source is the button that triggered the command
});
```

One gotcha worth internalizing: the `command` event does **not** bubble. You have to listen on the target element itself, not on a shared ancestor, so event delegation patterns will not pick it up.

## Where support stands

This is not a "someday" feature. As of late 2025 the Invoker Commands API reached Baseline across Chrome and Edge (135+), Firefox, and Safari, so you can use it in production for the browsers most projects target. If you still support older versions, it degrades cleanly: a `<button>` with `command`/`commandfor` is just a button where the attributes are ignored, so a small click-handler fallback (or a feature check like `"command" in HTMLButtonElement.prototype`) keeps things working everywhere.

The practical rule of thumb: reach for `command` and `commandfor` first for dialogs, popovers, and simple UI toggles, and only drop down to JavaScript when you need genuinely custom behavior, which the custom-command event gives you a clean hook for. You end up with fewer listeners, less hydration-order fragility, and accessibility handled by the platform instead of by you.
