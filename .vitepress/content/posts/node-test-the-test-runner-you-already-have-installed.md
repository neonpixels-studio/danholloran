---
date: "2026-09-10T02:11:23.000-07:00"
tags: ["node", "testing", "tooling", "node.js"]
draft: false
title: "node --test: The Test Runner You Already Have Installed"
image: "/images/posts/node-test-the-test-runner-you-already-have-installed.jpg"
topic: "development"
description: "Node's built-in test runner has been stable since v20 and now handles mocking, coverage, watch mode, and TypeScript files. Here's what it does well and where it still falls short."
---

Every new Node library starts the same way. `npm init`, write two functions, and then spend twenty minutes deciding between Vitest and Jest for a package that has no browser code, no JSX, and no transform pipeline worth speaking of. You install a test framework, a config file, and a transitive dependency tree that dwarfs the thing you're actually testing.

Node has shipped a test runner since v18. It went stable in v20. Most of us kept reaching for the npm install anyway, mostly out of habit, partly because the early version really was thin. That's no longer a fair read of it. The 2026 version has mocking, fake timers, watch mode, coverage output, global setup hooks, and it runs your `.ts` files without a build step. For a backend library, it's frequently enough.

## What you get for zero dependencies

Run `node --test` in a project with no arguments and it walks the tree looking for files matching a fixed set of patterns: `**/*.test.js`, `**/*-test.js`, `**/*_test.js`, `**/test-*.js`, `**/test.js`, and anything under a `**/test/` directory. The `.cjs` and `.mjs` variants are included too. So are the TypeScript equivalents (`.ts`, `.cts`, `.mts`), unless you pass `--no-strip-types`.

That last part matters more than it sounds. You can write this and run it directly:

```ts
import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { parseDuration } from "./duration.ts";

describe("parseDuration", () => {
  it("handles compound units", () => {
    assert.equal(parseDuration("1h30m"), 5_400_000);
  });

  it("throws on garbage", () => {
    assert.throws(() => parseDuration("soon"), /invalid duration/);
  });
});
```

No `ts-node`, no `tsx`, no build step. Node strips the type annotations and runs the result. The important caveat: it strips, it does not check. You still need `tsc --noEmit` in CI if you want type errors to fail the build. Type stripping is an execution strategy, not a type checker.

By default each test file runs in its own child process, which gives you real isolation between files without any config. The programmatic `run()` API exposes this as `isolation: 'process' | 'none'` if you need to flip it.

## The subtest gotcha that catches everyone

This is the one thing worth internalizing before you migrate anything. Tests created inside a bare `test()` do not wait for their subtests. Suites do.

```js
// Broken: the parent finishes before the subtest resolves,
// and the outstanding subtest is cancelled and marked as a failure.
test("user flow", async (t) => {
  t.test("creates the user", async () => {
    await createUser();
  });
});

// Correct: await each subtest.
test("user flow", async (t) => {
  await t.test("creates the user", async () => {
    await createUser();
  });
});
```

Inside `describe()`, siblings are enqueued together and you don't need the `await`. If you're coming from Jest or Vitest, where nesting always just works, this asymmetry will bite you exactly once and then never again. `describe`/`it` is an alias pair for `suite`/`test`, so picking the suite style sidesteps the problem entirely.

## Mocking and fake timers are already there

The part people most often assume is missing. `mock.fn()` gives you a spy with call metadata, and `t.mock.method()` patches an object method and auto-restores it when the test ends, which is the behavior you want and rarely get for free.

```js
test("retries on failure", async (t) => {
  t.mock.timers.enable({ apis: ["setTimeout"] });

  const fetchSpy = t.mock.method(client, "fetch");
  fetchSpy.mock.mockImplementationOnce(() => Promise.reject(new Error("503")));

  const result = withRetry(() => client.fetch("/health"));
  t.mock.timers.tick(1000);

  await result;
  assert.equal(fetchSpy.mock.callCount(), 2);
});
```

One sharp edge on timers: destructured imports like `import { setTimeout } from 'node:timers'` are not mockable. Reference the timer functions off the global or the module namespace and it works.

## Where it still isn't Vitest

Coverage is real but still behind `--experimental-test-coverage`. It works, and the lcov reporter plugs straight into Codecov or SonarQube:

```bash
node --test --experimental-test-coverage \
  --test-reporter=lcov --test-reporter-destination=lcov.info
```

Note that the lcov reporter emits no human-readable results, so pair it with a second reporter in CI. Global setup and teardown landed in v24 via `--test-global-setup <path>`, pointing at a module that exports `globalSetup` and `globalTeardown` functions, but it's still marked early development. `--watch` is likewise experimental.

And there's no JSDOM, no browser mode, no snapshot ecosystem to speak of, no plugin API. If you're testing React components, keep Vitest.

The honest heuristic: for a server-side library, a CLI, or anything where the test story is "call a function, assert on the result," `node --test` is probably enough, and every dependency you don't add is one you don't have to audit later. Start with the built-in runner and let the project tell you when it's outgrown it.
