---
date: "2026-11-12T02:16:16.000-08:00"
tags: ["node", "javascript", "tooling", "node.js"]
draft: false
title: "node:sqlite: The Database That Already Ships With Node"
image: "/images/posts/node-sqlite-the-database-that-already-ships-with-node.jpg"
topic: "development"
description: "Node has a built-in SQLite module. Here's how node:sqlite works, where its synchronous API fits, and what changed in Node 26 before reaching for better-sqlite3."
---

Every small Node project hits the same fork in the road. You need to persist something: a queue of jobs, a cache of API responses, the bookmarks for a CLI tool. A JSON file feels too fragile, Postgres feels like too much, and SQLite feels right until you remember it means a native addon, a `node-gyp` build, and a CI image that suddenly needs Python and a C++ toolchain.

That last part is no longer true. Node ships SQLite in the box as `node:sqlite`. It landed in v22.5.0 behind a flag, dropped the flag in v22.13.0 and v23.4.0, and was promoted to **release candidate** (stability 1.2) in v25.7.0. With Node 26 now in Active LTS, it is a reasonable default for the "I just need a local database" problem.

## The whole API fits in your head

There is no connection pool, no promise wrapper, and no ORM. You open a database, prepare statements, and run them:

```js
import { DatabaseSync } from "node:sqlite";

const db = new DatabaseSync("app.db", { timeout: 5000 });

db.exec(`
  PRAGMA journal_mode = WAL;
  CREATE TABLE IF NOT EXISTS bookmarks (
    id INTEGER PRIMARY KEY,
    url TEXT NOT NULL UNIQUE,
    title TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  ) STRICT;
`);

const insert = db.prepare(
  "INSERT INTO bookmarks (url, title) VALUES (:url, :title)",
);

const { changes, lastInsertRowid } = insert.run({
  url: "https://nodejs.org/api/sqlite.html",
  title: "node:sqlite docs",
});

const recent = db.prepare(
  "SELECT id, url, title FROM bookmarks ORDER BY id DESC LIMIT ?",
);
console.log(recent.all(10));
```

A few things worth noticing. `run()` returns `changes` and `lastInsertRowid`, `get()` returns the first row, `all()` returns an array, and `iterate()` gives you an iterator for large result sets. Named parameters can be passed without their prefix (`url` instead of `:url`) because `allowBareNamedParameters` defaults to `true`. The `timeout` option (added in v24.0.0) sets SQLite's busy timeout, so a second process holding a write lock makes you wait instead of throwing `SQLITE_BUSY` immediately.

The defaults are also stricter than raw SQLite in useful ways: foreign key constraints are **on**, double-quoted string literals are **off**, and since v25.5.0 and v24.14.0 the `defensive` flag is enabled, which blocks SQL tricks that can deliberately corrupt the database file.

## Transactions and tagged templates

There is no `db.transaction()` helper like better-sqlite3 has, so you write the three statements yourself. Because the API is synchronous, nothing else can interleave between `BEGIN` and `COMMIT` on this connection:

```js
function importBookmarks(rows) {
  db.exec("BEGIN");
  try {
    for (const row of rows) insert.run(row);
    db.exec("COMMIT");
  } catch (err) {
    db.exec("ROLLBACK");
    throw err;
  }
}
```

If one row violates the `UNIQUE` constraint, the whole batch rolls back and you get an error with code `ERR_SQLITE_ERROR`. There is also a `db.isTransaction` getter if you need to check where you are.

The nicer addition is `createTagStore()`, available since v24.9.0. It gives you tagged template literals that are backed by an LRU cache of prepared statements (1,000 by default):

```js
const sql = db.createTagStore();

const url = "https://nodejs.org/api/sqlite.html";
const row = sql.get`SELECT * FROM bookmarks WHERE url = ${url}`;
const all = sql.all`SELECT * FROM bookmarks ORDER BY id`;
```

Interpolated values are **bound as parameters**, not spliced into the SQL, so this is safe from injection. The catch: it only works with the tag. Write ``db.exec(`... ${url}`)`` with a plain template string and you are back to string concatenation.

## What changed in Node 26, and the type gotchas

As of v26.11.0, the classes were renamed: `DatabaseSync` is now `Database` and `StatementSync` is now `Statement`. The old names remain as deprecated aliases (DEP0210 and DEP0211), so the code above runs on Node 22, 24, and 26. If you only target Node 26.11 or later, import `Database` instead. On Node 22 you will also still see an `ExperimentalWarning` printed at startup.

Two type conversions bite people:

- **Big integers.** `INTEGER` columns come back as JavaScript numbers. If a value falls outside `Number.MAX_SAFE_INTEGER`, Node throws `ERR_OUT_OF_RANGE` rather than silently losing precision. Pass `readBigInts: true` to the constructor, or call `statement.setReadBigInts(true)`, when you store snowflake IDs or similar.
- **Booleans and blobs.** `true` and `false` are written as `1` and `0` and read back as numbers. Blobs come back as `Uint8Array`, not `Buffer`.

Rows are also returned as null-prototype objects, which matters if anything downstream relies on `row.hasOwnProperty()`.

## When not to use it

Every call is synchronous and runs on the main thread. For a CLI, a build script, a test fixture, an Electron app, or a low-traffic internal service, that is a feature: no `await` noise and very predictable behavior. For a busy HTTP server, a slow query blocks every other request, so keep queries indexed and small, move heavy work into a worker thread, or use a real client/server database.

And if you depend on better-sqlite3's extras, such as its transaction helper, check what you would be giving up before ripping it out. The win from `node:sqlite` is mostly operational: one fewer native dependency to compile, cache, and patch.

If you have been reaching for a JSON file because SQLite felt like too much setup, try `node:sqlite` on your next script. The [official docs](https://nodejs.org/api/sqlite.html) cover the rest, including user-defined functions, session changesets, and `sqlite.backup()`.
