---
date: '2026-05-30T07:02:07.000+00:00'
tags: ['javascript', 'typescript', 'tooling']
draft: true
title: "JavaScript's using Keyword: Automatic Resource Cleanup in ES2026"
image: '/images/posts/javascript-using-explicit-resource-management-es2026.jpg'
topic: 'JavaScript'
description: "ES2026 introduces the using and await using keywords for automatic resource cleanup — no more forgetting to close that database connection or file handle in a finally block."
---

If you've ever opened a database connection, grabbed a file handle, or spun up a worker — and then watched your `try...finally` block balloon into something that felt more like scaffolding than real code — you know the problem. JavaScript has never had a clean built-in way to say "when this block is done, clean *that* up." Until now.

ES2026 finalizes **Explicit Resource Management**, a new language feature that adds `using` and `await using` declarations. They let you bind a resource's lifecycle to a block scope, so cleanup happens automatically no matter how the block exits — whether through normal return, an exception, or an early break.

## The Problem with try...finally

Consider reading from a file in Node.js:

```js
import { open } from 'node:fs/promises';

async function readConfig(path) {
  const file = await open(path, 'r');
  try {
    const content = await file.readFile({ encoding: 'utf8' });
    return JSON.parse(content);
  } finally {
    await file.close(); // easy to forget, ugly to maintain
  }
}
```

This works, but the `try...finally` pattern is noise — especially when you're managing multiple resources at once. Stack them, and you end up with nested blocks or a tangle of cleanup logic that has nothing to do with your actual business logic.

## Introducing using and await using

Any object that implements `[Symbol.dispose]()` (sync) or `[Symbol.asyncDispose]()` (async) can be used with the new declarations. When the surrounding block exits, JavaScript automatically calls the dispose method — no `finally` required.

Here's the file example rewritten:

```js
import { open } from 'node:fs/promises';

function makeDisposableFile(file) {
  return {
    file,
    [Symbol.asyncDispose]() {
      return file.close();
    },
  };
}

async function readConfig(path) {
  await using handle = makeDisposableFile(await open(path, 'r'));
  const content = await handle.file.readFile({ encoding: 'utf8' });
  return JSON.parse(content); // file.close() runs automatically here
}
```

The `await` in `await using` doesn't pause at declaration time — it tells JavaScript to *await* the async disposal when the block exits. If an exception is thrown before the block ends, disposal still runs.

For synchronous resources, drop the `await`:

```js
function getDbConnection() {
  const conn = openDbSync();
  return {
    conn,
    [Symbol.dispose]() {
      conn.close();
    },
  };
}

function getUserCount() {
  using db = getDbConnection();
  return db.conn.query('SELECT COUNT(*) FROM users')[0];
  // conn.close() runs here, even if query throws
}
```

## Managing Multiple Resources with DisposableStack

When you need to acquire several resources in sequence, `DisposableStack` (sync) and `AsyncDisposableStack` (async) give you a container to register them all. They dispose in LIFO order — last acquired, first released — which matches the natural dependency order of most resource chains.

```js
async function processJob(jobId) {
  await using stack = new AsyncDisposableStack();

  const db = stack.use(await openDbConnection());
  const lock = stack.use(await acquireLock(`job:${jobId}`));
  const logger = stack.use(await openLogStream(jobId));

  logger.write(`Starting job ${jobId}`);
  const data = await db.query(`SELECT * FROM jobs WHERE id = ?`, [jobId]);
  await processData(data, logger);

  // On exit: logger closes, then lock releases, then db closes
}
```

`stack.use()` registers a disposable and returns it. If acquiring a later resource throws, only the resources already registered get cleaned up — no leaks, no manual rollback logic.

## Support and Tooling

TypeScript has supported `using` and `await using` since version 5.2 — you can use it today if you're on a recent TS setup. On the runtime side, Node.js 22+ supports it natively, and Chrome 123+ and Firefox 119+ ship it without flags. For older targets, Vite, esbuild, and webpack all transpile it correctly.

The real payoff isn't just fewer lines of code — it's that resource cleanup becomes impossible to accidentally skip. Libraries are already starting to ship `[Symbol.dispose]`-compatible handles (the Node.js `FileHandle` from `fs/promises` being one example), and the pattern will only become more common as the ecosystem catches up.

If you're building anything that touches files, connections, locks, or streams, this is worth adding to your toolkit now. Check out the [V8 explainer](https://v8.dev/features/explicit-resource-management) and the [TC39 proposal repo](https://github.com/tc39/proposal-explicit-resource-management) for the full spec details.
