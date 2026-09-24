---
date: "2026-09-24T02:14:48.000-07:00"
tags: ["javascript", "web-apis", "node", "performance"]
draft: false
title: "Uint8Array toBase64 and toHex: Stop Round-Tripping Bytes Through btoa"
image: "/images/posts/uint8array-tobase64-and-tohex-stop-round-tripping-bytes-through-btoa.jpg"
topic: "development"
description: "JavaScript can finally turn bytes into base64 and hex (and back) without the String.fromCharCode and btoa dance. Here's how Uint8Array's new encoding methods work and where they replace the helpers you've been copy-pasting."
---

Every codebase that touches binary data has the same little helper buried in a `utils` folder. It takes a `Uint8Array`, spreads it into `String.fromCharCode`, hands the result to `btoa`, and hopes for the best. Its sibling goes the other way with `atob` and a `charCodeAt` loop. And somewhere nearby there's a third helper that maps each byte to `toString(16).padStart(2, '0')` so you can print a hash.

None of those helpers are wrong, exactly. They're just working around the fact that `btoa` and `atob` were designed for strings, not bytes. That gap is now closed: `Uint8Array` has native methods for base64 and hex, in both directions, and they've been Baseline across current Chrome, Firefox, and Safari since September 2025.

## The new methods at a glance

There are six of them, split into three pairs:

- `bytes.toBase64(options)` and `Uint8Array.fromBase64(string, options)`
- `bytes.toHex()` and `Uint8Array.fromHex(string)`
- `target.setFromBase64(string, options)` and `target.setFromHex(string)` for writing into an existing buffer

Here's the old helper next to its replacement:

```js
// Before: works, but only by pretending bytes are Latin-1 characters
function bytesToBase64(bytes) {
  return btoa(String.fromCharCode(...bytes));
}

function base64ToBytes(b64) {
  return Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
}

// After
const b64 = bytes.toBase64();
const decoded = Uint8Array.fromBase64(b64);
```

The "after" version isn't just shorter. The spread in `String.fromCharCode(...bytes)` passes every byte as a separate function argument, so a large file can blow past the engine's argument limit and throw a `RangeError`. The native methods don't have that ceiling, and they skip the intermediate "binary string" entirely.

Hex gets the same treatment, which makes Web Crypto output a one-liner:

```js
async function sha256Hex(text) {
  const data = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return new Uint8Array(digest).toHex();
}

await sha256Hex("hello");
// '2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824'
```

`Uint8Array.fromHex()` goes the other direction and throws a `SyntaxError` on odd-length strings or non-hex characters, so you get validation for free instead of silently producing `NaN` bytes.

## base64url and padding without string surgery

Standard base64 uses `+` and `/`, which break in URLs and filenames. The usual fix is a chain of `.replace()` calls to swap in `-` and `_` and strip the trailing `=`. Now it's an option:

```js
const id = crypto.getRandomValues(new Uint8Array(16));

const token = id.toBase64({ alphabet: "base64url", omitPadding: true });
// e.g. 'q3N8y0Zp1VbX-7k2_JmR4g'
```

Decoding takes the same `alphabet` option. That makes peeking inside a JWT payload pleasantly boring, since JWT segments are base64url with the padding removed:

```js
function readJwtPayload(jwt) {
  const [, payload] = jwt.split(".");
  const bytes = Uint8Array.fromBase64(payload, { alphabet: "base64url" });
  return JSON.parse(new TextDecoder().decode(bytes));
}
```

That works because the default `lastChunkHandling` mode, `"loose"`, accepts a final chunk of two or three characters without padding. If you're validating input you don't control and want to reject anything non-canonical, pass `lastChunkHandling: 'strict'`: the last chunk must then be padded to four characters, and any leftover "overflow bits" must be zero. Decoding also ignores ASCII whitespace, so base64 that was wrapped across lines in a PEM file or an email decodes without a cleanup pass.

One more quiet win: because you're decoding to bytes, not to a string, there's no more `InvalidCharacterError` from feeding `btoa` a string with an emoji in it. Encode text with `TextEncoder` first, then call `toBase64()`, and UTF-8 just works.

## Decoding into memory you already have

The `setFrom*` methods write into an existing `Uint8Array` and return `{ read, written }` so you know how much input was consumed and how many bytes landed. That's handy when you're reusing a buffer or decoding base64 that arrives in pieces:

```js
const buffer = new Uint8Array(1024);
let offset = 0;
let pending = "";

function onChunk(text) {
  pending += text;
  const { read, written } = buffer
    .subarray(offset)
    .setFromBase64(pending, { lastChunkHandling: "stop-before-partial" });
  offset += written;
  pending = pending.slice(read);
}
```

With `"stop-before-partial"`, an incomplete trailing chunk is left alone instead of being decoded early or throwing, so the next network chunk can finish it. The `read` count tells you exactly where to resume.

## When to reach for them (and when not yet)

If your app targets current evergreen browsers, you can use these today and delete the helpers. On the server, check your runtime version before you rip out `Buffer.from(x, 'base64')`. Node's `Buffer` still works fine, but these methods give you one API that runs the same in the browser, Deno, Bun, and edge runtimes.

For older targets, feature-detect and fall back:

```js
const toBase64 =
  typeof Uint8Array.prototype.toBase64 === "function"
    ? (bytes) => bytes.toBase64()
    : (bytes) =>
        btoa(Array.from(bytes, (b) => String.fromCharCode(b)).join(""));
```

Or pull in a polyfill: `core-js` covers the full set, and the `es-arraybuffer-base64` shim does too.

The takeaway is small but satisfying: bytes can finally stay bytes. The next time you reach for `btoa`, check whether what you actually have is a `Uint8Array`. If it is, `toBase64()` is almost certainly the better call. The [MDN reference for `Uint8Array.fromBase64()`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Uint8Array/fromBase64) covers every option in detail, including the edge cases around padding and overflow bits.
