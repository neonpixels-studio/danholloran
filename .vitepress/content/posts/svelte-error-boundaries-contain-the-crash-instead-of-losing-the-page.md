---
date: "2026-10-15T02:15:22.000-07:00"
tags: ["svelte", "javascript", "tooling"]
draft: false
title: "Svelte Error Boundaries: Contain the Crash Instead of Losing the Page"
image: "/images/posts/svelte-error-boundaries-contain-the-crash-instead-of-losing-the-page.jpg"
topic: "development"
description: "One flaky widget shouldn't blank your whole app. Here's how Svelte's boundary element walls off failures, shows loading UI for await, and now works during server rendering too."
---

Every app has that one component. The chart that chokes on a `null` in the data, the third-party embed that throws when its script loads late, the dashboard card that assumes an API field will always exist. In a lot of Svelte apps, one of those throwing during render takes the whole page down with it, and your users get a blank screen instead of a page that's 95% fine.

Svelte 5 has had a fix for this since 5.3: `<svelte:boundary>`. It has quietly grown into one of the more useful special elements in the framework, and as of 5.51 it can even handle errors during server-side rendering. If you haven't reached for it yet, here's what it does and where it fits.

## Walling Off a Component

A boundary wraps part of your tree. If anything inside throws while rendering or while running an effect, the boundary catches it, removes the broken content, and renders a `failed` snippet in its place. The snippet receives the error and a `reset` function that rebuilds the contents from scratch.

```svelte
<script>
  import RevenueChart from './RevenueChart.svelte';
</script>

<svelte:boundary>
  <RevenueChart />

  {#snippet failed(error, reset)}
    <div class="card card--error">
      <p>The revenue chart couldn't load.</p>
      <button onclick={reset}>Try again</button>
    </div>
  {/snippet}
</svelte:boundary>
```

The rest of the page keeps rendering normally. Only the chart's slot shows the fallback, and `reset` gives the user a way to retry without a full reload.

If you'd rather report the error than (or as well as) render something, pass an `onerror` handler. It gets the same `error` and `reset` arguments:

```svelte
<script>
  import * as Sentry from '@sentry/svelte';
  import ActivityFeed from './ActivityFeed.svelte';
</script>

<svelte:boundary onerror={(error) => Sentry.captureException(error)}>
  <ActivityFeed />

  {#snippet failed()}
    <p>Activity is unavailable right now.</p>
  {/snippet}
</svelte:boundary>
```

If `onerror` itself throws, or you rethrow, the error bubbles to the nearest parent boundary. That lets you build layers: a tight boundary around each risky widget, and a coarse one near the root as the last line of defense.

## What Boundaries Don't Catch

This is the part that trips people up. Boundaries catch errors that happen **during rendering and inside effects**. They do not catch errors in event handlers, inside a `setTimeout`, or in other async work that runs outside the render cycle.

```svelte
<svelte:boundary>
  <!-- This throw is NOT caught by the boundary -->
  <button onclick={() => { throw new Error('nope'); }}>Click</button>

  {#snippet failed()}<p>Never shown for the click error</p>{/snippet}
</svelte:boundary>
```

That's the same split React draws, and for the same reason: an event handler failing doesn't leave the UI in a half-rendered state, so there's nothing for a boundary to replace. Handle those errors where they happen, with `try/catch` and some local state.

## Pending UI for `await`

Boundaries also handle the other side of async rendering. With Svelte's `await` expressions, you can put an `await` directly in your markup, and a boundary's `pending` snippet shows while those expressions first resolve:

```svelte
<script>
  let { userId } = $props();
</script>

<svelte:boundary>
  <h2>{(await getUser(userId)).name}</h2>
  <p>{(await getStats(userId)).posts} posts</p>

  {#snippet pending()}
    <div class="skeleton" aria-busy="true"></div>
  {/snippet}

  {#snippet failed(error, reset)}
    <button onclick={reset}>Couldn't load profile. Retry?</button>
  {/snippet}
</svelte:boundary>
```

Two caveats. First, `pending` only shows on the **initial** load. Later updates keep the old content on screen, and you use `$effect.pending()` if you want a spinner for those. Second, during server-side rendering, a boundary with a `pending` snippet renders only that snippet and skips its content, so put boundaries around the slow, non-critical parts of the page and not around the content you need indexed.

## Boundaries on the Server

Until recently, boundaries did nothing during SSR. An error in any component failed the whole `render()` call. Svelte 5.51 changed that with a `transformError` option on `render` from `svelte/server`:

```js
import { render } from "svelte/server";
import App from "./App.svelte";

const { head, body } = await render(App, {
  transformError: (error) => {
    // Log the real error, with its stack, on the server...
    console.error(error);
    // ...and send only a safe, serializable shape to the browser
    return { message: "Something went wrong loading this section." };
  },
});
```

When a component inside a boundary with a `failed` snippet throws during SSR, `transformError` decides what the snippet receives. The return value has to be JSON-serializable because it gets serialized into the page and used to hydrate the `failed` snippet in the browser. If the boundary also has `onerror`, it fires on hydration with that deserialized object. If `transformError` throws, the whole render fails as before.

The redaction step matters. Server errors can carry database messages, file paths, and stack traces, and the Svelte docs explicitly recommend sanitizing them rather than shipping them to the client.

If you're on SvelteKit, you don't call `render` yourself, so the framework has to wire `transformError` up for you. The Svelte docs say that support is coming via SvelteKit's `handleError` hook. Check the SvelteKit changelog for your version before you count on server-side boundaries working there. Until then, `handleError` and `+error.svelte` remain the SvelteKit way to deal with errors in `load` and on the server.

## Where to Put Them

A good rule: wrap anything whose failure shouldn't cost the user the rest of the page. Third-party embeds, data visualizations, user-generated content renderers, and any widget fed by a flaky API are all prime candidates. Keep boundaries out of trivial components, because a fallback for every button is noise. Start with one root-level boundary plus a few around your riskiest widgets, wire `onerror` into whatever error tracking you already use, and read the [`<svelte:boundary>` docs](https://svelte.dev/docs/svelte/svelte-boundary) for the full API.
