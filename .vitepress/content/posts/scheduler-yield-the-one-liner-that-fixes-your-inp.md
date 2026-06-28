---
date: "2026-06-28T07:08:02.000+00:00"
tags: ["javascript", "performance", "web-apis"]
draft: false
title: "scheduler.yield(): The One-Liner That Fixes Your INP"
image: "/images/posts/scheduler-yield-the-one-liner-that-fixes-your-inp.jpg"
topic: "development"
description: "A practical look at scheduler.yield(), the browser API that breaks up long tasks and keeps the main thread responsive without the setTimeout penalty."
---

You click a button, and for a beat nothing happens. The spinner doesn't appear, the page feels stuck, and then everything updates at once. That little hitch is exactly what Interaction to Next Paint measures, and the usual culprit is a long task: a chunk of JavaScript that hogs the main thread so the browser can't paint or respond to input until it finishes.

The old advice was to slice that work into smaller pieces with `setTimeout`, handing control back to the browser between chunks. It works, but it comes with a tax. `scheduler.yield()` does the same job without the tax, and it's now available across most browsers. If you've been ignoring it, this is the post that should change your mind.

## Why setTimeout yielding hurts

The classic pattern looks like this. You're processing a big array, so you periodically yield:

```js
async function processItems(items) {
  for (const [i, item] of items.entries()) {
    doExpensiveWork(item);
    if (i % 50 === 0) {
      await new Promise((resolve) => setTimeout(resolve, 0));
    }
  }
}
```

This breaks the long task into shorter ones, which is genuinely good for input delay. The problem is _where_ your continuation lands. When you yield with `setTimeout`, the rest of your function goes to the **back** of the task queue. Anything else that got scheduled in the meantime, a third-party analytics callback, another component's work, a different `setTimeout`, now runs before you get control back. Your loop can stall behind work you don't care about, and a job that should take 100ms stretches out unpredictably.

You yielded to be polite, and the browser took you a little too literally.

## What scheduler.yield() does differently

`scheduler.yield()` returns a promise you can await. Execution pauses at that point and hands the main thread back, exactly like the `setTimeout` trick, so pending interactions can be serviced. The difference is the continuation gets put in a **prioritized** queue. When the browser comes back around, your function resumes _before_ other similar tasks that were waiting, rather than after them.

Rewriting the loop is almost anticlimactic:

```js
async function processItems(items) {
  for (const [i, item] of items.entries()) {
    doExpensiveWork(item);
    if (i % 50 === 0) {
      await scheduler.yield();
    }
  }
}
```

Same shape, better behavior. You still let high-priority interaction work jump the line, the whole point of yielding, but your own continuation isn't shoved to the end of an unbounded queue. In Chrome's framing, a `scheduler.yield()` continuation outranks a `scheduler.postTask()` task of the same priority level, which is what keeps your loop from getting starved.

A common real-world shape is an event handler that needs to show feedback before doing slow work:

```js
button.addEventListener("click", async () => {
  showSpinner();
  await scheduler.yield(); // let the browser paint the spinner
  doSlowContentSwap(); // then run the expensive part
});
```

Without the yield, the spinner and the slow swap are one long task, so the spinner never actually appears until the work is already done.

## Shipping it without breaking Safari

The honest caveat: `scheduler.yield()` is a Chromium feature. It's been stable in Chrome and Edge since version 129 (September 2024) and covers roughly 70% of global traffic, but Safari and Firefox don't ship it yet, so you can't call it blind. Feature-detect and fall back.

A tidy inline fallback covers you:

```js
function yieldToMain() {
  if (globalThis.scheduler?.yield) {
    return scheduler.yield();
  }
  return new Promise((resolve) => setTimeout(resolve, 0));
}
```

Now `await yieldToMain()` gives you the prioritized continuation where it's supported and the plain `setTimeout` behavior everywhere else. Non-Chromium users still get the benefit of broken-up tasks; they just don't get the queue-jumping bonus.

If you'd rather not hand-roll it, Google Chrome Labs publishes a `scheduler-polyfill` package that implements the whole Scheduler API. It backs `scheduler.yield()` with `user-blocking` `postTask()` tasks where available and falls through to `setTimeout`, `MessageChannel`, and `requestIdleCallback` otherwise, so you get consistent semantics across browsers from a single import.

## Where to actually reach for it

This isn't a sprinkle-everywhere API. The wins come from places where you genuinely run long synchronous-ish work in response to input: rendering a large list after a click, parsing or transforming a big payload, hydrating a heavy widget, or running a sequence of independent setup steps on load. Drop a yield between logical chunks and measure INP before and after with something like the web-vitals library or your RUM tooling.

The pattern to internalize is simple: when a single task does too much, slice it, and when you slice it, yield with `scheduler.yield()` rather than `setTimeout` so your own work doesn't pay the price for being considerate. It's one of the rare performance fixes that's both a real improvement and a one-line diff.
