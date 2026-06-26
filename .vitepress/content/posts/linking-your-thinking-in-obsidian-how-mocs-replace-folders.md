---
date: "2026-06-26T07:08:36.000+00:00"
tags: ["obsidian", "pkm", "knowledge-management", "linking", "note-taking"]
draft: false
title: "Linking Your Thinking in Obsidian: How MOCs Replace Folders"
image: "/images/posts/linking-your-thinking-in-obsidian-how-mocs-replace-folders.jpg"
topic: "obsidian"
description: "Maps of Content (MOCs) are the organizing idea at the heart of the LYT framework — and once you understand them, you may never file a note into a folder again."
---

You open your vault looking for that note about async JavaScript. You know it's in there. You check `Programming/JavaScript/Async/` — nope. Then `Projects/Blog/Research/` — also no. Eventually you search for it and find it sitting in `Inbox/`, exactly where you left it three weeks ago.

The problem isn't that you forgot where you put the note. The problem is that a note about async JS also belongs in a thread about performance, and another about error handling, and maybe another about Node.js. Folders force you to pick one home. But ideas don't work that way.

## The Core Idea Behind Linking Your Thinking

The LYT (Linking Your Thinking) framework, developed by Nick Milo, is built on one insight: notes should be connected by what they _mean_, not where they _sit_. Instead of filing notes into folders, you link them to other notes — and when a cluster of related notes grows large enough, you create a Map of Content (MOC) to give that cluster an entry point.

Wikilinks are what make this possible in Obsidian. Anywhere in a note, you type `[[note title]]` to create a link. Obsidian automatically creates the reverse link too — a _backlink_ — so every note knows which other notes reference it. You don't have to set up that connection twice.

```
[[JavaScript Async Patterns]]   ← links to the target note
```

On the target note, under the Backlinks panel, you'll see every note that linked to it. This bidirectionality is what lets you navigate your vault without relying on folder structure. A note about async JavaScript can appear in your JavaScript MOC, your performance MOC, and your concurrency notes, all without copying it anywhere.

## What a MOC Actually Looks Like

A MOC is just a note. It has a title, and its body is mostly a list of links. What makes it a MOC is its _purpose_: it's a hand-curated hub for a topic, one you update whenever you add a new note that belongs to that neighborhood.

```markdown
# JavaScript MOC

## Core Concepts

- [[JavaScript Async Patterns]]
- [[Closures and Scope]]
- [[Prototypal Inheritance]]

## Ecosystem

- [[Node.js Basics]]
- [[Bun vs Node.js]]
- [[Web Workers]]

## Related

- [[TypeScript MOC]]
- [[Web Performance MOC]]
```

Notice the last section: links to _other MOCs_. This is how LYT scales. Individual notes link to each other and to MOCs. MOCs link to each other. Your Home note (sometimes called an Index) links to your top-level MOCs. You end up with a navigable hierarchy that isn't a folder hierarchy — it's a linked one.

You can also let Obsidian's Dataview plugin generate parts of a MOC automatically. This query lists every note tagged `javascript` that you haven't already added manually:

```dataview
LIST
FROM #javascript
SORT file.mtime DESC
```

Treat the auto-generated list as a backlog — it surfaces notes you might want to pull into the curated section above.

## When to Make a MOC

The LYT framework has a useful rule of thumb: make a MOC when you feel _mental strain_ navigating a topic. If you have five notes about CSS layout and you're losing track of them, that's when you create a CSS Layout MOC and link them all there. The discomfort is the signal.

A few practical triggers:

- You have more than 8-10 notes on one subject and keep searching for them
- A project is winding down and you want a single entry point to your research
- You're preparing to write something and want to see all your thinking in one place

You don't need to MOC everything upfront. Start linking aggressively — every new note should link to at least one existing note — and let MOCs emerge when a cluster gets unwieldy. Forcing structure before you have enough notes to justify it is a great way to spend more time organizing than thinking.

## Getting Started Without Overhauling Your Vault

You don't need to restructure anything to try this. Pick a topic you've taken several notes on already. Create a new note, title it something like `JavaScript MOC`, and spend ten minutes adding `[[wikilinks]]` to every relevant note you already have. Check the graph view or the Backlinks panel on each of those notes to find ones you may have missed.

Then, in each of those linked notes, add a line somewhere referencing the MOC back:

```markdown
Part of [[JavaScript MOC]]
```

That's it. You've built a small LYT hub without touching a single folder. Do this for two or three topics you care about, and the approach tends to spread on its own — because navigating a linked web of notes feels completely different from drilling through nested directories.

Obsidian's strength has always been that your notes are plain Markdown files you own. The LYT framework is a layer on top of that: a set of conventions for turning a pile of notes into something you can actually think with.
