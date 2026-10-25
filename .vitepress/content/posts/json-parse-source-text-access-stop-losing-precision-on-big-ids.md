---
date: "2026-10-25T02:05:43.000-07:00"
tags: ["javascript", "web-apis", "node", "json"]
draft: false
title: "JSON.parse Source Text Access: Stop Losing Precision on Big IDs"
image: "/images/posts/json-parse-source-text-access-stop-losing-precision-on-big-ids.jpg"
topic: "development"
description: "JSON.parse can now hand your reviver the original source text of every number, and JSON.rawJSON lets you write it back out exactly. Here's how to round-trip 64-bit IDs and decimals without string hacks."
---

Your API returns an order ID of `9007199254740993`. Your frontend logs `9007199254740992`. Nobody touched it. `JSON.parse` quietly rounded it, because every JSON number becomes a JavaScript double, and doubles only hold integers exactly up to `Number.MAX_SAFE_INTEGER` (`9007199254740991`). Anything bigger gets snapped to the nearest representable value before your code ever sees it.

The usual workarounds are all a little sad. Ask the backend to send IDs as strings (`id_str`, if you remember the old Twitter API). Pull in a third-party parser like `json-bigint`. Or run a regex over the raw response to wrap long numbers in quotes before parsing, and hope nothing in a string field looks like a number. The platform now has a real fix: the JSON.parse source text access proposal, which adds a `context` argument to revivers and a matching `JSON.rawJSON()` for serialization. It reached Stage 4 at TC39 in late 2025, and it is already Baseline: Chrome 114, Firefox 135, Safari 18.4, Node 21, Deno 1.33, and Bun 1.1.43 all ship it.

## The reviver gets a third argument

A reviver has always received `(key, value)`. It now receives `(key, value, context)`, and for primitive values `context.source` is the exact slice of JSON text that produced `value`. The number was still parsed into a lossy double, but you get the original digits next to it, so you can decide what it should become.

```js
const json = '{"orderId": 9007199254740993, "total": 42.5}';

const order = JSON.parse(json, (key, value, context) => {
  if (key === "orderId") {
    // value is already rounded; context.source is not
    return BigInt(context.source);
  }
  return value;
});

order.orderId; // 9007199254740993n
order.total; // 42.5
```

Keying off property names works when you control the schema, but a generic version is more useful in a shared fetch helper. Promote only integers that actually lost precision, and leave everything else alone:

```js
const INTEGER = /^-?\d+$/;

export function preciseReviver(key, value, context) {
  if (
    typeof value === "number" &&
    !Number.isSafeInteger(value) &&
    context?.source &&
    INTEGER.test(context.source)
  ) {
    return BigInt(context.source);
  }
  return value;
}

const res = await fetch("/api/orders");
const data = JSON.parse(await res.text(), preciseReviver);
```

Two details there matter. `Response.json()` doesn't accept a reviver, so you read the body as text and parse it yourself. And the optional chaining on `context?.source` is deliberate: `context.source` only exists for primitives. When the reviver is called for an object or array, `source` is absent, because there's no single meaningful slice of text to give you once the children have already been revived.

## Writing it back out with JSON.rawJSON

Parsing is half the problem. Hand that `BigInt` to `JSON.stringify` and you get `TypeError: Do not know how to serialize a BigInt`. Convert it to a `Number` first and you're back to rounding. `JSON.rawJSON()` closes the loop: it wraps a piece of JSON text that `stringify` will emit verbatim.

```js
function preciseReplacer(key, value) {
  return typeof value === "bigint" ? JSON.rawJSON(value.toString()) : value;
}

JSON.stringify({ orderId: 9007199254740993n }, preciseReplacer);
// '{"orderId":9007199254740993}'
```

The output is a real JSON number, not a quoted string, so a Go or Java backend expecting an `int64` reads it without any schema change. `JSON.rawJSON` is strict about what it accepts: the text must be valid JSON for a primitive, so `JSON.rawJSON('[1, 2]')` or a string containing a raw line break throws a `SyntaxError`. The returned object is frozen with a null prototype, and `JSON.isRawJSON()` tells you if you're holding one.

## Decimals, not just big integers

Money is the other place this pays off. `0.1` parsed as a double is not exactly one tenth, and a payments API that returns `"amount": 19.99` hands you a value that's already slightly wrong before your decimal library sees it. With `context.source` you can feed the original digits straight into whatever arbitrary-precision type you use:

```js
import Decimal from "decimal.js";

const invoice = JSON.parse(body, (key, value, context) =>
  key === "amount" ? new Decimal(context.source) : value,
);
```

On the way out, `JSON.rawJSON(amount.toFixed(2))` writes `19.99` as an unquoted number again.

## When not to reach for it

A reviver runs once per value in the document, so it is measurably slower than a plain `JSON.parse` on large payloads. If your IDs are already strings, or every number fits in the safe range, you don't need any of this. In TypeScript, older `lib` definitions may not know about the third reviver argument or `JSON.rawJSON` yet, so you might need a small ambient declaration until your `lib` setting catches up. For older browsers, `core-js` ships a polyfill for both halves.

The bigger change is where the fix lives. Precision used to be something you negotiated with the backend team or patched with a dependency. Now it's a few lines in the one fetch helper every request already goes through. MDN's pages on [`JSON.parse()`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/parse) and [`JSON.rawJSON()`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/rawJSON) have the full reference, and the [TC39 proposal](https://github.com/tc39/proposal-json-parse-with-source) covers the design reasoning.
