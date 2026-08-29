---
date: "2026-08-27T02:07:16.000-05:00"
tags: ["javascript", "web-apis", "performance"]
draft: false
title: "The Web Locks API: One Tab Does the Work, the Rest Wait"
image: "/images/posts/the-web-locks-api-one-tab-does-the-work.jpg"
topic: "development"
description: "Your app already runs in five tabs at once, and they all think they are in charge. The Web Locks API gives the browser a real mutex so only one of them does the work."
---

A user opens your dashboard, then opens it again in a second tab, then leaves a third one parked on another monitor from yesterday. Their access token expires. All three tabs notice at roughly the same instant, and all three fire a refresh request against your auth endpoint. Two of them get back a rotated refresh token that the third has already invalidated, and now the user is staring at a login screen they did nothing to deserve.

The usual fix is a pile of `localStorage` flags with timestamps, a `BroadcastChannel` message, and a comment that says `// TODO: this is racy`. It is racy. `localStorage` has no atomic compare-and-set, so two tabs can read "no refresh in progress" in the same tick and both write "refresh in progress." What you actually want is a mutex, and the browser has shipped one since March 2022. It is called the Web Locks API, it is Baseline Widely available, and almost nobody reaches for it.

## navigator.locks.request is the whole API

There is one method that matters. You give it a name, a callback, and the browser guarantees that no other code on the same origin — any tab, any iframe, any worker — runs inside a lock with that name at the same time.

```js
await navigator.locks.request("token-refresh", async () => {
  const stored = readToken();
  if (!isExpired(stored)) return stored; // someone else already did it

  const fresh = await fetch("/auth/refresh", { method: "POST" }).then((r) =>
    r.json(),
  );
  writeToken(fresh);
  return fresh;
});
```

The lock is held for exactly as long as the callback's promise is pending, and it is released when the callback returns or throws. There is no `unlock()` to forget, and there is no leaked lock if your fetch rejects. That alone makes it safer than any flag-in-storage scheme you would write by hand.

The re-check inside the callback is the part people skip. Three tabs queue on `'token-refresh'`. The first one does the network round trip. The second and third get the lock afterward, see a token that is no longer expired, and return immediately. One request, three happy tabs.

## Shared locks, and not waiting at all

`request()` takes an options object, and two of the options carry most of the value.

`mode: 'shared'` gives you the readers-writer pattern. Any number of shared holders can hold the same name at once, but an exclusive holder blocks all of them. This is the same semantics IndexedDB uses for `readonly` versus `readwrite` transactions, and it is the right shape when many tabs read a cached dataset while one occasionally rewrites it.

```js
// Many of these can run concurrently.
navigator.locks.request("catalog", { mode: "shared" }, async () => {
  return readCatalogFromIDB();
});

// This one waits for every reader to finish, then blocks new ones.
navigator.locks.request("catalog", { mode: "exclusive" }, async () => {
  await rewriteCatalogFromIDB(await fetchCatalog());
});
```

`ifAvailable: true` flips the behavior from "wait your turn" to "tell me no." The callback still runs, but it receives `null` instead of a `Lock` when the lock was already held. That is the leader-election primitive: whichever tab gets the lock becomes the one that owns the WebSocket, or the polling interval, or the background sync, and the others quietly stand down.

```js
navigator.locks.request("sync-leader", { ifAvailable: true }, async (lock) => {
  if (!lock) return; // another tab is the leader

  await new Promise(() => {}); // hold it for the lifetime of this tab
});
```

That never-resolving promise looks alarming and is actually the idiom. The lock is held until the tab closes or navigates, at which point the browser releases it and a queued tab is promoted automatically. You get failover for free.

There is also `signal`, which takes an `AbortSignal` so you can give up after 200ms instead of queueing forever, and `steal: true`, which forcibly releases whoever holds the lock. Treat `steal` as a recovery tool for a wedged tab, not a normal control flow — the stolen-from code keeps running and has no idea it lost the lock. Note that `signal` cannot be combined with `steal` or `ifAvailable`; the request rejects with a `NotSupportedError` if you try.

## The edges worth knowing

Locks are scoped per origin and require a secure context, so `https://` or `localhost` only. They do not survive a reload — every lock a document holds is released when that document goes away, which is the behavior you want but also means a lock is never a durable record of anything. Store the actual state in IndexedDB and use the lock only to serialize who writes it.

Deadlock is still your problem. If tab A holds `a` and waits on `b` while tab B does the reverse, they both wait forever. Acquire locks in a consistent order, keep the critical section short, and avoid nesting `request()` calls when you can flatten them.

For debugging, `navigator.locks.query()` returns `{ held, pending }` arrays with the name, mode, and a `clientId` for each. Logging that when something feels stuck is usually faster than reasoning about it.

If your app has any of the classic multi-tab bugs — duplicated token refreshes, four WebSockets where you wanted one, an IndexedDB migration that runs twice — this is a smaller fix than the workaround you are currently maintaining. [MDN's LockManager reference](https://developer.mozilla.org/en-US/docs/Web/API/LockManager/request) covers every option in a page you can read in five minutes.
