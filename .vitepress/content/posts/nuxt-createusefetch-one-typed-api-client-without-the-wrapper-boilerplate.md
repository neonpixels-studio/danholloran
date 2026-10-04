---
date: "2026-10-04T02:15:26.000-07:00"
tags: ["nuxt.js", "vue", "typescript", "web-apis"]
draft: false
title: "Nuxt createUseFetch: One Typed API Client Without the Wrapper Boilerplate"
image: "/images/posts/nuxt-createusefetch-one-typed-api-client-without-the-wrapper-boilerplate.jpg"
topic: "development"
description: "Nuxt 4.4 added createUseFetch and createUseAsyncData, factories that bake your base URL, auth headers, and error handling into a fully typed useFetch you can call anywhere."
---

Every Nuxt app that talks to a real backend ends up with the same problem. You call `useFetch('/users')` in one page, then `useFetch('/orders')` in another, and before long every call site is repeating the same `baseURL`, the same `Authorization` header, and the same "redirect to login on 401" logic. So you write a wrapper. Then you discover the wrapper loses some of `useFetch`'s typing, or its generics get ugly, or you are not sure it still plays nicely with SSR deduplication.

Nuxt 4.4 shipped a first-party answer: `createUseFetch` and `createUseAsyncData`. They are factories that return a composable with the exact same signature as `useFetch` (or `useAsyncData`), just with your defaults baked in. No hand-rolled generics, no guessing about keys.

## The basic factory

The factory lives in your `composables/` directory like any other composable. Here is an API client for an external backend, adapted from the recipe in the Nuxt docs:

```ts
// app/composables/useAPI.ts
export const useAPI = createUseFetch({
  baseURL: "https://api.example.com",
  onRequest({ options }) {
    const { session } = useUserSession();
    if (session.value?.token) {
      options.headers.set("Authorization", `Bearer ${session.value.token}`);
    }
  },
  async onResponseError({ response }) {
    if (response.status === 401) {
      await navigateTo("/login");
    }
  },
});
```

Now pages just ask for data:

```vue
<script setup lang="ts">
const { data: profile } = await useAPI("/me");
const { data: orders, status } = await useAPI("/orders", { lazy: true });
</script>
```

`useAPI` returns the same `data`, `status`, `error`, and `refresh` you already know, with the same typing. Every option `useFetch` accepts (`query`, `transform`, `pick`, `server`, `getCachedData`, and so on) is still available at the call site.

One rule to remember: `createUseFetch` is a **compiler macro**. It has to be an exported declaration in `composables/` (or another directory Nuxt scans). That is how Nuxt finds it at build time and injects the de-duplication keys that make SSR hydration reuse the server payload instead of fetching twice. Define it inside a component or a random utility file and you lose that.

## Defaults vs. overrides

The factory has two modes, and picking the right one matters.

**Pass a plain object** and your options are _defaults_. The caller wins on any conflict:

```ts
export const useAPI = createUseFetch({
  baseURL: "https://api.example.com",
  lazy: true,
});

// Caller overrides baseURL for this one call
const { data } = await useAPI("/status", {
  baseURL: "https://status.example.com",
});
```

**Pass a function** and your options _override_ the caller's. The function receives what the caller passed, so you decide how to merge:

```ts
// The base URL is enforced; callers cannot point this client elsewhere
export const useBillingAPI = createUseFetch((callerOptions) => ({
  ...callerOptions,
  baseURL: useRuntimeConfig().public.billingApiUrl,
}));
```

The function form is also the one to reach for whenever your defaults need something from the Nuxt context, like `useRuntimeConfig()` or `useNuxtApp()`. The function runs at the call site, inside setup, where a Nuxt instance exists. A plain object is evaluated once at module scope, where it does not.

A practical way to think about it: object mode for convenience ("most calls want this"), function mode for policy ("every call must have this").

## Plugging in a custom `$fetch`

If you already have a configured `ofetch` instance from a plugin, perhaps with retry logic or logging, you can hand it to the factory:

```ts
// app/plugins/api.ts
export default defineNuxtPlugin(() => {
  const api = $fetch.create({
    baseURL: "https://api.example.com",
    retry: 2,
    retryStatusCodes: [502, 503, 504],
  });
  return { provide: { api } };
});
```

```ts
// app/composables/useAPI.ts
export const useAPI = createUseFetch((callerOptions) => ({
  $fetch: useNuxtApp().$api as typeof $fetch,
  ...callerOptions,
}));
```

Note the function form again: `useNuxtApp()` has to run in setup, so it cannot sit in a plain object at the top of the file.

`createUseAsyncData` follows the same pattern for cases where the "fetch" is not an HTTP call at all, such as a GraphQL client, an SDK, or a Supabase query, but you still want shared defaults like `lazy`, `deep`, or `getCachedData`.

## When not to bother

If your app hits one same-origin `/api` route and needs no headers, plain `useFetch` is fine; a factory adds a file and a name for no gain. And remember that `useFetch`-style composables are for loading data during render. For a form submit or a button click, call `$fetch` (or your plugin's `$api`) directly. Wrapping event handlers in `useAPI` will not give you SSR benefits and can cause confusing caching.

## Wrapping up

`createUseFetch` turns a pattern almost every Nuxt team reinvented into one line that keeps full typing and SSR key handling intact. If you are on Nuxt 4.4 or later, look for your existing `useFetch` wrappers, move them into `composables/` as factories, and choose object or function mode deliberately. The [createUseFetch docs](https://nuxt.com/docs/4.x/api/composables/create-use-fetch) and the [custom useFetch recipe](https://nuxt.com/docs/4.x/guide/recipes/custom-usefetch) cover the remaining options.
