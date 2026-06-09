---
date: '2026-06-09T07:08:25.000+00:00'
tags: ['obsidian', 'pkm', 'plugins', 'note-taking', 'excalidraw']
draft: true
title: "Excalidraw in Obsidian: Visual Thinking That Lives in Your Vault"
image: '/images/posts/excalidraw-in-obsidian-visual-thinking-that-lives-in-your-vault.jpg'
topic: 'obsidian'
description: "A practical guide to the Excalidraw Community plugin for Obsidian — how to embed visual diagrams in your vault, link drawings to notes, and build a visual thinking workflow that actually integrates with your PKM."
---

Some ideas just refuse to live comfortably in bullet points. You're trying to map out a system, trace a chain of causality, or sketch a UI concept — and the moment you shove it into prose, something important gets lost in the linearization. This is the gap the **Excalidraw** plugin fills.

Excalidraw is a Community plugin built by Zsolt Viczian that embeds the popular open-source drawing tool directly into your vault. Your diagrams become `.excalidraw` files that sit alongside your notes, link to them, and can be embedded directly into your markdown — no copy-pasting screenshots, no switching apps.

## Getting Started

Install Excalidraw from Settings → Community plugins → Browse, search for "Excalidraw", and install. Once enabled, you'll get a new file type in your vault and a ribbon icon to create a new drawing.

Your first canvas opens in Obsidian's editor pane, giving you the familiar Excalidraw toolbar: shapes, text, arrows, freehand drawing. Drawings are stored as `.excalidraw` files (actually JSON under the hood) in whatever folder you set in the plugin settings. You can also configure a default template so every new drawing pre-loads your preferred styles or recurring shapes.

To embed a drawing in a note, use the standard Obsidian embed syntax:

```markdown
![[my-diagram.excalidraw]]
```

The drawing renders inline as an image. Click it, and it opens back in the canvas editor for further work. This round-trip — draw, embed, view, edit again — is frictionless in a way that screenshots and external apps never quite are.

## Linking Drawings to Notes (and Back)

The feature that pushes Excalidraw from "nice drawing tool" to genuine PKM powerhouse is bidirectional linking. You can attach a wikilink to any element on the canvas.

Select a shape, then use the link icon in the toolbar (or press `Ctrl/Cmd + K`) and type the name of any note in your vault. That shape becomes a clickable gateway into the note. Build a concept map where each node is a real note, and suddenly your diagram isn't decorative — it's navigable.

Going the other direction, you can embed entire notes *inside* a drawing as **embeddables**. Drag a `.md` file from your vault onto the canvas and it appears as a live, scrollable note preview. This is especially powerful for project overviews or book-on-a-page summaries: pull in several atomic notes, arrange them spatially, and see relationships that linear prose can't express.

Obsidian's graph view picks up these links too. Your visual maps stay wired into the rest of the vault's link graph, so connections you draw on a canvas show up as real connections in the graph.

## Where Excalidraw Shines (and Where to Reach for Something Else)

Excalidraw is the right tool for system diagrams, architecture sketches, and flows; mind maps where nodes link out to individual notes; rough UI wireframes during planning; and sketchnotes from talks or books where the hand-drawn aesthetic is part of the appeal.

It's less suited for polished exports. If you need a clean, publication-ready diagram, a dedicated tool like Figma or even Obsidian's built-in Mermaid support might serve you better. On mobile, the plugin works, but drawing with a finger is awkward — a stylus changes the equation considerably. And if your goal is primarily connecting lots of *existing* notes rather than drawing new content, Obsidian's native Canvas might be a better starting point.

## A Practical Workflow

A setup that works well: keep a `Visuals/` folder for all your Excalidraw files, create one drawing per major project or concept, link each drawing from the relevant MOC (Map of Content), and embed sub-diagrams in notes where they add context. This way your visual layer is organized in parallel with your note structure rather than scattered through it.

The plugin also ships with a **Script Engine** — a JavaScript automation layer for custom drawing actions. The community has built dozens of ready-made scripts available at the [Obsidian-Excalidraw wiki](https://github.com/zsviczian/obsidian-excalidraw-plugin/wiki). If you're comfortable with a little scripting, it's worth browsing.

Excalidraw doesn't replace text notes — it gives your vault a second dimension. The notes stay searchable, linkable, and portable. The drawings stay visual, spatial, and just as much a part of your PKM as everything else.
