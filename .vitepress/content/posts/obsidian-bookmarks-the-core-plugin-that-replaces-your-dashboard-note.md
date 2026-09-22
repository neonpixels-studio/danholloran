---
date: "2026-09-22T02:16:05.000-07:00"
tags: ["obsidian", "pkm", "workflows", "productivity", "bookmarks"]
draft: false
title: "Obsidian Bookmarks: The Core Plugin That Replaces Your Dashboard Note"
image: "/images/posts/obsidian-bookmarks-the-core-plugin-that-replaces-your-dashboard-note.jpg"
topic: "obsidian"
description: "Bookmarks is a core plugin most people use to pin three notes and forget about. It can pin saved searches, headings, blocks, and whole tab groups, which makes the hand-maintained dashboard note redundant."
---

Almost everyone who has used Obsidian for more than a month has built the same note. It's called `Home` or `Dashboard` or `000 Index`, it's a pile of wikilinks to the things you open most, and you stopped updating it months ago. It probably still links to a project that shipped two years back, under a heading called "Read Later" with nothing beneath it.

The thing that should have replaced it was sitting in the sidebar the whole time. Bookmarks is a core plugin — no install, no community plugin risk — and it's the direct descendant of the old Starred plugin, which is probably why people assume it does what Starred did: pin a file, see the file in a list. It does considerably more than that, and the extra targets are what make it a real navigation layer instead of a favorites list.

## You can bookmark things that aren't files

The full list of bookmarkable targets is files, folders, graphs, searches, headings, blocks, and links. That's from the [official docs](https://obsidian.md/help/plugins/bookmarks), and each one past "files" changes how you'd use the plugin.

**Saved searches** are the sleeper feature. Run a search, click the three-dot icon under the search field next to the result count, and hit **Bookmark**. Now a live query lives in your sidebar. Something like:

```
tag:#project -tag:#archived path:"Work"
```

That's a permanently up-to-date list of active work projects that you never maintain. Compare that to a dashboard note, where the equivalent is a Dataview block you have to open a file to see, or worse, a manually curated list of links that rots.

**Headings and blocks** solve the "long note" problem. Right-click a heading and choose **Bookmark this heading**; for a block, put your cursor in it and run **Bookmark block under cursor** from the command palette. If you keep a 4,000-word running note for a client, you can pin the _Open Questions_ heading and land there directly instead of scrolling from the top every time.

**Graphs** are bookmarkable too — right-click the graph view's tab and select **Bookmark**. Global graphs only; local graphs can't be pinned. This matters if you've ever spent ten minutes tuning filters, color groups, and force settings only to lose all of it on the next restart. Bookmark the configured graph and it comes back exactly as you left it.

**Tab groups** are the capability I see mentioned least. In the upper-right of a tab group there's a down arrow, and inside it, **Bookmark 3 tabs** (with whatever your count is). That captures an entire working layout in one item. A "Weekly Review" bookmark can open four tabs at once: the review template, the current daily note, a saved search for overdue tasks, and the project MOC you always end up in anyway.

## Groups turn it into a tree

A flat list of twenty bookmarks is as useless as a flat list of twenty notes. Click **New bookmark group** at the top of the Bookmarks tab, then drag items into it. Groups nest, so you can model whatever hierarchy you actually think in — Work / Client A / Active, or Writing / Drafts / Ready to Edit — without committing to it in your folder structure.

That last part is the real argument. Folders force one hierarchy on every note. Bookmark groups give you a _second_, throwaway hierarchy on top, scoped to what you're working on this month, and you can blow it away without touching a single file. Deleting a bookmark group removes the group and everything in it, but the notes are untouched.

One caveat worth knowing: what the bookmark points at is a path, not an identity. Everything lives in `.obsidian/bookmarks.json`, and the entries store paths and titles. Rename or move a bookmarked file outside Obsidian and you get a dead entry. There's a [known bug](https://forum.obsidian.md/t/bug-the-bookmarks-core-plugin-leaves-invalid-data-behind-in-bookmarks-json/116119) where deleting a nested folder leaves orphaned items in the JSON that no longer render in the UI, so if your bookmarks file looks suspiciously large, it may be carrying ghosts.

The other thing to be clear about: these are not web bookmarks. Bookmarks pins things _inside_ your vault. You can pin a URL, but only by enabling the Web viewer core plugin first, opening the page in Obsidian's own browser, and bookmarking from its address bar. If you want to save articles from Chrome, that's Web Clipper's job, not this one.

## Where to start

Enable Bookmarks in **Settings → Core plugins** if it isn't already on, then do one thing: take whatever list of links is in your stale dashboard note, bookmark each target properly, and delete the note. Give the Bookmarks tab a hotkey while you're there. If it feels thin afterward, add one saved search — the query you type more than twice a week — and see whether you open the sidebar more than you expected.
