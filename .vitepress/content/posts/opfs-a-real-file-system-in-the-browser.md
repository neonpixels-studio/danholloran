---
date: "2026-07-12T02:07:51.000-05:00"
tags: ["javascript", "web-apis", "performance"]
draft: false
title: "OPFS: A Real File System in the Browser"
image: "/images/posts/opfs-a-real-file-system-in-the-browser.jpg"
topic: "development"
description: "The Origin Private File System gives you byte-level, synchronous file I/O in the browser. Here's how it works, when to reach for it, and why it's the reason SQLite runs well on the web now."
---

Every browser storage API asks you to give something up. `localStorage` is synchronous but strings-only and capped at a few megabytes. IndexedDB will hold structured data and blobs, but its API is a transactional maze and you can't read the middle of a file without pulling the whole thing into memory. The File System Access API can touch real files on disk, but it needs a user gesture, a picker dialog, and a permission grant every session, and Safari on iOS won't give you the picker at all.

The Origin Private File System is the one that doesn't make you choose. It's a private, sandboxed file system scoped to your origin, invisible to the user, with no permission prompt. It gives you directories, files, seekable reads and writes, and, in a Web Worker, a fully synchronous handle you can write to byte by byte. Chrome and Edge have shipped it since 86, Firefox since 111, and Safari since 15.2, so it's available across every modern engine, desktop and mobile.

## Getting a handle

The entry point is one call. `navigator.storage.getDirectory()` hands you a `FileSystemDirectoryHandle` for the root of your origin's private file system, and from there you walk the tree.

```js
const root = await navigator.storage.getDirectory();
const cacheDir = await root.getDirectoryHandle("cache", { create: true });
const fileHandle = await cacheDir.getFileHandle("report.bin", { create: true });

// Write
const writable = await fileHandle.createWritable();
await writable.write(new Uint8Array([1, 2, 3]));
await writable.close();

// Read
const file = await fileHandle.getFile();
console.log(await file.arrayBuffer());
```

That's the main-thread API, and it's async all the way down. Note the `create: true` flag: without it, a missing file or directory throws `NotFoundError` instead of being created. Deleting is `await root.removeEntry('cache', { recursive: true })`. There is no picker, no prompt, and nothing appears in the user's Downloads folder. The data lives in an opaque, browser-managed location, which is exactly why it can skip the security checks that make the File System Access API slow.

## The synchronous access handle is the whole point

The async API is fine, but it's not what makes OPFS interesting. Inside a Web Worker (and only inside a Web Worker), you can call `createSyncAccessHandle()` and get back an object whose `read`, `write`, `truncate`, and `flush` methods are all synchronous and take a byte offset.

```js
// worker.js
const root = await navigator.storage.getDirectory();
const handle = await root.getFileHandle("db.sqlite", { create: true });
const access = await handle.createSyncAccessHandle();

const buf = new Uint8Array(4096);
access.read(buf, { at: 8192 }); // seek + read, no promise
access.write(buf, { at: 8192 }); // in-place write
access.flush();
access.close();
```

No promises, no structured clone, no copying the whole file to mutate four bytes. That is what a database engine actually needs, and it's why this API exists. The browser enforces an exclusive lock while a sync access handle is open, so a second call on the same file throws until you `close()` it. Getting the handle is still async even though using it is not, which is a small wrinkle worth knowing when you're porting code that assumes an entirely synchronous file layer.

## Why SQLite in the browser suddenly works

The clearest payoff is SQLite compiled to WebAssembly. SQLite's VFS layer wants exactly this: seekable, in-place, synchronous reads and writes with real locking. Before OPFS, browser builds faked persistence by serializing the whole database into IndexedDB, which meant a multi-megabyte round trip for a one-row update. With an OPFS-backed VFS, a write touches the pages it touches, and nothing else.

The architecture that works is to put the whole engine in a Worker. The Worker owns the OPFS handles and the SQLite instance; the main thread sends queries over `postMessage` and renders results. Your UI stays at 60fps no matter how much the database is grinding. Two things will bite you here. First, the official `sqlite-wasm` OPFS VFS uses `SharedArrayBuffer` for concurrent access, which means your server must send `Cross-Origin-Opener-Policy: same-origin` and `Cross-Origin-Embedder-Policy: require-corp`, and those headers will break any third-party embed that isn't CORS-configured. Second, concurrency is real but limited: keep transactions short and handle `SQLITE_BUSY` properly, and the current builds hold up under roughly eight to ten concurrent workers. Treat that as a ceiling, not a target.

## When not to reach for it

OPFS is not a replacement for `localStorage` when you want to remember a theme preference. It's not user-visible, so it's the wrong tool if the point is to hand someone a file they'll open in another app; that's still the File System Access API or a plain download. And it isn't guaranteed to survive: it lives under the browser's storage quota and can be evicted under pressure unless you call `navigator.storage.persist()` and the browser agrees.

What it is good at is everything with the word "large" or "binary" in it. Video editors staging footage, a local-first app running a real database, a WASM toolchain that expects a POSIX-ish file layer, an offline map tile cache. If you've been avoiding a feature because the browser had nowhere sane to put the bytes, that constraint is gone. Start with [MDN's OPFS page](https://developer.mozilla.org/en-US/docs/Web/API/File_System_API/Origin_private_file_system), then spend an afternoon with a Worker and a sync access handle. It feels less like a browser API and less like a compromise than anything else in the storage lineup.
