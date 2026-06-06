---
date: '2026-06-06T07:08:27.000+00:00'
tags: ['vue', 'javascript']
draft: true
title: "A Deep Dive into Vue 3's Suspense Component"
image: '/images/posts/a-deep-dive-into-vue-3s-suspense-component.jpg'
topic: 'development'
description: "How Vue's Suspense component coordinates async setup, fallback content, and error handling — and the patterns that keep it from becoming a loading-spinner mess."
---

Every Vue app that fetches data ends up with the same boilerplate: an `isLoading` ref, a `v-if` for the spinner, a `v-else` for the content, and maybe an `error` ref if you're being responsible. Multiply that by every component that talks to an API and you've got loading-state logic smeared across your entire component tree, each piece slightly different from the last.

Vue 3's `<Suspense>` component exists to pull that orchestration up and out. Instead of every async component managing its own spinner, a single boundary higher in the tree waits for all async dependencies below it to resolve, showing one coherent fallback in the meantime. One caveat up front: Suspense has carried an experimental label for years and the API could still shift, but it's stable enough in practice that Nuxt builds on it and the patterns below are widely used in production.

## What Suspense actually waits for

`<Suspense>` has exactly two slots, `#default` and `#fallback`, each accepting a single root node. It renders the default slot, and if anything in that subtree is still pending, it shows the fallback instead:

```html
<Suspense>
  <template #default>
    <UserDashboard />
  </template>
  <template #fallback>
    <DashboardSkeleton />
  </template>
</Suspense>
```

Two kinds of async dependencies trigger the waiting behavior. The first is a component with an async `setup()` — in `<script setup>` terms, any component with a top-level `await`:

```js
// UserDashboard.vue
const { data: user } = await useFetch(`/api/users/${route.params.id}`)
const { data: activity } = await useFetch(`/api/users/${route.params.id}/activity`)
```

The second is async components created with `defineAsyncComponent`, which by default let a parent Suspense boundary control their loading state instead of showing their own.

The key insight: the component using `await` doesn't know or care about loading UI. It just describes what it needs. The boundary above decides what "waiting" looks like — and one skeleton screen that mirrors your real layout beats five independent spinners popping in and out.

## Errors, events, and the timeout prop

Suspense doesn't render an error state itself, so a bare boundary will swallow a rejected promise into the console. Pair it with `onErrorCaptured` in the parent to build a proper error boundary:

```js
const error = ref(null)
onErrorCaptured((err) => {
  error.value = err
  return false // stop the error from propagating further
})
```

Render the error UI when `error` is set, otherwise render the Suspense block. For finer-grained control, Suspense emits three events — `pending` when it starts waiting, `resolve` when the default slot finishes, and `fallback` when the fallback becomes visible — which are handy for progress bars or analytics timing.

The `timeout` prop covers the revisit case. On first render, the fallback shows immediately. But when a resolved Suspense re-suspends (say, a route param changes and the dashboard refetches), Vue keeps the old content on screen by default. `timeout="200"` says: keep showing stale content for 200ms, then cut to the fallback if we're still waiting. It's the difference between a snappy-feeling update and a page that appears frozen.

## Patterns that scale

A few things separate clean Suspense usage from a mess. Resist nesting boundaries more than a level or two — each nested boundary is another sequential waiting point, and deep nesting turns parallel fetches into waterfalls. If two widgets can load independently, give them sibling boundaries rather than nested ones.

For components that should manage their own loading state sometimes, async components accept a `suspensible: false` option to opt out of the parent boundary entirely. And since an async `setup()` re-runs on every fresh mount, memoize at the data layer — a cached fetch composable or a store — so navigating back to a page doesn't re-trigger the full suspension.

Suspense won't eliminate loading states; it relocates them to where they belong. Declare data needs in components, declare waiting UI at boundaries, and let Vue coordinate the two. The [official Suspense guide](https://vuejs.org/guide/built-ins/suspense.html) covers the remaining edges, including how it composes with `<Transition>` and `<KeepAlive>`.
