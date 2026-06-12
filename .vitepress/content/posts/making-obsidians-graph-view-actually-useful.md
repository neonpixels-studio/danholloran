---
date: "2026-06-12T07:08:47.000+00:00"
tags: ["obsidian", "pkm", "note-taking", "knowledge-management", "graph-view"]
draft: false
title: "Making Obsidian's Graph View Actually Useful"
image: "/images/posts/making-obsidians-graph-view-actually-useful.jpg"
topic: "obsidian"
description: "The graph view looks great in screenshots, but most Obsidian users never get practical value from it. Here's how to change that."
---

Every Obsidian demo ends with a screenshot of the graph view — a glowing web of interconnected dots that makes your notes look like a neural network. It's compelling. It's also the feature that most people open once, stare at, and then never touch again.

That's a shame, because the graph view does have genuine practical uses. You just have to stop expecting it to be a navigation tool and start using it for what it's actually good at.

## The Global Graph Is Not for Navigation

The main graph (opened via **Ctrl/Cmd+G**) shows every note in your vault as a node, with links drawn between them. When your vault grows past a few hundred notes, this view becomes a dense hairball that's nearly impossible to read, let alone click through.

The mistake is treating it like a file explorer or a map of your vault that you're supposed to navigate. That's not what it's for. The global graph's real job is **health checking your vault** — finding notes that are isolated, revealing clusters you didn't know existed, and spotting topics that are more (or less) connected than you expected.

Try this: open the global graph, then in the Filters panel toggle on **Orphans**. Suddenly every note with zero links lights up as a standalone dot floating away from the main cluster. Those are your orphaned notes — things you captured but never linked to anything else. Work through them periodically, adding links or archiving them, and your graph will tighten up noticeably.

Color groups make this even more powerful. In the **Groups** panel, add a filter like `tag:#inbox` or `path:Inbox/` and assign it a bright color. Now you can see at a glance how many unprocessed notes are still sitting in your inbox and how disconnected they are from the rest of your vault.

## The Local Graph Is Where It Gets Useful

The local graph — opened with the **Open local graph** button in the right sidebar while viewing a note — shows only the note you're reading and its immediate neighbors. This one is worth using regularly.

When you're deep in a topic and want to understand what surrounds it, the local graph gives you a tight view of how that one note sits in your vault's wider context. You can set the depth to 1, 2, or higher to pull in second- and third-degree connections. Depth 2 is often the sweet spot: close enough to see the relevant neighborhood, not so wide that it becomes noise.

Practical example: you've been building up notes on a project for weeks. Open the project's MOC (Map of Content) note, then open its local graph at depth 2. You'll see which concepts have rich sub-networks attached and which ones are barely connected — a fast way to find the gaps in your thinking before writing.

## Filters That Actually Save Time

A few filter patterns worth setting up in the global graph:

**Exclude daily notes.** If you use daily notes, they create thousands of nodes that clutter the graph without revealing anything meaningful. Add `-path:Daily/` (or whatever your daily notes folder is) in the Filters search box to hide them all.

**Show only a topic.** Type `tag:#project-name` to filter the graph down to just the notes tagged with that project. What you'll see is how many notes belong to that project and how interconnected they actually are — useful for audits before wrapping up or archiving a project.

**Find attachment orphans.** Add `path:Attachments/ OR path:Assets/` as a color group. Attached images and PDFs that no note links to show up immediately. You'd be surprised how many accumulate.

## Stop Optimizing the Graph, Start Using It

One final note: resist the urge to make your graph look beautiful. Graph aesthetics — the perfect cluster layout, the color-coded hierarchy — is a procrastination trap disguised as PKM work. An organized-looking graph doesn't mean you're thinking more clearly; it means you've spent an afternoon tweaking settings.

The graph view is most useful as an occasional audit tool — something you open every week or two to find orphans, check cluster health, and spot patterns — not a dashboard you maintain daily. Use it, fix what it surfaces, then go write notes.

That's the loop that actually builds a useful vault.
