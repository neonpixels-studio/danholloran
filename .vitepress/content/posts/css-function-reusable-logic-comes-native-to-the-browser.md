---
date: "2026-07-19T02:08:59.000-05:00"
tags: ["css", "tooling", "web-apis"]
draft: false
title: "CSS @function: Reusable Logic Comes Native to the Browser"
image: "/images/posts/css-function-reusable-logic-comes-native-to-the-browser.jpg"
topic: "development"
description: "CSS finally has real, reusable functions. The new @function at-rule lets you define typed helpers that run in the browser with live values — here is how it works and where it is supported today."
---

For years, the honest answer to "can I write my own function in CSS?" was "no, use Sass." You wanted to name a bit of logic, hand it some arguments, and get a value back. CSS gave you custom properties and `calc()`, which are genuinely powerful, but the moment you needed a value that depended on its inputs you were back in a preprocessor. That gap is finally closing. The `@function` at-rule lets you define real, reusable functions that run in the browser, at runtime, with live custom-property values flowing through them.

## What @function actually does

A custom function starts with the `@function` at-rule and a name that, like a custom property, begins with two dashes. Inside, you compute whatever you want and hand back a value with the `result` descriptor:

```css
@function --double(--value) {
  result: calc(var(--value) * 2);
}

.card {
  padding: --double(1rem); /* 2rem */
}
```

You call it with the dashed name, exactly like a built-in function. The difference from a Sass function is the whole point: this evaluates in the browser, so `--double(var(--space))` recomputes whenever `--space` changes — from a media query, a `:hover`, a container query, or a line of JavaScript. A Sass function baked its answer into the stylesheet at build time and never looked at it again.

## Types, defaults, and real logic

Parameters can carry a type and a default value, and the function can declare what type it returns. That turns a loose expression into something closer to a typed helper:

```css
@function --progression(--current <number>, --total <number>) returns
  <percentage> {
  result: calc(var(--current) / var(--total) * 100%);
}

.bar {
  width: --progression(3, 4); /* 75% */
}
```

Defaults mean a call still works when you leave an argument off, which is how you build helpers people actually want to use. A fluid-type function is the example everyone reaches for, because the `clamp()` expression it wraps is exactly the kind of thing nobody enjoys retyping:

```css
@function --fluid-type(--min, --max, --rate: 4vw) {
  result: clamp(var(--min), var(--rate) + 1rem, var(--max));
}

h1 {
  font-size: --fluid-type(1.5rem, 3rem);
}
p {
  font-size: --fluid-type(1rem, 1.25rem, 0.5vw);
}
```

The body is not limited to one line either. A function can define its own local custom properties, and it can even contain `@media` or `@supports` blocks that change what `result` resolves to — conditional logic that used to mean duplicating a whole rule. Once you have that, keeping a `functions.css` next to your `reset.css`, the way you keep a `utils.js` next to your app, stops being a preprocessor habit and becomes plain CSS.

## The catch: support is early

Here is the part to be clear-eyed about. `@function` shipped in Chromium first — Chrome and Edge from version 139, and it is still settling in — while Firefox and Safari are implementing it but are not there yet. It is explicitly not Baseline, so treating it as production-ready across every browser is a mistake today.

That does not make it useless now, because custom functions degrade in a way you can plan for. Give everyone a plain value first, then override it with the function call:

```css
.bar {
  width: 75%; /* fallback everyone gets */
  width: --progression(3, 4); /* used only where supported */
}
```

A browser that does not recognize the `--progression(...)` call throws out that second declaration as invalid and keeps the first. That is the same cascade-based fallback that carried us through years of new CSS, and it means you can start writing functions today for the parts of your interface where a slightly simpler result in older browsers is perfectly fine.

CSS has spent the last few years absorbing features we used to import a whole toolchain for — nesting, `@layer`, container queries, and now functions. `@function` is the one that most directly erodes the reason to keep Sass around for logic. It is not ready to be your only strategy yet, but it is ready to learn, and the mental model — name it, type it, return a value — is one you already have. Skim the [MDN guide](https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Custom_functions_and_mixins) and try rewriting your ugliest `clamp()` as a named function. It is a good first taste of where CSS is heading.
