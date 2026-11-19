---
date: "2026-11-19T02:15:44.000-08:00"
tags: ["javascript", "web-apis", "es2027"]
draft: false
title: "Iterator.zip: Stop Indexing Into Parallel Arrays"
image: "/images/posts/iterator-zip-stop-indexing-into-parallel-arrays.jpg"
topic: "development"
description: "Iterator.zip and zipKeyed walk several iterables in lockstep, with a strict mode that throws when your data is out of sync instead of dropping rows."
---

Every codebase has this loop somewhere. Two arrays that are supposed to line up, one index, and a quiet assumption that they are the same length:

```js
for (let i = 0; i < labels.length; i++) {
  rows.push({ label: labels[i], value: values[i] });
}
```

It works until `values` comes back one item short from an API, and then you are rendering `undefined` in a chart with no error anywhere. The other popular fix, a hand-rolled `zip` helper or a lodash import, has the same problem: nobody remembers what it does when the inputs disagree.

`Iterator.zip()` and `Iterator.zipKeyed()` are the standard answer. They reached Stage 4 at the May 2026 TC39 meeting, are slated for ES2027, and already ship in Firefox (since 148) and Chromium. The interesting part is not that JavaScript finally has `zip`. It is that the API forces you to decide what "out of sync" means.

## The basics: arrays in, tuples out

`Iterator.zip()` takes an iterable of iterables and yields an array per step, one element from each input:

```js
const days = ["Mon", "Tue", "Wed", "Thu", "Fri"];
const temps = [22, 21, 23, 20, 19];

for (const [day, temp] of Iterator.zip([days, temps])) {
  console.log(`${day}: ${temp}°C`);
}

// Or straight into a Map, since each step is a [key, value] pair
const byDay = new Map(Iterator.zip([days, temps]));
```

Because it works on iterators, not just arrays, the inputs can be lazy or even infinite. A counting generator gives you an index without `entries()` gymnastics, and `zip` closes the infinite one for you when the finite input runs out:

```js
function* count(n = 0) {
  while (true) yield n++;
}

const users = new Map([
  ["ada", "admin"],
  ["grace", "editor"],
]);

for (const [i, [name, role]] of Iterator.zip([count(1), users])) {
  console.log(`${i}. ${name} (${role})`);
}
// 1. ada (admin)
// 2. grace (editor)
```

The result is a real `Iterator`, so the iterator helpers chain right off it: `.filter()`, `.map()`, `.take()`, `.toArray()`. No intermediate arrays unless you ask for one.

One deliberate gotcha: strings are rejected as inputs. TC39 now considers implicit string iteration a mistake, so if you really want to zip characters, wrap the string in `Iterator.from(str)` (or use `Intl.Segmenter` if you care about emoji and other grapheme clusters).

## The mode option is the whole point

When inputs have different lengths, `zip` gives you three behaviors through `options.mode`:

- `"shortest"` (default): stop as soon as any input is exhausted, and close the others.
- `"longest"`: keep going until every input is done, filling gaps from `padding`.
- `"strict"`: throw a `TypeError` if the inputs do not finish together.

`"shortest"` matches what most userland `zip` helpers did, and it is the right call when one input is intentionally unbounded, like the counter above. But for the parallel-arrays bug from the intro, it just swaps one silent failure (`undefined` values) for another (missing rows).

`"strict"` is the one to reach for when the inputs are _supposed_ to match:

```js
const ids = await fetchIds();
const scores = await fetchScores();

try {
  const rows = Iterator.zip([ids, scores], { mode: "strict" })
    .map(([id, score]) => ({ id, score }))
    .toArray();
  render(rows);
} catch (err) {
  // Lengths disagreed: surface it instead of rendering a half-empty table
  reportDataMismatch(err);
}
```

Now a backend regression shows up as an error in your monitoring instead of a quietly wrong dashboard.

`"longest"` is for when gaps are expected and you know what should fill them. `padding` is an iterable with one fallback per input:

```js
const letters = ["a", "b", "c", "d"];
const numbers = [1, 2];

const pairs = Iterator.zip([letters, numbers], {
  mode: "longest",
  padding: ["?", 0],
}).toArray();
// [['a', 1], ['b', 2], ['c', 0], ['d', 0]]
```

Padding is only read when the mode is `"longest"`, and any input without a padding value gets `undefined`.

## zipKeyed: names instead of positions

Positional tuples have their own failure mode: swap the order of two inputs and every destructure downstream is wrong, with no error. `Iterator.zipKeyed()` takes an object of iterables and yields objects with the same keys, which makes the pairing explicit:

```js
const table = {
  name: ["Caroline", "Danielle", "Evelyn"],
  age: [30, 25, 35],
  city: ["New York", "London", "Hong Kong"],
};

for (const { name, age, city } of Iterator.zipKeyed(table, {
  mode: "strict",
})) {
  console.log(`${name}, ${age}, ${city}`);
}
```

This is a neat way to turn column-oriented data (what a lot of analytics and charting APIs return) into rows without writing a transpose function. MDN's own guidance is to prefer `zipKeyed()` when you can, and I agree: keys survive refactors that reorder arguments, and `padding` becomes an object keyed the same way.

## Can you use it today?

Not everywhere yet. Firefox shipped both methods in 148 and Chromium has them, but MDN still marks them as limited availability, so check current Safari support on caniuse before relying on them in a browser bundle. In the meantime, `core-js` and the `es-iterator-helpers` shim both polyfill `Iterator.zip` and `Iterator.zipKeyed`, and the API is small enough that the polyfill is a safe bet.

The practical takeaway: next time you write `arr2[i]` inside a loop over `arr1`, reach for `zip`, and pick the mode on purpose. Default to `"strict"` for data that should line up, `"shortest"` when one side is intentionally endless, and `"longest"` only when you have a real answer for what fills the gap. The [MDN reference for Iterator.zip](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Iterator/zip) and the [joint iteration proposal](https://github.com/tc39/proposal-joint-iteration) cover the remaining edge cases.
