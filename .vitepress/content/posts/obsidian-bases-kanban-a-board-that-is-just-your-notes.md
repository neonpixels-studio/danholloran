---
date: "2026-10-02T02:15:30.000-07:00"
tags: ["obsidian", "pkm", "productivity", "workflows", "bases"]
draft: false
title: "Obsidian Bases Kanban: A Board That Is Just Your Notes"
image: "/images/posts/obsidian-bases-kanban-a-board-that-is-just-your-notes.jpg"
topic: "obsidian"
description: "Obsidian 1.14 adds a native kanban layout to Bases. Here's how to build a board where dragging a card rewrites a property, where it beats the Kanban plugin, and where it still falls short."
---

If you've ever run a project board with the community Kanban plugin, you know the quiet problem with it. The board is its own Markdown file. Your project notes say `status: drafting`, the board says the card is in "Review", and nothing keeps the two in sync except you. Move a card and the note doesn't change. Edit the note and the board doesn't notice.

Obsidian 1.14, currently in early access for Catalyst supporters, fixes this at the root. Bases now has a **kanban layout**, and because it's a Bases view rather than a separate file, the board is just a lens over your notes. Drag a card to a new column and Obsidian rewrites the property in that note's frontmatter. There's no second source of truth to drift.

## Building your first board

You need two things: notes that represent the work, and a property that represents the stage. A minimal project note looks like this:

```yaml
---
type: project
status: drafting
due: 2026-10-15
owner: "[[Dan]]"
---
```

Then create a base (or open an existing one) and add the view:

1. Open the view menu and choose **Add view → Kanban**.
2. Open the **Group** menu in the toolbar and pick `status`. Each distinct value becomes a column.
3. Use **Properties** to choose what shows on each card, like `due` and `owner`.

Like every base, the configuration lives in plain YAML in the `.base` file, so you can version it or tweak it by hand. A board scoped to one folder looks roughly like this:

```yaml
filters:
  and:
    - file.inFolder("Projects")
    - 'type == "project"'
views:
  - type: kanban
    name: Board
    groupBy:
      property: note.status
      direction: ASC
    order:
      - file.name
      - note.due
      - note.owner
```

The filter matters more than it looks. Bases include every file in the vault by default, so without `file.inFolder` or a `type` check your board will happily sprout a column called "(empty)" full of every note that has no `status` at all.

## Where it beats the Kanban plugin

**The drag is the edit.** This is the whole point. Moving a card from "drafting" to "review" sets `status: review` in the note. Any other base, Dataview query, or search that reads `status` sees the change immediately. People used to bolt on helper plugins to get this behavior from the old Kanban plugin, and they didn't always fire.

**Folders can be columns too.** As of 1.14.2, if you group by `file.folder`, dragging a card physically moves the file into that folder, and creating a note from inside a column puts it in the matching folder. That turns a board into a visual inbox triage: columns for `Inbox`, `Projects`, `Archive`, and you sort by dragging. It also fixes an early complaint that new notes created from the board landed in the vault root and vanished from a folder-filtered view.

**It's one view among many.** The same base can hold a table view for bulk editing due dates, a cards view for browsing, and the kanban for flow. They share filters and formulas, so a formula like this works in all of them:

```yaml
formulas:
  overdue: 'if(due && due < today(), "Overdue", "")'
```

Add `formula.overdue` to the card properties and late work flags itself without any plugin.

**It works on mobile.** Native views don't depend on a plugin keeping up with the mobile app, and the 1.14.x releases have been steadily fixing mobile kanban quirks like columns resizing when the keyboard opens.

## Where it still falls short

It's honest to say this is a first release, and a few gaps matter if you run real projects on it.

- **One grouping property.** Columns come from a single property. No swimlanes, no grouping by status and owner at once.
- **Cards are notes, not checkboxes.** Every card is a file. If your tasks live as `- [ ]` items inside a project note, they won't appear. For that, the Tasks plugin or a Dataview `TASK` query is still the better tool.
- **No manual card order.** Cards sort by whatever the view's sort says. You can't drag a card to the top of a column to mean "do this next." A workaround is a numeric `priority` property used as the sort key.
- **Column order needed help.** Early builds dropped empty columns and re-added them at the end. Version 1.14.3 added a **Group** menu where you can add, hide, and reorder groups by hand, and 1.14.4 added **Hide column** to the column's right-click menu, which makes stable layouts much easier.

If your workflow depends on manual prioritization within a column, keep the plugin for now. If your projects already live as one note each and the status is what you care about, the native board is the cleaner model.

## Wrapping up

The kanban layout is the clearest example yet of why Bases matters: your notes and their properties are the data, and every view is just a way of looking at them. Start small. Pick one folder of notes that already share a `status` property, add a kanban view to a base, and drag one card. Then open the note and watch the frontmatter change. For the full set of filters and formulas you can layer on, the [Bases syntax docs](https://obsidian.md/help/bases/syntax) are the reference, and the [1.14 changelog](https://obsidian.md/changelog/2026-09-02-desktop-v1.14.0/) tracks what's landed so far.
