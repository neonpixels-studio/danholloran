---
date: "2026-09-27T02:15:39.000-07:00"
tags: ["web-performance", "performance", "web-apis", "tooling"]
draft: false
title: "Compression Dictionaries: Ship Only the Diff When Your Bundle Changes"
image: "/images/posts/compression-dictionaries-ship-only-the-diff-when-your-bundle-changes.jpg"
topic: "development"
description: "Compression Dictionary Transport (RFC 9842) lets the browser tell your server which cached file it already has, so a redeployed bundle can arrive as a few-kilobyte delta instead of a full download."
---

You ship a one-line bug fix. Your bundler dutifully produces `app.8f3c1a.js`, a brand new filename, and every returning visitor downloads the whole 270 KB file again. The browser already has 99% of those bytes sitting in its cache under the old hash, but HTTP compression has no way to say "you already know most of this." Gzip and Brotli compress each response in isolation, so a tiny code change costs a full re-download.

Compression Dictionary Transport fixes exactly that. It became a real standard as [RFC 9842](https://datatracker.ietf.org/doc/rfc9842/) in September 2025, it ships in Chrome and Edge 130+, and Cloudflare opened a beta for it in April 2026. The idea is simple: let the browser tell the server which previous response it has cached, and let the server compress the new response against it. For versioned JavaScript, the result is often a delta measured in single-digit kilobytes.

## How the handshake works

There are three moving parts: a response that volunteers to be a dictionary, a request that advertises which dictionary is available, and a response compressed with it.

First, the server marks a resource as reusable with the `Use-As-Dictionary` header. The `match` value is a URL pattern describing which future requests this file can help with:

```http
HTTP/1.1 200 OK
Content-Type: text/javascript
Cache-Control: public, max-age=31536000
Use-As-Dictionary: match="/js/app.*.js", id="app-v1"
```

The browser stores that response as a dictionary. The next time it requests something matching `/js/app.*.js`, say after you deploy `app.2d9e44.js`, it adds two things to the request: new encodings in `Accept-Encoding`, and the SHA-256 hash of the dictionary it holds.

```http
GET /js/app.2d9e44.js HTTP/1.1
Accept-Encoding: gzip, br, zstd, dcb, dcz
Available-Dictionary: :pZGm1Av0IEBKARczz7exkNYsZb8LzaMrV7J32a2fFG4=:
Dictionary-ID: "app-v1"
```

`dcb` is dictionary-compressed Brotli and `dcz` is dictionary-compressed Zstandard. If the server has a delta prepared for that exact hash, it responds with one of them:

```http
HTTP/1.1 200 OK
Content-Encoding: dcz
Vary: accept-encoding, available-dictionary
```

The `Vary` header is not optional. Without it, a CDN could happily serve a dictionary-compressed body to a client that never had the dictionary, and that client gets garbage. Also note that `Dictionary-ID` is a convenience label; the server must still verify the `Available-Dictionary` hash before trusting that the client has the bytes it thinks it has.

## Building the deltas at deploy time

The practical pattern for static assets is to precompress at build time. For every new bundle, compress it against the previous release's version of the same file and store the result next to it. The Zstandard and Brotli CLIs both accept a dictionary:

```bash
# previous release is the dictionary, new build is the payload
zstd -19 --patch-from=dist-prev/app.8f3c1a.js dist/app.2d9e44.js -o dist/app.2d9e44.js.dcz-raw

# the hash the browser will send in Available-Dictionary
openssl dgst -sha256 -binary dist-prev/app.8f3c1a.js | base64
```

The `dcz` and `dcb` formats wrap the compressed stream with a short header that embeds the dictionary hash, so the browser can confirm it decoded against the right file. Tooling like Cloudflare's implementation handles that framing for you; if you roll your own, follow the RFC's format section rather than guessing.

On the server, the logic is a lookup: does a delta exist for this path and this dictionary hash? If yes, serve it. If no, fall back to normal Brotli.

```js
import { createReadStream, existsSync } from "node:fs";

app.get("/js/:file", (req, res, next) => {
  const hash = req.get("available-dictionary")?.slice(1, -1); // strip the colons
  const accepts = req.get("accept-encoding") ?? "";
  const delta = hash && deltaIndex.get(`${req.params.file}:${hash}`);

  res.vary("Accept-Encoding").vary("Available-Dictionary");
  res.set("Use-As-Dictionary", 'match="/js/app.*.js", id="app"');

  if (delta && accepts.includes("dcz") && existsSync(delta)) {
    res.set({ "Content-Encoding": "dcz", "Content-Type": "text/javascript" });
    return createReadStream(delta).pipe(res);
  }
  next(); // regular static handler serves br/gzip
});
```

Notice the new file also sends `Use-As-Dictionary`. Each release becomes the dictionary for the next one, so a returning visitor keeps getting deltas across deploys instead of just one.

How big is the win? In Cloudflare's lab test, a 272 KB JavaScript asset was 92.2 KB with gzip. Compressed against its previous version with `dcz`, it came out at 2.6 KB. Your numbers depend entirely on how much actually changed between builds, but for frequent small deploys that ratio is the whole point.

## Shared dictionaries for first visits

Deltas only help returning visitors. For first loads, you can ship a separate dictionary built from content common across your pages, like your HTML boilerplate or shared component markup, and hint it to the browser at idle priority:

```html
<link rel="compression-dictionary" href="/dictionary.dat" />
```

Or with a response header: `Link: </dictionary.dat>; rel="compression-dictionary"`. The browser downloads it in the background, and later page navigations can be compressed against it.

## The fine print

A few rules will bite you if you skip them. Dictionaries must be same-origin with the resources they compress, and dictionary-compressed responses must be same-origin with the document or served with proper CORS. If you use `<link rel="compression-dictionary">` with a Content Security Policy, `connect-src` has to allow the dictionary URL. Only secure contexts participate.

Browser support is the bigger caveat. Chromium browsers support it today, Firefox has an active implementation bug, and Safari has not announced support. That is fine, because the design degrades gracefully: browsers that don't send `dcb` or `dcz` in `Accept-Encoding` never see a dictionary response and just get your normal Brotli. You are adding a fast path, not a dependency.

If you deploy often and your users come back often, this is one of the rare performance wins that gets bigger the more you ship. Start with your largest versioned JavaScript bundle, precompress one delta per release, and measure transfer size in DevTools on a repeat visit. The [MDN guide to compression dictionary transport](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Compression_dictionary_transport) and the [Chrome team's write-up](https://developer.chrome.com/blog/shared-dictionary-compression) cover the remaining details.
