---
date: '2026-06-04T07:09:24.000+00:00'
tags: ['javascript', 'typescript', 'tooling', 'svelte']
draft: true
title: "SvelteKit Remote Functions: Goodbye, API Boilerplate"
image: '/images/posts/sveltekit-remote-functions-goodbye-api-boilerplate.jpg'
topic: 'development'
description: "SvelteKit's remote functions let you call type-safe server code straight from your components — no +server.ts endpoints, no fetch wrappers, no manually synced types."
---

If you've built anything non-trivial in SvelteKit, you know the dance: create a `+server.ts` endpoint, write a `fetch` call on the client, hand-roll the types on both sides, and hope they never drift apart. It works, but it's ceremony — and every new piece of data means doing the dance again.

SvelteKit's remote functions (available since 2.27, still behind an experimental flag) collapse all of that into a single import. You write a function once, it always *runs* on the server, but you can *call* it from anywhere — including right inside your component markup.

## Queries: server data, right in your template

Remote functions live in `.remote.js` or `.remote.ts` files and come in four flavors: `query`, `form`, `command`, and `prerender`. The simplest is `query`, for reading dynamic data:

```ts
// src/routes/blog/data.remote.ts
import { query } from '$app/server';
import * as v from 'valibot';
import * as db from '$lib/server/database';

export const getPost = query(v.string(), async (slug) => {
  const [post] = await db.sql`
    SELECT * FROM post WHERE slug = ${slug}
  `;
  return post;
});
```

Because the exported function is transformed into a `fetch` wrapper on the client, the argument crosses an HTTP boundary — so SvelteKit asks you to validate it with any Standard Schema library (Zod, Valibot, etc.). In return you get full end-to-end type safety with zero manually written types.

Combined with Svelte's experimental `await` support, consuming it is almost suspiciously clean:

```svelte
<script>
  import { getPost } from '../data.remote';
  let { params } = $props();
</script>

{#await getPost(params.slug) then post}
  <h1>{post.title}</h1>
{/await}
```

You can also `await getPost(...)` directly in markup and let the nearest `<svelte:boundary>` handle loading and error states. Identical calls are deduplicated automatically — multiple components awaiting `getPost('intro')` share one request — and any query can be re-fetched with `getPosts().refresh()`. There's even `query.batch` to solve the classic n+1 problem, and the new `query.live`, which takes an async generator and streams real-time values to the client over a shared connection.

## Forms and commands: writes without the wiring

Mutations get the same treatment. The `form` function returns an object you spread onto a `<form>` element. It works without JavaScript (plain submit and reload) and progressively enhances when JS is available:

```ts
export const createPost = form(
  v.object({
    title: v.pipe(v.string(), v.nonEmpty()),
    content: v.pipe(v.string(), v.nonEmpty())
  }),
  async ({ title, content }) => {
    await db.sql`INSERT INTO post (title, content)
                 VALUES (${title}, ${content})`;
    redirect(303, '/blog');
  }
);
```

```svelte
<form {...createPost}>
  <input {...createPost.fields.title.as('text')} />
  <textarea {...createPost.fields.content.as('text')}></textarea>
  <button>Publish</button>
</form>
```

The `fields` API generates `name`, `value`, and `aria-invalid` attributes for you, repopulates inputs after a failed submission, and surfaces validation issues per field via `issues()`. For mutations that aren't tied to a form — a like button, drag-and-drop reordering — `command` does the same job and can be called from any event handler.

The clever bit is *single-flight mutations*: inside a form or command handler you can call `getPosts().refresh()` on the server, and the refreshed query data rides back to the client in the same response. No second round-trip, no stale UI, no invalidate-everything sledgehammer.

## Should you turn it on?

Remote functions are still experimental — you opt in via `kit.experimental.remoteFunctions` and `compilerOptions.experimental.async` in `svelte.config.js`, and the API may shift before it stabilizes. That said, it's been maturing steadily since SvelteKit 2.27, and recent releases keep adding polish like `query.live` for real-time data.

For a side project or an internal tool, it's absolutely worth enabling today — the reduction in boilerplate is dramatic, and the progressive-enhancement story for forms is better than what most of us write by hand. For production apps, keep an eye on the [remote functions docs](https://svelte.dev/docs/kit/remote-functions) and the ongoing discussion in the SvelteKit repo. Either way, this is clearly the direction data fetching in SvelteKit is headed, and it's worth learning now.
