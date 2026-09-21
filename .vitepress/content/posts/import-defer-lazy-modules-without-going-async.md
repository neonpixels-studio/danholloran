---
date: "2026-09-21T02:09:50.000-07:00"
tags: ["javascript", "performance", "tooling", "node"]
draft: false
title: "import defer: Lazy Modules Without Going Async"
image: "/images/posts/import-defer-lazy-modules-without-going-async.jpg"
topic: "development"
description: "ES2026's import defer evaluates a module the first time you touch its namespace, not at startup, so you can move heavy work off the cold path without turning half your call stack async."
---

Every codebase has that one import. A syntax highlighter, a PDF renderer, a date-formatting library with a locale table the size of a small novel. It sits at the top of a file, it gets evaluated the moment the module graph runs, and it is needed on exactly one code path that most users never hit.

The usual fix is `await import()`. It works, but it charges rent: the function that needed the module becomes async, and so does its caller, and its caller's caller. You wanted to move some work later in time, and instead you rewrote a call stack. `import defer` is the piece that was missing, and it is riding along with ES2026.

## Linked up front, evaluated on first touch

The syntax is a single keyword in one position:

```js
import defer * as ts from "typescript";

function compileFile(path) {
  // The typescript module graph evaluates here, on first property access.
  return ts.createProgram([path], {});
}
```

Nothing from `typescript` runs at startup. The module and its dependencies are still resolved, fetched, parsed, and linked, so a missing file or a bad named import still blows up immediately rather than lurking. What is deferred is evaluation: the top-level code only runs the first time you read a property off `ts`. If `compileFile` is never called, that graph never executes.

That distinction is the whole value proposition. `import()` defers everything, which is why it has to be async. `import defer` defers only the synchronous part that can safely be moved, so property access stays synchronous and nothing above it needs to change colour.

Only the namespace form works. There is no `import defer { createProgram } from "typescript"` and no default form, because the namespace object is the thing doing the work — evaluation is triggered by a property read, and a destructured binding has nothing left to intercept.

## The parts that will surprise you

The deferred namespace is effectively a proxy, and the list of operations that trip evaluation is broader than "read a property". Reading a key triggers it, but so does `"value" in ns`, `Object.keys(ns)`, a `for...in`, `Object.getOwnPropertyDescriptor`, and even `delete ns.value` or `Object.defineProperty` on it — the operation fails, since the namespace is sealed, but evaluation happens anyway. `Object.isSealed()` and `Object.isFrozen()` enumerate keys, so those count too.

Which also means this defeats the whole thing:

```js
import defer * as squares from "./squares.js";

const { getSquare } = squares; // evaluates immediately — you read a property
```

Three behaviours are worth committing to memory:

**Top-level `await` opts out.** Reading a property is synchronous, so it cannot wait on an async module. A module containing top-level `await` is evaluated eagerly, along with whatever its evaluation requires. The rest of the graph can still stay deferred, but do not assume `defer` bought you anything if the target awaits at the top level.

**Side effects move.** If a module installs a polyfill, registers a custom element, or patches a global, deferring it means that side effect now happens at an unpredictable moment, or never. Those modules should stay on a plain `import`.

**Evaluation errors are cached and synchronous.** If the deferred module throws while initializing, the throw comes out of whatever expression touched the namespace, catchable with a normal `try...catch`. Every later access rethrows the same error rather than retrying.

One more detail that saves a debugging session: the namespace deliberately does not expose an export named `then`, even after evaluation. Without that carve-out, handing the namespace to `Promise.resolve()` would look like a thenable and force evaluation as a side effect of promise resolution.

## Where you can actually use it

Tooling got there first, as usual. TypeScript has understood the syntax since 5.9, and Babel, webpack, and Prettier all handle it. Bun and Deno ship it enabled by default. In browsers, V8 has had it behind a flag with an Intent to Ship filed in September 2026, WebKit has it implemented, and Gecko has signalled support — so treat it as landing rather than landed, and check the compatibility table before you rely on it in production.

The honest use case today is server-side and CLI code, where Bun, Deno, and a bundler give you a straight path. Go find the heaviest module on your cold-start path that is only needed conditionally, swap the import, and measure. If it turns out the module has top-level `await`, or installs something on import, you have learned something useful about your dependency either way.
