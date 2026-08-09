---
date: "2026-08-09T02:08:00.000-05:00"
tags: ["performance", "web-apis", "javascript", "web-performance"]
draft: false
title: "The Long Animation Frames API: Find What Actually Broke Your INP"
image: "/images/posts/long-animation-frames-api-find-what-actually-broke-your-inp.jpg"
topic: "development"
description: "Your field data says INP is 400ms. Your local profile says everything is fine. The Long Animation Frames API closes that gap by naming the script, the function, and the character position that stalled the frame."
---

Your real user monitoring dashboard says the 75th percentile INP on your product page is 412ms. You open DevTools, click the same button forty times, and every interaction comes back at 60ms. Nothing reproduces. So you start guessing: maybe it's the analytics tag, maybe it's the third-party chat widget, maybe it's that one `useEffect` that everybody is afraid to touch.

The Long Tasks API was supposed to help here, and it mostly didn't. It would tell you a task ran for 210ms and attribute it to "self" or an iframe container, which is roughly as actionable as a smoke alarm that only reports "somewhere in the house." The Long Animation Frames API is the replacement, and it does the thing you actually wanted all along: it hands you a script URL, a function name, and a character offset.

## A frame is a better unit of measurement than a task

Slow interactions are rarely one fat task. They're usually five medium tasks, a `ResizeObserver` callback, and a style recalculation, all landing between two paints. Long Tasks only saw the fat ones, and it stopped measuring before rendering even started.

LoAF widens the window. It reports on any animation frame whose total work exceeded 50ms, covering everything from the first task in that frame through style, layout, and paint. Entries arrive with `entryType` of `long-animation-frame`:

```js
const observer = new PerformanceObserver((list) => {
  for (const frame of list.getEntries()) {
    console.log({
      duration: frame.duration,
      blockingDuration: frame.blockingDuration,
      scriptTime: frame.renderStart ? frame.renderStart - frame.startTime : 0,
      styleAndLayout: frame.styleAndLayoutStart
        ? frame.paintTime - frame.styleAndLayoutStart
        : 0,
    });
  }
});

observer.observe({ type: "long-animation-frame", buffered: true });
```

Four timestamps do most of the work. `startTime` is when the frame began, `renderStart` is when script handed off to the rendering pipeline, `styleAndLayoutStart` is where recalc and layout begin, and `paintTime` is where it ends. Subtracting them tells you whether you have a JavaScript problem or a layout problem, which are fixed in completely different ways.

The one field to alert on is `blockingDuration`. It sums the over-50ms portion of every long task in the frame plus the rendering time, so it approximates how long the main thread was genuinely unavailable to a user. A 300ms frame with a 20ms `blockingDuration` is fine. A 120ms frame with a 90ms `blockingDuration` is not.

## Script attribution is the whole point

Every LoAF entry carries a `scripts` array of `PerformanceScriptTiming` objects, and this is where the guessing stops:

```js
const worst = frame.scripts.sort((a, b) => b.duration - a.duration)[0];

console.log({
  url: worst.sourceURL, // https://cdn.example.com/widget.js
  fn: worst.sourceFunctionName, // handleScroll
  char: worst.sourceCharPosition, // 18422
  invoker: worst.invoker, // window.onscroll
  invokerType: worst.invokerType, // event-listener
  duration: worst.duration,
  forcedLayout: worst.forcedStyleAndLayoutDuration,
  paused: worst.pauseDuration,
});
```

`invokerType` tells you _how_ the script got run: `event-listener`, `user-callback`, `resolve-promise`, `module-script`, `classic-script`. That distinction matters, because a slow `event-listener` is your code to fix and a slow `classic-script` during load is usually a tag manager you need to defer.

`forcedStyleAndLayoutDuration` is quietly the best field in the API. If it's a meaningful chunk of `duration`, you have layout thrashing: something read `offsetHeight` or `getBoundingClientRect()` inside a write loop and forced synchronous layout. You now know which function, in which file, at which character.

The caveat worth knowing before you build dashboards on this: attribution only covers same-origin main-thread scripts. Cross-origin iframes, web workers, service workers, and browser extensions can lengthen a frame without ever showing up in `scripts`. When you see a big `duration` with a nearly empty `scripts` array, that absence is itself the signal.

## Tie it to the interaction, not just the clock

A stream of slow frames is noise until you connect it to a specific bad interaction. The easiest path is `web-vitals` with the attribution build, which already correlates LoAF entries with the INP interaction for you:

```js
import { onINP } from "web-vitals/attribution";

onINP(({ value, attribution }) => {
  if (value < 200) return;

  const culprit = attribution.longAnimationFrameEntries
    .flatMap((frame) => frame.scripts)
    .sort((a, b) => b.duration - a.duration)[0];

  beacon("/rum", {
    inp: value,
    target: attribution.interactionTarget,
    inputDelay: attribution.inputDelay,
    processing: attribution.processingDuration,
    presentation: attribution.presentationDelay,
    script: culprit && `${culprit.sourceURL}:${culprit.sourceFunctionName}`,
  });
});
```

Send the single worst script, not the whole entry. A busy page can produce dozens of LoAFs in a session and serializing all of them will cost you more than the insight is worth.

LoAF shipped in Chrome 123 after an origin trial, and it's still Chromium-only. That sounds limiting until you remember that Chrome is also where your Core Web Vitals field data comes from, so the coverage gap and the metric you're optimizing line up almost exactly. Start by logging `blockingDuration` and the top script for interactions over 200ms, then read the [Chrome documentation](https://developer.chrome.com/docs/web-platform/long-animation-frames) and the [spec](https://w3c.github.io/long-animation-frames/) once you know which part of your frame is actually on fire.
