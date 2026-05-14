---
created_at: '2026-01-03T20:02:00.000-08:00'
tags: ['javascript', 'typescript', 'web-apis']
draft: true
title: "JavaScript Signals: The New Reactivity Primitive Coming to the Platform"
image: '/images/posts/javascript-signals-the-new-reactivity-primitive.jpg'
topic: 'development'
description: "Signals are already powering reactivity in Solid, Preact, and Angular. Now there's a TC39 proposal to bring them to the JavaScript language itself — here's what that means."
---

If you've used SolidJS, Preact Signals, Vue's Composition API, or Angular's new reactivity model, you've already worked with signals — even if they weren't called that. The concept is simple: a signal is a reactive value container. Read it and you automatically subscribe to changes; write to it and dependents update. A TC39 proposal is now working to standardize this pattern at the language level.

## The Problem Signals Solve

In any sufficiently interactive UI, you have state that multiple parts of the app care about. The traditional approaches — manual event emitters, global stores with selectors, React's re-render cascade — all work, but they all require the framework to figure out what changed and what needs to update. Signals flip this: the reactivity graph is *explicit* and fine-grained.

```js
// Without signals: re-render everything, let the diff sort it out
function Counter() {
  const [count, setCount] = useState(0);
  return <button onClick={() => setCount(c => c + 1)}>{count}</button>;
}

// With signals: only the text node updates, nothing else re-renders
import { signal } from '@preact/signals';

const count = signal(0);

function Counter() {
  return <button onClick={() => count.value++}>{count}</button>;
}
```

The Preact example above doesn't re-render the component at all on click — only the text node that reads `count` updates. At scale, this precision matters for performance.

## The TC39 Proposal API

The Signals proposal (currently Stage 1) defines a minimal standard API:

```js
import { Signal } from 'signal-polyfill';

// A writable signal
const temperature = new Signal.State(72);

// A computed signal — re-evaluates only when dependencies change
const feelsLike = new Signal.Computed(() => {
  const temp = temperature.get();
  return temp > 80 ? `${temp}°F (hot)` : `${temp}°F`;
});

// Read
console.log(feelsLike.get()); // "72°F"

// Write
temperature.set(85);
console.log(feelsLike.get()); // "85°F (hot)"
```

The proposal deliberately leaves out effects (side effects that run in response to signal changes) because scheduling effects correctly is where frameworks diverge. The goal is to give frameworks a shared reactive primitive to build on, not to dictate how they should run DOM updates.

## What This Means for Frameworks

The Signals proposal is explicitly designed as framework infrastructure. If it ships, React, Vue, Svelte, Solid, and Angular could all share the same signal graph under the hood, enabling interoperability that's currently impossible. A React component could read a signal written by a Solid component in the same app — something that sounds outlandish today but would be natural with a shared primitive.

```js
// Framework-agnostic signal created from the platform
const sharedState = new Signal.State({ user: null, theme: 'dark' });

// Any framework can read/write this
// React wrapper:
function useSignal(signal) {
  const [value, setValue] = useState(signal.get());
  useEffect(() => {
    // frameworks would hook into Signal.subtle.Watcher here
    const watcher = new Signal.subtle.Watcher(() => {
      setValue(signal.get());
    });
    watcher.watch(signal);
    return () => watcher.unwatch(signal);
  }, [signal]);
  return value;
}
```

## Where Things Stand

The proposal is at Stage 1, which means the committee finds the problem worth solving but hasn't committed to the solution shape. Browser implementations are not imminent. What you can do today is use the `signal-polyfill` package to experiment with the proposed API, or use any of the mature signal implementations in Preact, Solid, Vue reactivity, or Angular.

Regardless of whether the TC39 proposal ships in its current form, signals have already won the reactivity debate in the frontend ecosystem. Learning the pattern now — whatever library you use — is time well spent.
