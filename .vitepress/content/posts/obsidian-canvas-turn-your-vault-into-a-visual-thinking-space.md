---
date: "2026-06-05T07:03:43.000+00:00"
tags: ["obsidian", "pkm", "workflows", "note-taking", "canvas"]
draft: false
title: "Obsidian Canvas: Turn Your Vault Into a Visual Thinking Space"
image: "/images/posts/obsidian-canvas-turn-your-vault-into-a-visual-thinking-space.jpg"
topic: "obsidian"
description: "How to use Obsidian's Canvas core plugin for project planning, brainstorming, and connecting notes spatially — plus a look at the open JSON Canvas format and the Advanced Canvas community plugin."
---

Some ideas just don't want to live in a linear document. You're planning a project, mapping out an article, or trying to untangle how a dozen notes relate to each other — and a single scrolling Markdown file forces everything into a top-to-bottom order that your brain didn't ask for.

That's exactly the problem [Canvas](https://obsidian.md/canvas) solves. It's a Core plugin (Settings → Core plugins → Canvas), so there's nothing to install — yet it's one of the most underused features in Obsidian. If you've never dragged your notes onto an infinite whiteboard, this is your nudge.

## What Canvas actually is

Canvas gives you an infinite, zoomable surface where you can lay out cards and draw connections between them. A card can be one of three things: a standalone text card written directly on the canvas, an embedded note from your vault, or a web page loaded by URL. You can also drop in images, PDFs, and even other canvases.

The key difference from the graph view: the graph shows you connections that already exist in your links, while Canvas lets you _create_ spatial relationships that don't need to exist as links at all. Two notes can sit side by side on a canvas because they belong together in your head — no `[[wikilink]]` required.

Creating one is quick: click the Canvas icon in the ribbon, or run "Canvas: Create new canvas" from the command palette. Drag any note from the file explorer onto the surface and it becomes a live, editable embed. Double-click empty space for a fresh text card. Drag from a card's edge to another card to draw a labeled arrow.

## Three workflows worth stealing

**Project command center.** Make a group for each phase — Backlog, In Progress, Done — and fill them with cards linked to your actual task notes. Embed the project brief alongside, plus a web card pointing at the relevant docs or repo. Select cards, right-click, choose Group, then give it a label and a color. Moving a card between groups is your status update. It's a kanban board where every card is a real note in your vault, not a string in some external tool.

**Writing outlines.** Before drafting a post, I scatter every point I want to make as individual text cards, then physically arrange them until the structure reveals itself. Arrows become transitions. When the layout feels right, the outline is done — and the cards convert into section headings almost mechanically.

**Synthesis maps.** When researching a topic, embed the relevant literature notes on one side and build up your own conclusions as new cards on the other, drawing edges from evidence to claim. Color the edges: green for "supports," red for "contradicts." You end up with a fishbone-style argument map that a folder of notes could never show you.

## It's just JSON underneath

Every canvas is saved as a `.canvas` file using [JSON Canvas](https://obsidian.md/blog/json-canvas/), an open spec Obsidian published so the format wouldn't be locked to one app. Crack one open in a text editor and you'll find a plain JSON object with two arrays — `nodes` and `edges`:

```json
{
  "nodes": [
    {
      "id": "a1",
      "type": "file",
      "file": "Projects/Site Redesign.md",
      "x": 0,
      "y": 0,
      "width": 400,
      "height": 320
    }
  ],
  "edges": [{ "id": "e1", "fromNode": "a1", "toNode": "b2", "label": "blocks" }]
}
```

This matters for two reasons. First, your visual thinking is as portable and future-proof as your Markdown. Second, it's scriptable — you can generate canvases programmatically, which opens the door to things like auto-built project boards from a folder of task notes.

If you outgrow the built-in features, the [Advanced Canvas](https://github.com/developer-mike/obsidian-advanced-canvas) community plugin adds flowchart node shapes, a presentation mode that walks through your cards like slides, and styling options the core plugin doesn't expose.

## Start with one messy canvas

Don't overthink it. Next time a project or an essay feels tangled, make a canvas, dump everything onto it, and start dragging. The spatial layer on top of your existing notes costs nothing to try — it's a Core plugin sitting in your vault right now. The [Obsidian Help docs on Canvas](https://help.obsidian.md/plugins/canvas) cover the full feature list when you're ready to go deeper.
