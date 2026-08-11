---
date: "2026-08-10T02:07:54.000-05:00"
tags: ["frontend", "javascript", "web-apis", "tooling"]
draft: false
title: "Trusted Types Is Baseline: DOM XSS Is Now a Type Error"
image: "/images/posts/trusted-types-is-baseline-dom-xss-is-now-a-type-error.jpg"
topic: "development"
description: "Firefox 148 shipped Trusted Types in February 2026, making it Baseline. Here's how to turn every dangerous innerHTML assignment in your app into a TypeError you can actually catch."
---

Every codebase has one. Somewhere in a component nobody has opened in eighteen months, there is a line that reads `el.innerHTML = someValue`, and nobody can tell you with confidence where `someValue` comes from. Maybe it's a hardcoded template. Maybe it's a server response. Maybe, three refactors ago, it started carrying a slice of `location.hash`. That uncertainty is the entire DOM XSS problem: the sink is a plain string setter, strings all look alike, and the browser has no way to tell a trusted one from an attacker-controlled one.

Trusted Types fixes that by refusing strings outright. And as of February 2026, when Firefox 148 shipped support, it's [Baseline](https://developer.mozilla.org/en-US/docs/Web/API/Trusted_Types_API) — Chrome and Edge have had it since 83 back in 2020, Safari joined in version 26, and now the whole core browser set is covered. It's no longer a Chrome-only hardening trick you bolt onto an internal admin tool.

## Turning a whole class of bug into a runtime error

The API works by locking down the risky sinks: `innerHTML`, `outerHTML`, `insertAdjacentHTML`, `document.write`, `DOMParser.parseFromString`, `<iframe srcdoc>`, script `src` and text content, and the code-compiling family (`eval`, `new Function()`, string-argument `setTimeout` and `setInterval`). Once enforcement is on, passing a raw string to any of them throws a `TypeError`.

You opt in with a CSP header:

```
Content-Security-Policy: require-trusted-types-for 'script'; trusted-types escape-html;
```

That first directive is the switch. The second is an allowlist of policy names — factories that are the only things permitted to mint a trusted value:

```js
const escapeHTMLPolicy = trustedTypes.createPolicy("escape-html", {
  createHTML: (input) => input.replace(/</g, "&lt;"),
});

const safe = escapeHTMLPolicy.createHTML("<img src=x onerror=alert(1)>");
safe instanceof TrustedHTML; // true
el.innerHTML = safe; // fine

el.innerHTML = userInput; // TypeError
```

Note what this actually buys you. Trusted Types does not sanitize anything — your `createHTML` function is still your own code and can still be wrong. What it guarantees is that _every_ path into a dangerous sink now runs through a named policy you declared on purpose. The DOM XSS attack surface of the entire app collapses down to the handful of lines inside your policies. That is a security review you can finish in an afternoon instead of grepping 40,000 lines for `innerHTML`.

Also worth knowing before you start: Trusted Types only works in secure contexts, so HTTPS or `localhost`.

## Rolling it out without breaking production

Do not flip enforcement on first. Ship the report-only variant, let it run against real traffic, and collect what breaks:

```
Content-Security-Policy-Report-Only: require-trusted-types-for 'script'; report-uri /csp-reports
```

Violations arrive with the file, line, column, and a `script-sample` snippet of the offending value, which is usually enough to find the culprit immediately. If you'd rather not stand up a collector on day one, a `ReportingObserver` gets you the same data in the console:

```js
new ReportingObserver(
  (reports) => {
    for (const r of reports) {
      if (r.body.effectiveDirective === "require-trusted-types-for") {
        console.warn("Trusted Types violation:", r.body);
      }
    }
  },
  { buffered: true },
).observe();
```

Then work the list. Most violations have a boring fix — the code didn't need string HTML in the first place:

```js
// before
el.innerHTML = "<img src=xyz.jpg>";

// after
el.replaceChildren(
  Object.assign(document.createElement("img"), { src: "xyz.jpg" }),
);
```

Where you genuinely need to render untrusted HTML, reach for a sanitizer that already speaks the protocol. DOMPurify will hand back a `TrustedHTML` instead of a string if you ask:

```js
import DOMPurify from "dompurify";
el.innerHTML = DOMPurify.sanitize(html, { RETURN_TRUSTED_TYPE: true });
```

The escape hatch is a policy literally named `default`, which the browser applies to any string that reaches a sink without one. It's the right tool when a third-party script from a CDN is the thing violating and you can't patch it. Use it grudgingly — a default policy re-centralizes all your sanitization decisions in one function that has no idea what context it's being called from, which is most of the way back to where you started.

## Where this fits

Trusted Types and the [Sanitizer API](https://developer.mozilla.org/en-US/docs/Web/API/HTML_Sanitizer_API) solve adjacent halves of the same problem and pair well: the Sanitizer decides _what HTML is safe_, Trusted Types enforces _that something made that decision at all_. Neither replaces a strict, nonce-based CSP for the server-rendered side of XSS.

If you own an app that handles anything sensitive, the report-only header is close to free — one line of config, zero behavior change, and a list of exactly where your DOM XSS risk lives. Start there, and decide later whether to enforce.

Further reading: [MDN's Trusted Types API reference](https://developer.mozilla.org/en-US/docs/Web/API/Trusted_Types_API) and the [web.dev deep dive](https://web.dev/articles/trusted-types).
