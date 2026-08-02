---
date: "2026-08-02T02:08:00.000-05:00"
tags: ["javascript", "web-apis", "tooling"]
draft: false
title: "The Sanitizer API: Safe HTML Injection Without DOMPurify"
image: "/images/posts/the-sanitizer-api-safe-html-injection-without-dompurify.jpg"
topic: "development"
description: "The browser can now strip XSS from an HTML string during parsing. Here's how setHTML works, why its config can only narrow the allowlist, and how to ship it before Safari catches up."
---

Every codebase I've worked in has the same line hiding somewhere: an `innerHTML` assignment with a `// TODO: sanitize` comment above it that nobody ever got back to. The usual fix is to reach for DOMPurify, ship another 20-odd kilobytes, and move on. It works, but it's a strange arrangement when you look at it directly. DOMPurify has to parse the HTML itself, walk the result, strip the dangerous parts, and serialize it back to a string, which the browser then parses _again_. Two parsers, two interpretations of the same bytes. Mutation XSS is what happens in the gap between them, when the sanitizer's idea of what a string means and the browser's idea quietly disagree.

The HTML Sanitizer API closes that gap by moving sanitization into the parse itself. There's no second parser and no round trip through a string.

## setHTML is a drop-in for innerHTML

The common case needs no configuration at all:

```js
const untrustedString = "abc <script>alert(1)</script> def";
const target = document.getElementById("target");

// target.innerHTML = untrustedString;
target.setHTML(untrustedString);

console.log(target.innerHTML); // "abc  def"
```

`setHTML()` runs a baseline XSS-safe policy that you cannot turn off. Script elements, event handler attributes, and dangerous URL schemes are gone. It also drops elements the HTML spec doesn't permit as children of the target, so a `<td>` pasted into a `<div>` doesn't survive.

The same pattern exists on `ShadowRoot.setHTML()` and as a static `Document.parseHTML()` when you want a whole document rather than a subtree. Each has an `Unsafe` sibling, which is the important part of the story.

## The config narrows, it never widens

This is the detail people get wrong, and it's the reason the two method families exist.

When you pass a config to `setHTML()`, it is a _further restriction_ on top of the safe baseline. You can subtract from what's allowed; you cannot add to it. Allowing `onclick` in a config handed to `setHTML()` does nothing, because the safe path strips it regardless.

```js
const commentSanitizer = new Sanitizer({
  elements: ["p", "em", "strong", "code", { name: "a", attributes: ["href"] }],
});

commentBody.setHTML(userComment, { sanitizer: commentSanitizer });
```

`setHTMLUnsafe()` inverts that: your config becomes the entire rule, safety net included in whatever you wrote. If you allow `onclick` there, `onclick` stays. The intended pattern is to start from the default sanitizer, which already permits everything XSS-safe, and open exactly one door:

```js
const sanitizer = new Sanitizer(); // safe defaults as a starting point
sanitizer.allowElement({ name: "button", attributes: ["onclick"] });

target.setHTMLUnsafe(untrustedHTML, { sanitizer });
```

You've now got one known hole to reason about instead of an open field. Pair the unsafe methods with [Trusted Types](https://developer.mozilla.org/en-US/docs/Web/API/Trusted_Types_API) and pass `TrustedHTML` rather than raw strings, or you've given back most of what the API bought you.

One sharp edge worth knowing before you hit it: a config can carry an allow list or a remove list, but not both at the same level. Mixing `elements` with `removeElements` throws a `TypeError`. You can combine `elements` with a per-element `removeAttributes`, which is how you say "allow anchors, but strip `type` off them."

## Shipping it in 2026

Support is real but uneven. Firefox shipped it in 148 and Chrome followed in 146; Safari hasn't implemented it yet, which keeps the API off Baseline. Check [the MDN compatibility table](https://developer.mozilla.org/en-US/docs/Web/API/HTML_Sanitizer_API) before you plan around it, since that picture moves.

Until Safari lands, feature-detect and keep the library as a fallback. The wrapper is small enough to be uninteresting, which is the point:

```js
import DOMPurify from "dompurify";

const hasNativeSanitizer = "setHTML" in Element.prototype;

export function setSafeHTML(element, html, sanitizer) {
  if (hasNativeSanitizer) {
    element.setHTML(html, sanitizer ? { sanitizer } : undefined);
  } else {
    element.innerHTML = DOMPurify.sanitize(html);
  }
}
```

Route every untrusted insertion through one function like this and you get the native path where it exists, the library where it doesn't, and a single place to delete code from later. That last part is the real win. Most platform features arrive as something new to learn. This one arrives as a dependency you eventually get to remove.

Start with the paste handlers and the Markdown preview panes, the places where user content reaches the DOM most often. Then go find that `// TODO: sanitize` comment.
