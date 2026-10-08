---
date: "2026-10-08T02:14:43.000-07:00"
tags: ["javascript", "node", "performance"]
draft: false
title: "Map.getOrInsert: Stop Writing the has/get/set Dance"
image: "/images/posts/map-getorinsert-stop-writing-the-has-get-set-dance.jpg"
topic: "development"
description: "Map and WeakMap now have getOrInsert and getOrInsertComputed, two methods that replace the check-then-set boilerplate every JavaScript codebase is full of."
---

Every JavaScript codebase has this pattern somewhere. Usually in a dozen places. You want to group things by a key, so you reach for a `Map`, and then you write the same three lines you always write: check if the key exists, create an empty bucket if it doesn't, then fetch the bucket and push into it.

```js
const byAuthor = new Map();

for (const post of posts) {
  if (!byAuthor.has(post.author)) {
    byAuthor.set(post.author, []);
  }
  byAuthor.get(post.author).push(post);
}
```

It works. It's also three hash lookups for one logical operation, and in TypeScript the `get()` call still returns `T | undefined`, so you end up sprinkling a non-null assertion on a value you just guaranteed exists. The upsert proposal fixes this with two small methods, and as of 2026 they ship in every major browser engine.

## getOrInsert and getOrInsertComputed

The proposal reached Stage 4 at TC39 in January 2026 and adds two methods to both `Map` and `WeakMap`:

- `map.getOrInsert(key, defaultValue)` returns the existing value for `key`. If there isn't one, it stores `defaultValue` and returns that.
- `map.getOrInsertComputed(key, callback)` does the same thing, but only calls `callback(key)` to build the default when the key is actually missing.

The grouping loop above collapses to one line per item:

```js
const byAuthor = new Map();

for (const post of posts) {
  byAuthor.getOrInsert(post.author, []).push(post);
}
```

Counting works the same way. Because the method returns the stored value, you can read and write in one expression:

```js
const wordCounts = new Map();

for (const word of text.toLowerCase().match(/\w+/g) ?? []) {
  wordCounts.set(word, wordCounts.getOrInsert(word, 0) + 1);
}
```

For simple grouping you could also reach for `Map.groupBy()`, which landed in 2024. The difference is that `groupBy` builds a new map in one shot from an iterable, while `getOrInsert` works on a map you're mutating over time: an event stream, a cache, or a registry that's filled lazily as requests come in.

## When to use the Computed variant

The catch with `getOrInsert` is that its default is an ordinary argument, so it's evaluated every time, even when the key already exists. Passing `[]` or `0` costs essentially nothing. Passing `new Set()` allocates on every call. Passing `await fetchConfig(id)` or `expensiveParse(source)` is a real bug.

MDN's own example shows it plainly: calling `map.getOrInsert("bar", defaultCreator("bar"))` runs `defaultCreator` even though `"bar"` is already in the map, while `getOrInsertComputed("bar", defaultCreator)` doesn't run it at all.

So the rule of thumb is simple: use `getOrInsert` for cheap literals, and `getOrInsertComputed` whenever building the default allocates or does work. A memoization helper is the classic case:

```js
const cache = new Map();

function getHighlighter(language) {
  return cache.getOrInsertComputed(language, (lang) =>
    createHighlighter({ lang, theme: "github-dark" }),
  );
}
```

The callback receives the key, so you can pass a named function instead of an inline closure. It must be callable: anything else throws a `TypeError`.

## WeakMap is where it really shines

The same two methods exist on `WeakMap`, which makes per-object side data much cleaner. Say you need to attach state to DOM elements without putting properties on the nodes themselves:

```js
const elementState = new WeakMap();

function stateFor(el) {
  return elementState.getOrInsertComputed(el, () => ({
    clicks: 0,
    lastSeen: performance.now(),
  }));
}

document.addEventListener("click", (event) => {
  const state = stateFor(event.target);
  state.clicks += 1;
});
```

When the element is removed and garbage collected, its entry goes with it. No cleanup code, no leaks, and no "is this initialized yet" branch anywhere in your handlers.

## Can you ship it today?

Support is recent but broad. According to caniuse, `getOrInsertComputed` is available in Chrome and Edge 145+, Firefox 144+, and Safari 26.2+ on both macOS and iOS, and MDN marks it Baseline 2026 (newly available). That still leaves a tail of users on older Safari and Samsung Internet, so for public sites you'll want a fallback for now. Both `core-js` and es-shims provide polyfills, and the hand-rolled version is tiny if you'd rather avoid a dependency:

```js
if (!Map.prototype.getOrInsertComputed) {
  Map.prototype.getOrInsertComputed = function (key, callback) {
    if (typeof callback !== "function")
      throw new TypeError("callback must be callable");
    if (this.has(key)) return this.get(key);
    const value = callback(key);
    this.set(key, value);
    return value;
  };
}
```

For server code, check your runtime before relying on it: `node -p "typeof Map.prototype.getOrInsert"` prints `function` when it's there. If your TypeScript `lib` setting doesn't know about the methods yet, a small declaration file bridges the gap:

```ts
interface Map<K, V> {
  getOrInsert(key: K, defaultValue: V): V;
  getOrInsertComputed(key: K, callback: (key: K) => V): V;
}
```

Note that both return `V`, not `V | undefined`, which is the other quiet win here: the non-null assertions go away along with the boilerplate.

The upsert methods aren't flashy, but they're the kind of feature you end up using every day once you know it exists. Next time you type `if (!map.has(key))`, stop and reach for `getOrInsert` instead. The [MDN reference for getOrInsertComputed](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map/getOrInsertComputed) is a good place to start.
