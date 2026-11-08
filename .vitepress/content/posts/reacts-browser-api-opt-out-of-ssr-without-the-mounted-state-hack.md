---
date: "2026-11-08T02:14:40.000-08:00"
tags: ["react", "javascript", "performance", "react.js"]
draft: false
title: "React's browser() API: Opt Out of SSR Without the Mounted-State Hack"
image: "/images/posts/reacts-browser-api-opt-out-of-ssr-without-the-mounted-state-hack.jpg"
topic: "development"
description: "React 19.3 adds use(browser()), a first-class way to mark a component as browser-only during server rendering, replacing typeof window checks and useEffect mounted flags with a Suspense fallback."
---

Every server-rendered React app eventually grows a component that just can't render on the server. It reads a draft from `localStorage`, shows the visitor's time zone, or wraps a charting library that touches `window` on import. So you reach for the usual workaround: a `mounted` flag set in an effect, or a `typeof window !== 'undefined'` check sprinkled through render.

Both work, sort of. The effect version renders nothing (or a placeholder) on the first client pass and then flips, which costs you an extra render and some layout shift. The `typeof window` version is worse, because it renders different output on the server and the client, which is exactly how you get a hydration mismatch. React 19.3, released in September 2026, finally ships a real answer: `use(browser())`.

## What `browser()` actually does

`browser` is a new export from `react-dom`. You call it inside `use`, and it marks the component as browser-only during server rendering:

```jsx
import { Suspense, use, useState } from "react";
import { browser } from "react-dom";

function SavedDraft() {
  use(browser("The draft is stored in localStorage."));

  const [draft, setDraft] = useState(() => localStorage.getItem("draft") ?? "");

  return (
    <textarea
      value={draft}
      onChange={(e) => {
        setDraft(e.target.value);
        localStorage.setItem("draft", e.target.value);
      }}
    />
  );
}

export default function Editor() {
  return (
    <Suspense fallback={<p>Loading draft...</p>}>
      <SavedDraft />
    </Suspense>
  );
}
```

On the server, `use(browser())` stops rendering that component and leaves the nearest `<Suspense>` fallback in the HTML. In the browser, it returns `undefined` and the component renders normally. Notice that the `useState` initializer can read `localStorage` directly. There's no guard and no second render, because this code only ever runs where `localStorage` exists.

The mental model is the nice part. Browser-only content is now just another thing that suspends. It shares loading states with your data fetching, it composes with streaming, and it shows up in the HTML as a proper fallback instead of an empty `<div>` that pops in later.

A few rules from the [official docs](https://react.dev/reference/react-dom/browser) worth memorizing:

- It must sit inside a `<Suspense>` boundary during server rendering. Without one, the server render fails.
- It only works in Client Components. In a Server Components setup like Next.js, put it in a `'use client'` file.
- Calling `browser()` by itself does nothing. Pass it to `use`, and don't throw it.

## Opting out conditionally

Because `use` can be called after an early return or inside an `if`, you can opt out of server rendering only when you actually need to. That's something the mounted-flag pattern never handled cleanly.

```jsx
import { use } from "react";
import { browser } from "react-dom";

export function useTimeZone(defaultTimeZone) {
  if (defaultTimeZone !== undefined) {
    return defaultTimeZone;
  }

  use(browser("No default time zone was provided."));
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}
```

If the event page passes `'America/New_York'`, the time zone lands in the server HTML. If it doesn't, the component suspends on the server and reads the device's zone in the browser.

The same trick works well for client-side data libraries. Wrap your query hook so it only skips SSR when there's no server-provided data:

```jsx
function useBrowserQuery(key, options) {
  if (options.initialData === undefined) {
    use(browser("useBrowserQuery: no initial data was provided."));
  }
  return useQuery(key, options);
}
```

Now `ProductDetails` renders to HTML when a loader or Server Component hands it `initialData`, and quietly defers to the browser when it doesn't.

## Seeing what bailed out, and bailing out on purpose

A browser bailout isn't an error, so React does not send it to `onError` or to `hydrateRoot`'s `onRecoverableError`. Instead, the server renderers accept a new `onBrowserBailout` callback. The string you passed to `browser()` becomes the reported error's `cause`, and you also get a component stack:

```js
const { pipe } = renderToPipeableStream(<App />, {
  onShellReady() {
    pipe(res);
  },
  onBrowserBailout(error, errorInfo) {
    logger.info("browser-only render", {
      reason: error.cause,
      stack: errorInfo.componentStack,
    });
  },
});
```

That's worth wiring up. A browser-only component is a real SEO and first-paint tradeoff, and it's easy for a team to keep adding them until half the page is fallbacks. Logging them gives you a count to watch.

The same value also works as an abort reason. If a slow Suspense boundary is holding up your stream, you can hand it off to the client instead of failing:

```js
setTimeout(() => {
  abort(browser("The server render timed out."));
}, 10000);
```

Pending boundaries stay in their fallback state and finish rendering in the browser. That's a much friendlier timeout than a 500. If your rendering API takes an `AbortSignal`, pass `browser()` to `AbortController.abort` instead.

## When not to reach for it

`browser()` makes skipping the server easy, and that's the risk. Anything inside the boundary is missing from the initial HTML, so crawlers and slow connections see your fallback. Before reaching for it, ask whether the component could render a sensible default on the server, like a saved preference from a cookie instead of `localStorage`, or a time zone from the request. The conditional pattern above is usually the right middle ground.

When a component truly can't render on the server, though, this is the cleanest tool React has offered. Upgrade to React 19.3, delete your `useIsMounted` hook, and read the [React 19.3 release post](https://react.dev/blog/2026/09/09/react-19-3) for the other headline features, `<ViewTransition>` and Fragment Refs.
