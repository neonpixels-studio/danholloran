---
created_at: '2026-01-17T09:05:00.000-08:00'
tags: ['vue', 'javascript', 'tooling']
draft: true
title: "Nuxt 4: What's Changing and How to Prepare Your App"
image: '/images/posts/nuxt-4-upgrade-guide-and-new-features.jpg'
topic: 'development'
description: "Nuxt 4 brings a restructured project layout, improved data fetching, and a cleaner compatibility layer. Here's what to expect and how to migrate without pain."
---

Nuxt 4 has been in development with a carefully managed migration strategy — many of its changes were already opt-in under Nuxt 3 via the `future` compatibility flags. This means developers who've been running Nuxt 3 projects can prepare incrementally rather than face a cliff-edge upgrade. Here's what's actually changing and what you need to do about it.

## The Unified `app/` Directory

The most visible structural change in Nuxt 4 is consolidating your project source into an `app/` directory by default. In Nuxt 3, source files lived at the project root alongside config files, which led to some ambiguity about what was "app code" vs. "project config."

```
# Nuxt 3 structure
/
├── components/
├── composables/
├── pages/
├── server/
├── nuxt.config.ts
└── package.json

# Nuxt 4 structure
/
├── app/
│   ├── components/
│   ├── composables/
│   ├── pages/
│   └── app.vue
├── server/
├── nuxt.config.ts
└── package.json
```

You can opt into this today in Nuxt 3 by setting `future.compatibilityVersion: 4` in your config, which lets you migrate the directory structure gradually without waiting for the major release.

## Deduped Data Fetching with `useAsyncData`

Nuxt 4 refines how `useAsyncData` and `useFetch` handle deduplication. In Nuxt 3, requests with the same key on the same page were deduplicated, but the behavior wasn't always predictable when composables were called from deeply nested components. Nuxt 4 makes the deduplication logic explicit and consistent:

```ts
// The key is now required and must be unique per logical request
const { data: user } = await useAsyncData(
  'user-profile',
  () => $fetch(`/api/users/${userId}`),
  {
    // New: control deduplication behavior
    dedupe: 'defer', // or 'cancel'
  }
);
```

The `defer` strategy (default) holds the second caller until the first resolves and reuses the result. The `cancel` strategy aborts the in-flight request if a new one comes in with the same key — useful for search inputs where you always want the latest result.

## Improved Shared State with `useState`

`useState` in Nuxt is the server-to-client state bridge — values set on the server are serialized into the HTML and hydrated on the client without a flash. Nuxt 4 improves the TypeScript support and makes the initialization function required, removing a source of subtle bugs:

```ts
// The init function is now strongly typed and required
const theme = useState<'light' | 'dark'>('theme', () => 'light');

// Access from any component or composable
const currentTheme = useState<'light' | 'dark'>('theme');
```

The state is keyed globally, so any component that calls `useState('theme')` reads and writes the same value — no prop drilling, no external store required for simple shared state.

## Nuxt DevTools Are Now Core

Nuxt DevTools, which shipped as a separate module, is now a first-class part of the framework. You get a runtime inspector, component graph visualization, composables explorer, and server route explorer without installing anything extra:

```bash
# No extra install needed in Nuxt 4 — DevTools are built in
npm run dev
# Open http://localhost:3000/__nuxt_devtools__/
```

## Preparing Your Nuxt 3 App

The cleanest migration path is to enable `compatibilityVersion: 4` in your existing Nuxt 3 project and work through the warnings before upgrading:

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  future: {
    compatibilityVersion: 4,
  },
});
```

This surfaces deprecation warnings and behavior changes without breaking your build. Fix them one by one, and by the time Nuxt 4 is your production dependency, the upgrade will be uneventful.
