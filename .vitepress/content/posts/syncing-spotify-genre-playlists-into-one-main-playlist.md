---
date: "2026-11-28T09:00:00.000-08:00"
tags: ["javascript", "node", "web-apis", "tooling", "spotify"]
draft: false
title: "Syncing Spotify Genre Playlists Into One Main Playlist"
image: "/images/posts/syncing-spotify-genre-playlists-into-one-main-playlist.jpg"
topic: "development"
description: "A zero-dependency Node script that keeps one Spotify playlist equal to the union of my genre playlists, feeds edits back, and refuses to empty itself."
---

I keep my music in genre playlists: shoegaze in one, dub in another, and so on. That works when I want one mood. It falls apart when I want everything I'm currently into, and it does nothing for Liked Songs, which I treat as an all-time archive.

What I wanted was simple to state. Add a track to any genre playlist, and it should also show up in a main playlist and in Liked Songs. Remove it from the genre playlist, and it should leave the main playlist but stay in Liked Songs forever. Spotify has no "this playlist is the union of those playlists" feature, and adding everything twice by hand drifts fast. So I wrote [spotify-sync](https://github.com/grimicorn/spotify-sync): about 500 lines of Node, zero dependencies, run by `launchd` every 15 minutes.

## The main playlist is derived

The core idea is that I don't really own the main playlist's contents. Every run recomputes it as `union(sources)`, then diffs the current playlist against that and applies only the difference. A diff instead of a full replace keeps the order of tracks that stay, and it keeps their `added_at` dates, so "recently added" still means something.

Sources come from config: an explicit list of IDs, a regex against my own playlist names, or both. The regex is the low-maintenance option. Anything named `Genre: Something` joins the union automatically, with no config edit.

The diff has one wrinkle. Spotify's remove call deletes _every_ occurrence of a URI, so you can't remove just one copy of a duplicated track. The script leans into that: a duplicate gets removed entirely and added back once.

```js
// DELETE removes every occurrence of a URI, so duplicates are removed wholesale
// and re-added once below.
const toRemove = [];
for (const [uri, n] of counts) {
  if (!desiredSet.has(uri) || n > 1) toRemove.push(uri);
}
const removeSet = new Set(toRemove);
const toAdd = desired.filter((uri) => !counts.has(uri) || removeSet.has(uri));
```

Local files are left out of both sides of the diff, because the API can't add them to a playlist anyway.

## Letting edits flow backwards

A purely derived playlist has an annoying property: you can't edit it. Remove a track from the main playlist, and the next run puts it right back, because it's still in a genre playlist.

So the script supports two edits made directly on main:

- **Remove a track from main**, and it's removed from every genre playlist that held it.
- **Add a track to main**, and it's routed into a `Genre: Sort` playlist, where I can file it into a real genre later.

To tell your edits apart from the script's, it keeps a snapshot of main exactly as the last run left it. Anything missing from that snapshot was removed by you. Anything new that isn't in any source was added by you. The first run has no snapshot, so it records a baseline and doesn't propagate anything:

```js
// Returns null (not an empty set) on the first run, so callers can tell
// "main was empty last time" from "we have never recorded main".
async function readSnapshot() {
  try {
    const data = JSON.parse(await readFile(SNAPSHOT_PATH, "utf8"));
    return new Set(data.uris ?? []);
  } catch (err) {
    if (err.code === "ENOENT") return null;
    throw err;
  }
}
```

That `null` versus empty `Set` distinction matters. Treat a missing snapshot as an empty one, and the first run decides that every track in main was "added by you" and copies the whole thing into Sort.

## The failure that actually matters

The bug I worried about wasn't in the diff logic. It's a genre playlist that fails to load, or that I delete. The union shrinks, the script dutifully reconciles, and the main playlist quietly empties itself.

There are three defenses. Every fetch happens before any write, and any failed fetch throws and aborts the run. Zero resolved sources is a hard error, not an empty union. And there's a removal guard:

```js
if (!FORCE && toRemove.length >= minRemovals && ratio > maxRatio) {
  throw new Error(
    `refusing to remove ${toRemove.length} of ${mainUris.length} items (${Math.round(ratio * 100)}%). ` +
      `Check that every source playlist still exists, then re-run with --force if this is intended.`,
  );
}
```

By default, a run that would remove more than half the playlist (once at least 20 removals are involved) stops and waits for a deliberate `--force`. And `--dry-run` prints every add and remove without touching anything. I run it every time I change the source list.

Liked Songs is append-only by construction. The script calls `PUT /me/library` and never `DELETE`. The tradeoff: if I unlike a track that's still in a genre playlist, the next run likes it again, because the script asks Spotify what's saved instead of keeping its own state. Remove it from the genre playlist first and it stays unliked.

## The API moved under it

I wrote this against Spotify's Web API after its [February 2026 Development Mode changes](https://developer.spotify.com/documentation/web-api/tutorials/february-2026-migration-guide), and that shaped more of the code than I expected:

- Playlist contents moved from `/playlists/{id}/tracks` to `/playlists/{id}/items`, and the wrapper field went from `track` to `item`. The reader accepts both, in case the rollout is uneven.
- The per-type library endpoints like `PUT /me/tracks` were replaced by one URI-based `PUT /me/library`.
- A Development Mode app now needs its owner to have Premium.
- Contents are only returned for playlists you own or collaborate on, so a followed playlist can't be a source.

The new `GET /me/library/contains` endpoint returned a 400 ("Too many uris requested") on a batch of 50, which the old endpoint used to accept. The real limit isn't documented, so the script batches by 20. I also never confirmed that endpoint's response shape against live traffic, so the code accepts a bare array or either of two wrapper objects. Both decisions are written down in the README, so whoever touches this next (probably me) doesn't have to rediscover them.

## Running it

There's no `npm install`. It needs Node 20+ for native `fetch`. Auth is PKCE, so there's no client secret, and Spotify now only allows `http://127.0.0.1:8888/callback` as a non-HTTPS redirect URI, not `localhost`. Refresh tokens rotate on every refresh, and the client saves each new one, so don't restore an old copy of `.tokens.json`.

One `launchd` gotcha is worth knowing if your repo lives on an external drive: `launchd` will happily run a script from an external volume but can't create a log file there. The whole job fails with exit code 78 before Node even starts. Point the log paths at the internal disk.

If you keep music the way I do, clone it, run `--dry-run`, and see what your main playlist would look like. It's a small script, but the snapshot-diff idea works for any "derived list that people still want to edit by hand."
