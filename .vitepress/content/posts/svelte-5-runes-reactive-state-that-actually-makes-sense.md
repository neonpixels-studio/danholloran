---
created_at: "2026-05-09T15:22:55.000+00:00"
tags: ["javascript", "svelte", "tooling", "frontend"]
draft: true
title: "Svelte 5 Runes: Reactive State That Actually Makes Sense"
image: "/images/posts/svelte-5-runes-reactive-state-that-actually-makes-sense.jpg"
---

If you've ever wrestled with Svelte 4's reactive declarations — that vaguely magical `$:` syntax that sometimes works exactly as you expect and sometimes very much doesn't — you'll appreciate what Svelte 5 brings to the table. Runes are a new set of explicit reactive primitives that replace the old implicit system, and they're a genuine improvement: clearer, more predictable, and no longer confined to `.svelte` files.

## What Are Runes?

Runes are compiler-recognized functions prefixed with `$`. Think of them as signals — they tell Svelte's compiler (and now its runtime) where reactivity lives and how it flows. Svelte 5 ships four core runes: `$state`, `$derived`, `$effect`, and `$props`. Each one is a focused primitive with clear semantics.

In Svelte 4, you'd write something like this to declare reactive state:

```svelte
<script>
  let count = 0;
  $: doubled = count * 2;
</script>
```

That `$:` label is a reactive declaration — Svelte's compiler turns it into something reactive under the hood. It works, but it's implicit. The reactivity is tied to the compiler, which means it _only_ works inside `.svelte` files, and its behavior in complex expressions can catch you off guard.

In Svelte 5, the same thing looks like this:

```svelte
<script>
  let count = $state(0);
  let doubled = $derived(count * 2);
</script>
```

Explicit, readable, and — crucially — portable.

## $state, $derived, and $effect in Practice

`$state` replaces bare `let` declarations for reactive variables. It signals to Svelte that this value should be tracked. When it changes, anything that depends on it updates.

`$derived` replaces `$: someValue = ...`. It computes a value from reactive dependencies and is memoized — it only recalculates when its inputs change.

`$effect` replaces `$: { ... }` blocks that had side effects. It runs after the DOM has updated, and it re-runs whenever its reactive dependencies change. It also accepts a return value for cleanup — no more worrying about stale subscriptions:

```svelte
<script>
  let query = $state('');
  let results = $state([]);

  $effect(() => {
    if (!query) {
      results = [];
      return;
    }

    const controller = new AbortController();
    fetch(`/api/search?q=${query}`, { signal: controller.signal })
      .then(r => r.json())
      .then(data => { results = data; });

    // cleanup runs before the next effect
    return () => controller.abort();
  });
</script>
```

For derived values that need more than a single expression, `$derived.by` accepts a function:

```svelte
<script>
  let items = $state([1, 2, 3, 4, 5]);
  let stats = $derived.by(() => {
    const sum = items.reduce((a, b) => a + b, 0);
    return { sum, avg: sum / items.length };
  });
</script>

<p>Average: {stats.avg}</p>
```

## Sharing State Across Components

This is where things get genuinely exciting. In Svelte 4, sharing reactive state meant reaching for Svelte stores — writable, readable, derived — and using the `$` shorthand to auto-subscribe. Stores still work in Svelte 5, but runes give you a simpler option: reactive state in `.svelte.ts` files.

Any file ending in `.svelte.ts` (or `.svelte.js`) gets the runes compiler. That means `$state` and `$derived` work outside of components:

```ts
// cart.svelte.ts
function createCart() {
  let items = $state<{ name: string; price: number }[]>([]);

  let total = $derived(items.reduce((sum, item) => sum + item.price, 0));

  function add(item: { name: string; price: number }) {
    items = [...items, item];
  }

  function remove(index: number) {
    items = items.filter((_, i) => i !== index);
  }

  return {
    get items() {
      return items;
    },
    get total() {
      return total;
    },
    add,
    remove,
  };
}

export const cart = createCart();
```

Then in any component:

```svelte
<script>
  import { cart } from '$lib/cart.svelte.ts';
</script>

<p>Total: ${cart.total.toFixed(2)}</p>
<button onclick={() => cart.add({ name: 'Widget', price: 9.99 })}>
  Add to cart
</button>
```

One key thing to note: export an object or function — not a raw `$state` variable directly. Exporting a primitive breaks the reactivity because the value gets "frozen" at import time. The getter pattern above (`get items()`) keeps the reference live.

Also worth knowing: if you're using SSR, shared module-level `$state` is shared across _all_ server requests. Scope it inside a function (like the factory pattern above) or use `getContext` for per-request isolation.

## Worth Trying

Svelte 5's runes aren't just a syntax facelift — they're a more honest model of how reactivity works. The old magic is replaced with explicit primitives that behave consistently whether you're in a component or a shared module. If you're starting a new Svelte project, go runes-first. If you're on an existing codebase, the migration is gradual — Svelte 5 runs Svelte 4 components without changes.

The [official migration guide](https://svelte.dev/docs/svelte/v5-migration-guide) is thorough and a solid starting point. The [LogRocket deep dive](https://blog.logrocket.com/exploring-runes-svelte-5/) is also worth bookmarking for when you hit an edge case.
