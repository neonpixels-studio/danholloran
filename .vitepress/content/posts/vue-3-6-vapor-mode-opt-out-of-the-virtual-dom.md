---
date: "2026-06-10T07:08:27.000+00:00"
tags: ["vue", "javascript", "performance", "vue.js"]
draft: false
title: "Vue 3.6 Vapor Mode: Opt Out of the Virtual DOM"
image: "/images/posts/vue-3-6-vapor-mode-opt-out-of-the-virtual-dom.jpg"
topic: "development"
description: "Vue 3.6 Vapor Mode eliminates the virtual DOM for opted-in components, delivering SolidJS-level performance without rewriting a single line of your template logic."
---

The virtual DOM has been Vue's engine room since day one. It's the layer that diffs what changed in your component tree and figures out the minimal DOM updates needed. For most apps, it's fast enough that you never think about it. But "fast enough" has always meant there was overhead you were silently paying — and now Vue is letting you opt out.

Vue 3.6 ships Vapor Mode as a stable, opt-in compilation strategy. Components that use it skip the virtual DOM entirely. Instead of generating VNodes that get diffed at runtime, the compiler generates direct DOM operations — the same approach that makes SolidJS and Svelte 5 so fast. The benchmarks are striking: up to 97% faster renders in component-heavy scenarios, with bundle sizes 20–50% smaller for Vapor-only components. Vue can now mount 100,000 components in roughly 100ms, which puts it squarely in the same performance tier as SolidJS.

## How Opting In Works

The upgrade path is intentionally low-friction. You don't switch your whole app at once. Vapor is a per-component choice, and it coexists freely with your existing virtual DOM components in the same tree.

The simplest way to opt in is a single attribute on your `<script setup>` tag:

```vue
<script setup vapor>
import { ref } from "vue";

const count = ref(0);
</script>

<template>
  <button @click="count++">Clicked {{ count }} times</button>
</template>
```

That's it. The same `ref`, the same template syntax, the same Composition API you already know — just with the `vapor` attribute telling the compiler to generate direct DOM instructions instead of a VNode tree. Alternatively, you can name the file `MyComponent.vapor.vue` to opt in without touching the script block, which is handy when you want to experiment without modifying source files.

The compiler transform is where the magic happens. A Vapor component's `<template>` compiles to something that creates DOM nodes once and then surgically updates them when reactive state changes — no diffing, no intermediate object allocations. The reactivity system (still Proxy-based under the hood, now enhanced with the new Alien Signals model) drives granular updates directly against the real DOM.

## What You Give Up

Vapor Mode isn't a drop-in replacement for every component. The key constraint is that it only supports Composition API and `<script setup>`. Options API components, `<script>` without `setup`, and class-based components can't use Vapor — they stay on the virtual DOM path.

There's also one notable async exception: `<Suspense>`. Component trees that rely on Suspense for async data orchestration need to remain on the VDOM path for now, as Suspense is not yet supported in Vapor. That means if a Vapor component is a direct child of a `<Suspense>` boundary, you'll want to hold off.

For libraries and design system components — things that render a lot and get used everywhere — Vapor is a natural fit. A heavily-used `<DataTable>`, `<VirtualList>`, or `<Chart>` component that renders thousands of rows is exactly where eliminating VNode overhead pays off most.

## A Practical Adoption Strategy

The most sensible approach is to start at the leaves. Identify the components in your app that render most frequently or at the highest volume — usually leaf components like list items, table rows, or icon buttons — and add `vapor` to those first. Mixed trees work: a virtual DOM parent component can render Vapor children without any special configuration or wrappers.

```vue
<!-- ParentComponent.vue — standard VDOM component -->
<template>
  <ul>
    <ListItem v-for="item in items" :key="item.id" :item="item" />
  </ul>
</template>
```

```vue
<!-- ListItem.vapor.vue — Vapor component, opted in by filename -->
<script setup>
defineProps(["item"]);
</script>

<template>
  <li>{{ item.name }}</li>
</template>
```

Vue handles the boundary between the two rendering modes automatically. From a developer experience standpoint, both components look and feel identical — you just notice the performance difference in profiling.

## The Bigger Picture

Vapor Mode is the culmination of a direction Evan You signaled years ago: a Vue that can meet the performance bar of compile-time-first frameworks without asking you to abandon the progressive, component-centric model that made Vue popular. You don't have to learn new primitives, switch to JSX, or reason about fine-grained subscriptions manually. The compiler does the work.

For apps that are hitting real rendering bottlenecks — dashboards with dense real-time data, large lists, or component trees that re-render heavily under user interaction — Vapor Mode is worth evaluating today. Start with one hot component, measure, and expand from there. The opt-in model means there's no risk to the rest of your app.
