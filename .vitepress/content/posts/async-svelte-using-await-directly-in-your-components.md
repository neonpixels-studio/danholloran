---
date: "2026-08-30T02:07:38.000-05:00"
tags: ["svelte", "javascript", "performance"]
draft: false
title: "Async Svelte: Using await Directly in Your Components"
image: "/images/posts/async-svelte-using-await-directly-in-your-components.jpg"
topic: "development"
description: "Svelte 5.36 lets you use await at the top level of a component, inside $derived, and in your markup. Here is how synchronized updates, boundaries, and $effect.pending() fit together."
---

Every Svelte codebase eventually grows a little pile of scaffolding around asynchronous data. A `let data = $state(null)`, an `$effect` that fetches and assigns, a `loading` flag, an `error` flag, and a `{#if loading}` in the template. Or the `{#await}` block, which is fine for one promise but nests badly the moment you need two. Either way, you end up writing plumbing rather than describing your UI.

Since Svelte 5.36, you can skip most of that. The `await` keyword works in three places it previously did not: at the top level of a component's `<script>`, inside `$derived(...)`, and directly in your markup. It is still behind an experimental flag, but the design is worth understanding now because it changes how you think about loading states.

## Turning it on, and what changes

Async Svelte is opt-in. Add `experimental.async` wherever you configure the compiler, which usually means `svelte.config.js`:

```js
export default {
  compilerOptions: {
    experimental: {
      async: true,
    },
  },
};
```

The docs say this flag disappears in Svelte 6, so today's opt-in is tomorrow's default. Once it is on, this is legal:

```svelte
<script>
  let a = $state(1);
  let b = $state(2);

  async function add(a, b) {
    await new Promise((f) => setTimeout(f, 500));
    return a + b;
  }
</script>

<input type="number" bind:value={a} />
<input type="number" bind:value={b} />

<p>{a} + {b} = {await add(a, b)}</p>
```

The interesting part is what does _not_ happen. Bump `a` to 2 and the paragraph does not flash `2 + 2 = 3` while the promise is in flight. Svelte holds the whole update until `add(a, b)` resolves, then swaps everything at once. That is the headline feature: **synchronized updates**. You never render a torn UI where half the values are new and half are stale, which is exactly the bug that `loading` flags exist to paper over.

Updates can also overlap. A fast update lands while a slower earlier one is still running, so a quick keystroke is not stuck behind a slow one.

## Concurrency is automatic, waterfalls are not

Two independent `await` expressions in markup run in parallel, even though they read as sequential:

```svelte
<p>{await one(x)}</p>
<p>{await two(y)}</p>
```

Both kick off immediately. The same is _not_ true inside your `<script>`, where `await` behaves like ordinary JavaScript and runs top to bottom. Svelte will warn you about this with an `await_waterfall` warning when you write something like:

```js
let a = $derived(await one(x));
let b = $derived(await two(y));
```

Here `b` is not created until `a` resolves. Once both exist they update independently, but that first pass is a waterfall. If you have seen the same class of bug in a React `useEffect` chain, this is the familiar shape with a compiler warning attached.

## Loading states move into boundaries

With no `loading` variable to hang a spinner on, placeholder UI moves to `<svelte:boundary>` and its `pending` snippet:

```svelte
<svelte:boundary>
  <p>{await delayed('hello!')}</p>

  {#snippet pending()}
    <p>loading...</p>
  {/snippet}
</svelte:boundary>
```

The `pending` snippet shows when the boundary is first created and stays until every `await` inside it resolves. It deliberately does not reappear for later updates, since those are globally coordinated and rendering a full-page skeleton on every keystroke would be worse than useless.

For subsequent async work, `$effect.pending()` tells you how many promises are outstanding in the current boundary, not counting child boundaries. That is what you reach for when you want a small "validating..." spinner next to a form field rather than blanking the section. There is also `settled()`, a promise that resolves once state changes and their async consequences have been flushed to the DOM.

Errors get the same treatment. Anything thrown inside an `await` expression bubbles to the nearest boundary, where a `failed` snippet receives the `error` and a `reset` function. Worth remembering: boundaries catch errors during rendering and effects, not errors from event handlers or a stray `setTimeout`.

## The parts still in motion

This is experimental, and the docs are direct about it: the details of `await` handling and `$effect.pending()` can change outside a semver major. Effect ordering already shifts when the flag is on, with block effects like `{#if}` and `{#each}` running before `$effect.pre` in the same component.

Server rendering works through an awaited `render(...)`, though frameworks handle that for you. Today a boundary with a `pending` snippet renders that snippet during SSR and skips its contents, with streaming planned but not shipped. Svelte 5.42 also added `fork(...)`, which speculatively runs async work you expect to need soon, and SvelteKit is the intended consumer for preloading on hover or focus.

If you maintain a Svelte app, the useful move right now is not a rewrite. Turn the flag on in a branch, pick one component with the most `loading` and `error` bookkeeping, and see how much of it disappears. The [await expressions docs](https://svelte.dev/docs/svelte/await-expressions) and the [`<svelte:boundary>` reference](https://svelte.dev/docs/svelte/svelte-boundary) are short enough to read in one sitting.
