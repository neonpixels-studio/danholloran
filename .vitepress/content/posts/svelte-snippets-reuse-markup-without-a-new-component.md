---
date: "2026-09-07T02:07:25.000-07:00"
tags: ["svelte", "javascript", "typescript"]
draft: false
title: "Svelte Snippets: Reuse Markup Without a New Component"
image: "/images/posts/svelte-snippets-reuse-markup-without-a-new-component.jpg"
topic: "development"
description: "Snippets let you define reusable chunks of markup inline and render them like functions. They replace slots, kill the let: directive, and mean you stop extracting a component every time you repeat six lines."
---

You have a card layout that appears twice in the same component: once wrapped in a link, once bare. The markup is identical apart from the wrapper. For years the Svelte answer was to extract `Card.svelte`, import it, thread props through it, and accept a new file in your tree for six lines of HTML.

That works, but it is a heavy tool for a light problem. A component brings its own module scope, its own props contract, and its own place in the file system. Sometimes you just want the markup twice. Svelte 5's snippets are the smaller tool, and once you see them as functions that return markup, most of the awkwardness in Svelte's old component-composition story goes away.

## A snippet is a function, and `{@render}` calls it

The syntax is `{#snippet name(params)}...{/snippet}` to define, `{@render name(args)}` to call:

```svelte
{#snippet figure(image)}
  <figure>
    <img src={image.src} alt={image.caption} width={image.width} height={image.height} />
    <figcaption>{image.caption}</figcaption>
  </figure>
{/snippet}

{#each images as image}
  {#if image.href}
    <a href={image.href}>{@render figure(image)}</a>
  {:else}
    {@render figure(image)}
  {/if}
{/each}
```

Parameters behave like a normal function signature: any number of them, destructuring, default values. The one exception is rest parameters, which are not supported.

Scope is lexical, and this is the part worth internalizing. A snippet can read anything in scope where it was declared — `<script>` variables, the current `{#each}` item — and it is visible to its siblings and their children, but not to anything above it. Declare a snippet inside a `<div>` and you cannot render it outside that `<div>`. Snippets can also reference themselves, which makes recursive markup pleasant instead of a `<svelte:self>` puzzle:

```svelte
{#snippet countdown(n)}
  {#if n > 0}
    <span>{n}...</span>
    {@render countdown(n - 1)}
  {:else}
    <span>🚀</span>
  {/if}
{/snippet}
```

## They replace slots, and they take the `let:` directive with them

Snippets are values, so passing markup into a component is just passing a prop. There are three shapes for this. You can pass a snippet explicitly like any other prop, declare snippets directly inside the component's tags (Svelte turns those into props automatically), or write plain content inside the tags, which becomes the implicit `children` snippet:

```svelte
<Table data={fruits}>
  {#snippet header()}
    <th>fruit</th><th>qty</th><th>price</th>
  {/snippet}

  {#snippet row(d)}
    <td>{d.name}</td><td>{d.qty}</td><td>{d.price}</td>
  {/snippet}
</Table>
```

Inside `Table.svelte`, those arrive as ordinary props: `let { data, header, row } = $props()`, then `{@render row(d)}` in the loop. Optional ones use `{@render children?.()}`, or an `{#if}` block when you want fallback content.

Compare that to the Svelte 4 version, where `<slot name="row" let:item />` introduced a variable through a directive whose colon meant the opposite of every other colon in the template, and where the variable from one slot was invisible inside a sibling slot. Snippets are functions, so their parameters are just parameters. Slots still work in Svelte 5 but are deprecated.

If you are migrating, budget for two rough edges. `<slot name="header" />` becomes `{@render header?.()}`, but the corresponding `<div slot="header">` on the consumer side is silently ignored rather than erroring — the content simply vanishes. And `<Component let:prop>` now throws, as does forwarding a slot with directives attached (`<slot name="a" slot="a" let:abc>`), which was legal in Svelte 4.

## Typing and the edges

Snippets have a real type. Import `Snippet` from `svelte` and give it a tuple of its parameters:

```ts
import type { Snippet } from "svelte";

interface Props {
  data: unknown[];
  children: Snippet;
  row: Snippet<[unknown]>;
}
```

Add `generics="T"` to the `<script lang="ts">` tag and you can tie `data: T[]` to `row: Snippet<[T]>`, so the consumer gets a type error for a mismatched row. That is strictly better than what slots ever offered.

Two extras worth knowing. Top-level snippets can be exported from a `<script module>` block and imported into other components, as long as they do not touch instance-level state (Svelte 5.5.0 and up). And `createRawSnippet` builds one programmatically, which you will almost never need but which exists when a library has to.

The rule of thumb: reach for a snippet when you are repeating markup, and for a component when the chunk has its own state, its own styles, or its own reason to be tested. The [snippet docs](https://svelte.dev/docs/svelte/snippet) cover the remaining corners.
