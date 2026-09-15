---
date: "2026-09-15T02:08:13.000-07:00"
tags: ["obsidian", "linking", "note-taking", "knowledge-management"]
draft: false
title: "Obsidian Unlinked Mentions: The Half of the Backlinks Pane You Ignore"
image: "/images/posts/obsidian-unlinked-mentions-the-half-of-the-backlinks-pane-you-ignore.jpg"
topic: "obsidian"
description: "Linked mentions show the connections you remembered to make. Unlinked mentions show the ones you made without noticing, and they are the more interesting half."
---

Linking in Obsidian is an act of memory. You are writing about deployment pipelines, you remember you have a note on blue-green deploys, you type `[[` and the connection exists. The system works exactly as well as your recall does on that particular afternoon.

Which is to say: not that well. Six months into a vault, you have written the phrase "rate limiting" in thirty notes and linked it in four. The other twenty-six mentions are real connections. You made them. You just made them in prose instead of in syntax, and Obsidian's graph has no idea they happened.

The Backlinks pane already knows about all of them. It is the section underneath the one you actually read.

## Linked versus unlinked, and why the second one is harder

The core Backlinks plugin splits the pane in two. **Linked mentions** are notes containing an internal link to the active note, which is the part everyone uses. **Unlinked mentions** are any unlinked occurrence of the active note's name anywhere in the vault.

That second definition is doing quiet, heavy work. Obsidian is running a full-text search for your note's title across every file, live, every time you switch notes. It is not a snapshot of your link graph. It is a standing query against the thing your link graph failed to capture.

The catch is that the query is only as good as the title. A note called `Rate Limiting` will surface genuine matches all over a backend vault. A note called `Notes` will surface several hundred and teach you nothing. And a daily note called `2026-04-12` will surface nothing at all, because nobody writes dates in prose.

This makes note titles load-bearing in a way that is easy to miss. Titles are not just labels for the Quick Switcher. They are the search terms Obsidian uses on your behalf, forever, in the background.

## Aliases are how you widen the net

Titles are singular and specific. Prose is not. You titled the note `Automated Market Maker` and then spent a year writing "AMM" everywhere, so unlinked mentions comes up empty.

Aliases fix this, because Obsidian resolves them the same way it resolves titles — in wikilink autocomplete, in the Quick Switcher, and in unlinked mentions:

```yaml
---
aliases:
  - AMM
  - automated market makers
  - constant product market maker
---
```

Now the pane catches every casual reference, not just the formal one. This is the highest-leverage thing you can do with unlinked mentions, and it costs about fifteen seconds per note. Add the plural. Add the acronym. Add the phrasing you actually type when you are moving fast and not thinking about your vault's architecture.

A caveat worth knowing: files matching your **Excluded files** patterns in Settings will not appear in Unlinked mentions at all. If a whole folder has gone silent in the pane, check there before assuming Obsidian is broken.

## Making it a habit instead of a curiosity

The pane is in the right sidebar. If you cannot see it, open the Command palette and run **Backlinks: Show backlinks**. There are four controls worth knowing: **Collapse results** to see which notes matched before you read what matched, **Show more context** to get the full paragraph rather than a truncated line, **Change sort order**, and **Show search filter**, which lets you narrow results using the same search syntax as the global search.

Two workflow tweaks turn this from a thing you occasionally poke at into something that works on you:

First, run **Backlinks: Toggle backlinks in document** to move the pane to the bottom of the note itself, or enable **Backlink in document** in the plugin's settings to make that the default. Sidebars are easy to ignore. The end of a note you just finished writing is not.

Second, open a pinned backlinks tab for whatever you are actively developing. **Backlinks: Open backlinks for the current note** opens a tab bound to that specific note, so it keeps showing that note's mentions even as you navigate away. Leave it open while you write around a topic and watch the mentions accumulate in real time.

When you hover a result, Obsidian offers a link button that converts the mention in place. Resist the urge to convert all of them. A note with eighty backlinks is not better connected than one with twelve; it is just noisier, and it makes the graph view useless. Link the mentions where the sentence genuinely points at the other note's idea. Leave the incidental word-matches alone.

The real payoff is not a tidier graph anyway. It is the specific, slightly unsettling moment when a note you wrote last spring turns out to have been about the thing you are writing about today, and you had completely forgotten. Linked mentions can never show you that. They only show you what you already remembered.
