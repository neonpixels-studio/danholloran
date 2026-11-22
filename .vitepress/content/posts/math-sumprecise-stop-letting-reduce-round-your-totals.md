---
date: "2026-11-22T02:15:00.000-08:00"
tags: ["javascript", "web-apis", "testing"]
draft: false
title: "Math.sumPrecise: Stop Letting reduce() Round Your Totals"
image: "/images/posts/math-sumprecise-stop-letting-reduce-round-your-totals.jpg"
topic: "development"
description: "Summing floats with reduce() rounds at every step, so the total depends on array order. Math.sumPrecise rounds once. Here's when that matters."
---

Every JavaScript codebase has this line somewhere:

```js
const total = values.reduce((sum, n) => sum + n, 0);
```

It looks too simple to be wrong, and most of the time it is close enough. But it has a property most of us never think about: the answer depends on the order of the array. Sort the same numbers differently and you can get a different total. That is the kind of bug that shows up as a flaky snapshot test, or a dashboard where two charts built from the same data disagree in the last decimal place.

`Math.sumPrecise()` is the fix the language now ships. It reached Baseline in April 2026 (Chrome 147, Firefox 137, Safari 26.2) and is part of ECMAScript 2026. It takes an iterable of numbers and returns their sum, rounded once at the end instead of once per addition.

## Why reduce() drifts

A JavaScript number is a 64-bit float. Every time you add two of them, the result gets rounded to the nearest value a float can hold. A loop of `n` additions performs `n` roundings, and the errors pile up. Worse, the error each step introduces depends on how big the running total is at that moment, so order matters:

```js
const add = (s, n) => s + n;
const a = [0.1, 0.2, 0.3, 0.4];
const b = a.toReversed();

a.reduce(add, 0); // 1
b.reduce(add, 0); // 0.9999999999999999

Math.sumPrecise(a); // 1
Math.sumPrecise(b); // 1
```

The classic way to see the damage at full strength is to mix large and small magnitudes. MDN's own example:

```js
[1e20, 0.1, -1e20].reduce((s, n) => s + n, 0); // 0
Math.sumPrecise([1e20, 0.1, -1e20]); // 0.1
```

`1e20 + 0.1` cannot be represented, so the intermediate result rounds back to `1e20`, and the `0.1` is simply gone. `Math.sumPrecise` behaves as if it added the exact mathematical values of every input and only rounded the final answer, so the small value survives.

Even a boring case benefits. Ten copies of `0.1` summed with `reduce()` give `0.9999999999999999`. `Math.sumPrecise` gives `1`.

## What it does not fix

This is the part worth reading twice. `Math.sumPrecise` removes the error that _accumulates during addition_. It does not remove the error that already exists in each input. The literal `0.1` is not one tenth; it is the closest float to one tenth, which is slightly larger. So:

```js
Math.sumPrecise([0.1, 0.2]); // 0.30000000000000004
```

That is the correctly rounded sum of the two floats you actually passed in. It is the best possible answer, just not the decimal answer you had in your head.

The same thing bites with money:

```js
const cart = [19.99, 5.01, 0.1, 0.2, 0.3];
cart.reduce(add, 0); // 25.6
Math.sumPrecise(cart); // 25.599999999999998
```

Yes, here the "precise" version looks worse. `reduce()` got lucky: its rounding errors happened to cancel out and land on the float that prints as `25.6`. `Math.sumPrecise` returned the exact sum of the five floats you gave it, which is a hair under 25.6 because `19.99` is stored as a hair under 19.99. Neither is a correct way to add money.

For currency, keep doing what you should already be doing: store integer cents (or use a decimal library) and format at the edge. `Math.sumPrecise` is for measured or computed floats where the inputs are already approximations: analytics totals, sensor readings, scores, chart aggregates, statistics like a mean or variance where you sum many values of mixed size.

## The details that change behavior

A few edges are different from a hand-rolled loop, and they are mostly improvements:

```js
Math.sumPrecise([]); // -0, not 0
Math.sumPrecise(new Set([1, 2])); // 3, any iterable works
Math.sumPrecise([1, Infinity]); // Infinity
Math.sumPrecise([1, "2"]); // TypeError
const oops = [1, "2"].reduce(add, 0); // '12'
```

The `TypeError` is the one to notice. `reduce()` will happily concatenate a stray string from a form field or a CSV parse and hand you `'12'`. `Math.sumPrecise` refuses anything that is not a number, including BigInts, so bad data fails loudly where it entered instead of three components later. The empty-array `-0` almost never matters in practice, but if you `Object.is()` against `0` in a test, it will.

It also accepts any iterable, so it composes cleanly with iterator helpers without building an intermediate array:

```js
const revenue = Math.sumPrecise(
  orders
    .values()
    .filter((o) => o.status === "paid")
    .map((o) => o.amount),
);
```

## Shipping it today

Browser support is good, but check your runtimes. If you also run the same code in Node or an older WebView, feature-detect and fall back to a polyfill:

```js
import sumPrecise from "math.sumprecise"; // es-shims; core-js also ships one

const sum =
  typeof Math.sumPrecise === "function"
    ? (xs) => Math.sumPrecise(xs)
    : sumPrecise;
```

One honest tradeoff: precise summation does more work than `+`. In a quick test with the es-shims polyfill on a million random numbers, it ran about four times slower than `reduce()`. Native implementations should do better, but if you are summing inside a hot animation loop, measure before swapping. For the usual case of totaling a few hundred values for display, you will not notice.

The practical takeaway: reach for `Math.sumPrecise` anywhere a sum is shown to a person or compared in a test, and leave `reduce()` for the places you genuinely need raw speed. The [MDN page](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/sumPrecise) has the spec link and the full compatibility table.
