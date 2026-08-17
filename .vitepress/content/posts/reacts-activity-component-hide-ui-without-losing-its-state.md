---
date: "2026-08-17T02:07:37.000-05:00"
tags: ["react", "javascript", "performance", "react.js"]
draft: false
title: "React's Activity Component: Hide UI Without Losing Its State"
image: "/images/posts/reacts-activity-component-hide-ui-without-losing-its-state.jpg"
topic: "development"
description: "React 19.2's Activity component hides a subtree instead of unmounting it, so state, scroll position, and DOM survive the round trip. Here's how it behaves, what it does to your Effects, and where it costs you."
---

A user types half a message into the compose tab, flips over to the settings tab to change a
notification preference, flips back, and the draft is gone. You know exactly why: `{tab === 'compose' && <Compose />}` unmounted the subtree, and unmounting throws away state.

The usual fixes are all a little sad. Lift the state up and thread it back down through props.
Park it in a store that exists only to survive an unmount. Or render everything at once behind a
`display: none` class and eat the mount cost of every panel on first paint. React 19.2 added a
first-class answer instead: `<Activity>`.

## Two modes and a boundary

`Activity` is a component you import from `react` directly. It takes a `mode` prop that is either
`visible` or `hidden`, and it wraps the subtree you want to keep alive.

```jsx
import { Activity } from "react";

function Workspace({ tab }) {
  return (
    <>
      <Activity mode={tab === "compose" ? "visible" : "hidden"}>
        <Compose />
      </Activity>
      <Activity mode={tab === "settings" ? "visible" : "hidden"}>
        <Settings />
      </Activity>
    </>
  );
}
```

When a boundary goes hidden, React hides its children with `display: none` rather than removing
them. Every `useState` and `useReducer` value in the subtree is preserved, and so is the DOM state
that React normally has no opinion about: scroll offsets, uncontrolled input values, the current
playback position of a `<video>`. Flip back to `visible` and the panel is exactly where the user
left it, with no restoration logic on your side.

## Hidden does not mean paused

This is the part that trips people up, so it's worth being blunt about it: hiding an `Activity`
runs your cleanup functions. Every `useEffect` and `useLayoutEffect` cleanup in the subtree fires,
exactly as if the component had unmounted. Sockets close, intervals clear, observers disconnect.
When the boundary becomes visible again, the setup functions run again.

That is the behavior you want most of the time. A hidden panel holding an open WebSocket is a
resource leak with extra steps.

```jsx
function LivePrices({ symbol }) {
  const [quotes, setQuotes] = useState({});

  useEffect(() => {
    const socket = new WebSocket(`wss://example.com/quotes/${symbol}`);
    socket.onmessage = (e) => setQuotes(JSON.parse(e.data));
    return () => socket.close();
  }, [symbol]);

  return <QuoteTable rows={quotes} />;
}
```

Wrapped in a hidden `Activity`, the socket closes but `quotes` survives. Come back and the table
paints immediately with the last known numbers, then updates as fresh messages arrive. The user
sees stale-but-plausible data instead of a spinner. The practical requirement is that your Effects
have to tolerate running more than once, which is the same discipline StrictMode's double-invoke
has been enforcing in development for years.

## Pre-rendering what nobody has clicked yet

Hidden boundaries are not inert. React still renders them, at the lowest priority it has. That
turns `Activity` into a way to warm up a route before the user asks for it.

```jsx
<Activity mode={route === "/reports" ? "visible" : "hidden"}>
  <ReportsPage />
</Activity>
```

The reports page mounts, its data fetches start, its component tree gets built, all in the gaps
between higher-priority work. Navigation then feels instant because most of the work already
happened.

The catch: lowest priority is the only priority you get. There is no knob for tuning it, and if
the hidden subtree is genuinely expensive it still competes for the same main thread as everything
visible. `Activity` reorders work; it does not make it free. React 19.2's DevTools Performance
Tracks are the right place to check whether a background boundary is actually paying for itself.

The other cost is DOM weight. Hidden children remain in the document, so twenty hidden panels are
twenty panels' worth of nodes that the browser still has to keep in memory and account for in style
recalculation. `Activity` is aimed at a handful of heavy, stateful regions, such as tab groups,
wizard steps, and a route you're fairly confident is next. It is not a blanket replacement for
conditional rendering, and a list of a thousand rows should still unmount.

## What it retires

If you've written a `useRef` cache to stash a component's scroll position, or added a slice to
Zustand whose only job was surviving an unmount, or hand-rolled a `hidden` class plus a pile of
`if (!visible) return` guards inside your Effects, that's the pattern `Activity` collapses into one
boundary.

It shipped stable in React 19.2, so there's no canary flag to opt into. Pick the tab group in your
app that annoys you most, wrap each panel, and delete the state-preservation scaffolding you built
around it. The [official reference](https://react.dev/reference/react/Activity) covers the
remaining edge cases, including how it interacts with Suspense.
