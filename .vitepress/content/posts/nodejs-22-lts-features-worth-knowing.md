---
created_at: "2026-04-05T12:15:00.000-08:00"
tags: ["javascript", "tooling", "node"]
draft: false
title: "Node.js 22 LTS: The Features Worth Knowing About"
image: "/images/posts/nodejs-22-lts-features-worth-knowing.jpg"
topic: "development"
description: "Node.js 22 became the active LTS in October 2024, bringing a native test runner, built-in watch mode, require() for ES modules, and much more. Here's what's useful in practice."
---

Node.js 22 entered Long Term Support (LTS) in October 2024 under the codename "Jod." If you're still on Node 18 or 20 for production workloads, now is a good time to start planning the upgrade. The release includes a set of built-in features that reduce reliance on external tools, which is a theme that's been building across recent Node versions.

## require() for ES Modules (Behind a Flag, Then Stable)

One of the longest-standing pain points in Node.js has been the hard boundary between CommonJS and ES modules. In Node.js 22, `require()` can now load synchronous ES modules — with `--experimental-require-module` flag in v22, becoming stable in v22's later patches:

```js
// main.cjs — a CommonJS file
const { greet } = require("./utils.mjs"); // Previously impossible
console.log(greet("world"));

// utils.mjs — an ES module
export function greet(name) {
  return `Hello, ${name}!`;
}
```

This doesn't cover dynamic `import()` inside ES modules (that was already possible), but it means CommonJS packages can now depend directly on ESM-only packages without the `import()` async wrapper that was previously required. For library authors who've been stuck supporting both formats, this changes the calculus.

## Built-in Watch Mode

Node.js 22 stabilizes the `--watch` flag, which restarts the process whenever a watched file changes. For most development server use cases, this replaces `nodemon`:

```bash
# Restarts when any required file changes
node --watch server.js

# Watch specific files or patterns
node --watch-path=./src server.js
```

```json
{
  "scripts": {
    "dev": "node --watch src/index.js",
    "dev:ts": "node --watch --loader ts-node/esm src/index.ts"
  }
}
```

It's not as feature-rich as `nodemon` (no delay option, no exec for non-Node commands), but for the common case of a Node.js server that needs restarting on file changes, it's one fewer dependency.

## The Native Test Runner Is Production-Ready

The `node:test` module, which has been maturing since Node 18, is genuinely usable in Node 22. It supports the patterns you'd expect:

```js
import { describe, it, before, after, mock } from "node:test";
import assert from "node:assert/strict";
import { createUser } from "./users.js";

describe("createUser", () => {
  it("creates a user with the given name", async () => {
    const user = await createUser({ name: "Dan", email: "dan@example.com" });
    assert.equal(user.name, "Dan");
    assert.ok(user.id);
  });

  it("throws on duplicate email", async () => {
    await assert.rejects(
      () => createUser({ name: "Dan", email: "dan@example.com" }),
      { message: /duplicate/i },
    );
  });
});
```

```bash
# Run with built-in coverage
node --test --experimental-test-coverage src/**/*.test.js

# Watch mode for tests
node --test --watch src/**/*.test.js
```

For projects that don't need Jest's DOM testing features or Vitest's Vite integration, `node:test` is a viable zero-dependency option.

## WebSocket Client in Node Core

Node.js 22 adds an undici-backed `WebSocket` class that matches the browser Web API. No more `ws` package just for WebSocket client connections:

```js
// Works in Node.js 22 without any npm packages
const ws = new WebSocket("wss://api.example.com/events");

ws.onopen = () => {
  ws.send(JSON.stringify({ type: "subscribe", channel: "updates" }));
};

ws.onmessage = ({ data }) => {
  const event = JSON.parse(data);
  handleEvent(event);
};
```

The implementation is the same Web-standard `WebSocket` interface that browsers expose, which makes client code portable between environments.

Node.js 22 LTS is a solid release. The built-in test runner, watch mode, and `require()` for ES modules collectively reduce the tool surface area for many projects. Upgrading is worth it.
