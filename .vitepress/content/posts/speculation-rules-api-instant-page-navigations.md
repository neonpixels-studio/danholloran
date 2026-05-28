---
date: '2026-05-28T07:11:04.000+00:00'
tags: ['javascript', 'web-apis', 'performance', 'web-performance']
draft: true
title: "The Speculation Rules API: Instant Page Navigations Without a Framework"
image: '/images/posts/speculation-rules-api-instant-page-navigations.jpg'
topic: 'development'
description: "The Speculation Rules API lets you tell the browser which pages to prefetch or fully prerender in the background — delivering near-instant navigations with a few lines of JSON and no framework required."
---

Navigation speed is one of the biggest perceived performance wins you can hand users — not the initial page load, but how fast *subsequent* pages feel. Getting truly instant navigations used to mean reaching for a SPA framework and client-side routing. The Speculation Rules API changes that. It lets you prerender entire pages in the background so transitions feel nearly instantaneous. No framework required.

## What the Speculation Rules API Does

The API works through a `<script type="speculationrules">` tag containing a JSON structure that describes pages the browser should either *prefetch* (download the HTML in the background) or *prerender* (fully load and render the page, including JavaScript execution, in a hidden context). When the user navigates to a prefetched or prerendered URL, the browser activates it instantly.

Two modes, two tradeoffs:

- **Prefetch** — downloads the document and subresources, holding them ready. Cheap and broadly applicable.
- **Prerender** — fully renders the page (runs JS, loads styles, builds the DOM) in a hidden renderer. The navigation feels like it was already loaded. Higher memory cost, so use it selectively.

A basic list-based rule looks like this:

```html
<script type="speculationrules">
{
  "prerender": [
    {
      "urls": ["/products", "/about", "/pricing"]
    }
  ]
}
</script>
```

Drop that in your `<head>` and Chrome will start prerendering those three URLs in the background as soon as the page loads. When a user clicks one of those links, it activates instantly — the renderer was already running.

## Document Rules: Dynamic Prefetching Without Hardcoding URLs

Hardcoding a URL list works for small sites, but most apps need something smarter. *Document rules* match links already on the page rather than requiring you to enumerate every URL upfront.

```html
<script type="speculationrules">
{
  "prefetch": [
    {
      "source": "document",
      "where": {
        "and": [
          { "href_matches": "/*" },
          { "not": { "href_matches": "/logout" } }
        ]
      },
      "eagerness": "moderate"
    }
  ]
}
</script>
```

This tells the browser: prefetch any same-origin link on this page, except `/logout`, and use *moderate* eagerness. The `eagerness` setting controls when the speculation fires:

- `"immediate"` — speculate as soon as the rule is parsed
- `"moderate"` — trigger on hover (desktop) or when the link enters the viewport (mobile)
- `"conservative"` — trigger only on pointerdown or touchstart

For prefetch, `"moderate"` is usually the right default — aggressive enough to feel instant, conservative enough to avoid wasting bandwidth on links that never get clicked.

You can combine both approaches: broad prefetch for general coverage, prerender for your highest-confidence paths:

```html
<script type="speculationrules">
{
  "prefetch": [
    {
      "source": "document",
      "where": { "href_matches": "/*" },
      "eagerness": "moderate"
    }
  ],
  "prerender": [
    {
      "source": "document",
      "where": { "href_matches": "/products/*" },
      "eagerness": "conservative"
    }
  ]
}
</script>
```

## Handling Analytics and Side Effects

Prerendering a page means JavaScript runs before the user actually sees it, which is a problem for analytics or anything that records an impression. The `document.prerendering` property tells you whether the page is in a background prerender state, and the `prerenderingchange` event fires when the user actually navigates to it.

```js
// Guard analytics so they only fire on real views
function trackPageView() {
  if (document.prerendering) {
    document.addEventListener('prerenderingchange', trackPageView, { once: true });
    return;
  }
  // Safe to fire analytics here
  analytics.track('page_view', { path: location.pathname });
}

trackPageView();
```

Major providers like Google Analytics already handle this automatically. If you're using a custom analytics setup or tag manager, this guard pattern keeps your numbers accurate.

A few more caveats worth knowing:

- **Browser support:** Chromium-based browsers only (Chrome 109+, Edge, Opera). Safari and Firefox ignore the rules entirely with no ill effects — users just get normal navigation.
- **Memory:** Each prerender spins up a real renderer process. Keep your prerender rules to a handful of high-value pages rather than blanketing an entire site.
- **Don't prerender auth-sensitive pages:** Prerendered pages load before the navigation, which can expose logged-in state at unexpected times. Exclude pages like `/account`, `/dashboard`, or anything behind a login check from your prerender rules.

## Adoption Is Accelerating

The 2025 Web Almanac reported that 35% of mobile websites now use the Speculation Rules API — much of that driven by WordPress 6.8, which baked speculation rules into core in March 2025. If you're running a multi-page app, a content site, or really anything with internal navigation, there's very little reason not to add at least a prefetch rule. The [Chrome for Developers prerender guide](https://developer.chrome.com/docs/web-platform/prerender-pages) and the [MDN Speculation Rules reference](https://developer.mozilla.org/en-US/docs/Web/API/Speculation_Rules_API) are both excellent starting points for going deeper.
