---
date: "2026-10-13T02:15:37.000-07:00"
tags:
  ["obsidian", "obsidian-mobile", "productivity", "workflows", "daily-notes"]
draft: false
title: "Obsidian Quick Capture on iOS: Stop Losing Thoughts to the Loading Screen"
image: "/images/posts/obsidian-quick-capture-on-ios-stop-losing-thoughts-to-the-loading-screen.jpg"
topic: "obsidian"
description: "Obsidian's native Quick Capture for iOS 26 lets you jot a note from the Lock Screen, Control Center, or Shortcuts without waiting for your vault to load. Here's how Locations, templates, and widgets fit together."
---

Every Obsidian mobile user knows this moment. You're in line at the grocery store, an idea shows up, you tap the Obsidian icon, and then you wait. The vault indexes, plugins load, the sync indicator spins. By the time the editor is ready, half the thought is gone and the other half is competing with the cashier.

A big vault with a dozen community plugins is great on a laptop and sluggish on an iPhone, and capture is exactly the job where a few seconds matter most. Obsidian 1.14 for iOS goes after that problem directly with native Quick Capture.

## What Quick Capture actually is

Quick Capture is a small native editor that runs **without waiting for your vault to load**. On iOS 26 you can open it from the Lock Screen, from Control Center, or from a Shortcut. You type, and the text lands in your vault. While you're editing, the capture stays reachable as a Live Activity on the Lock Screen and in the Dynamic Island, so switching apps to copy a link doesn't lose your place.

Two caveats before you go looking for it:

- It requires **iOS 26**. Older iOS versions don't get the native capture surfaces.
- As of the 1.14.0 and 1.14.1 mobile releases in September 2026, it shipped through **early access (Catalyst)**. If you're on the public build and don't see it, that's why. Check the [Obsidian changelog](https://obsidian.md/changelog) for when it reaches the public channel.

It builds on groundwork from earlier in the year. Obsidian 1.12 for iOS added a Share extension that saves content from Safari or other apps into your vault without opening Obsidian, plus a "Bookmark Link" Shortcuts action. Quick Capture is the same idea pointed at your own thoughts instead of someone else's web page.

## Locations: decide where it goes before you write it

The feature that makes Quick Capture more than a scratch pad is **Locations**. A Location is a saved destination for captures, and it can be:

- a **new note**
- **today's daily note**
- a **bookmarked note**
- **any note you choose**

This matters because the classic mobile failure mode isn't the slow launch. It's the pile of "Untitled 14.md" files you find a month later. Locations let you route captures at the moment you make them. A reasonable starting set looks like this:

| Location | Target                          | Use it for                                 |
| -------- | ------------------------------- | ------------------------------------------ |
| Journal  | Today's daily note              | Passing thoughts, things that happened     |
| Inbox    | A bookmarked `Inbox.md`         | Tasks and ideas to triage later            |
| New idea | New note                        | Anything big enough to become its own note |
| Reading  | A chosen `Reading list.md` note | Books and articles people recommend        |

If you already run a daily note workflow, the daily note Location is the obvious default. Your phone captures become part of the day's record instead of orphans in the root folder.

As of 1.14.1, you can bind Locations to the capture surfaces themselves. Lock Screen and Control Center widgets can open a specific Location, a configurable **Home Screen widget** holds shortcuts to several Locations at once, and the **Quick Capture action in Shortcuts** takes a Location parameter. That last one is the power-user hook: a Shortcut can open capture pointed at your Inbox, triggered by a Back Tap, an Action Button press, or a Focus mode change.

## Templates with location data

Quick Capture templates support variables for where you are when you write. `{{latitude}}` and `{{longitude}}` insert your current coordinates, and since 1.14.1 `{{openStreetMapLink}}` inserts a link to your position on OpenStreetMap.

That's handy for field notes, travel logs, or anything where the place is part of the memory. A capture template for a travel journal might look like this:

```markdown
---
type: field-note
lat: { { latitude } }
lng: { { longitude } }
---

Location: {{openStreetMapLink}}
```

Because the coordinates land in properties, they're queryable later. A Bases view or a Dataview query can list every field note with its coordinates, and a map plugin can plot them.

One thing worth deciding up front: location data in a note is still location data. If your vault syncs to a shared folder or you publish parts of it with Obsidian Publish, keep the location template on Locations that stay private.

## A capture setup that stays out of your way

Quick Capture works best when the phone does one job: get the thought into the right place, fast. Triage, linking, and cleanup happen later on a bigger screen. A minimal setup:

1. Create two or three Locations, no more. Daily note, Inbox, and "new note" cover most of it.
2. Put the Daily note Location on the Lock Screen widget, since that's the one you'll hit without thinking.
3. Add the Home Screen widget with the rest.
4. Once a week, process the Inbox note on desktop: turn lines into tasks, links, or real notes.

Native Quick Capture removes most of the reason to run a separate quick-notes app. If you're on iOS 26 and willing to run an early access build, it's worth trying now. Otherwise, set up your Inbox and daily note structure today so it's ready when the feature lands in the public release. The [1.14.0](https://obsidian.md/changelog/2026-09-02-mobile-v1.14.0/) and [1.14.1](https://obsidian.md/changelog/2026-09-08-mobile-v1.14.1/) mobile changelogs have the full details.
