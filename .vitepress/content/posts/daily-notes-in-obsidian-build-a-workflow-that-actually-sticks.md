---
date: "2026-06-16T07:09:10.000+00:00"
tags:
  [
    "obsidian",
    "pkm",
    "daily-notes",
    "productivity",
    "workflows",
    "templater",
    "dataview",
  ]
draft: true
title: "Daily Notes in Obsidian: Build a Workflow That Actually Sticks"
image: "/images/posts/daily-notes-in-obsidian-build-a-workflow-that-actually-sticks.jpg"
topic: "obsidian"
description: "How to set up a daily notes workflow in Obsidian that you will actually use, from the core plugin to Templater templates and Dataview queries."
---

Most Obsidian vaults have a graveyard problem. Ideas get dropped into random notes titled "misc" or floating scratch pads that never get reviewed, and then they disappear. The daily note is Obsidian's built-in answer: a date-stamped file that acts as your vault's daily inbox, journal, and task surface all at once. The core plugin gets you started in under a minute, but the real payoff comes once you wire in a Templater template and a couple of Dataview queries. Here is how to build a daily notes workflow that you will actually use.

## Turn On the Core Plugin

Go to Settings → Core plugins → Daily notes and toggle it on. Three settings matter here. Date format controls how your files are named: `YYYY-MM-DD` keeps daily notes sorted chronologically in the file explorer, which saves you from scrolling chaos later. New file location points to a dedicated folder (something like `Daily/` or `Journals/`) so daily notes do not pile up in your vault root. Template file location can be left empty for now if you do not yet have a template.

Once the plugin is on, the calendar icon in the left ribbon creates today's note. You can also use the command palette (Cmd+P on Mac, Ctrl+P on Windows) and search for "Open today's daily note." That is it for the basic setup. One note per day, automatically named and placed where you want it.

## Add Structure with Templater

The built-in Daily notes plugin supports static templates, but [Templater](https://obsidian.md/plugins?id=templater-obsidian) (a Community plugin) adds dynamic content: the current date formatted exactly how you want it, a navigation link to yesterday's note, and auto-inserted headings. Install Templater via Settings → Community plugins → Browse, then point it at a templates folder under Settings → Templater → Template folder location.

Create a file called `Daily Note.md` in that folder:

```markdown
---
date: <% tp.date.now("YYYY-MM-DD") %>
tags: [daily-note]
---

# <% tp.date.now("dddd, MMMM Do") %>

← [[<% tp.date.now("YYYY-MM-DD", -1) %>|Yesterday]] | [[<% tp.date.now("YYYY-MM-DD", 1) %>|Tomorrow]] →

## Tasks

- [ ]

## Notes

## Reflection

- What went well?
- What would I carry into tomorrow?
```

Back in Settings → Daily notes, set Template file location to the path of this file (for example `Daily/Daily Note`). Then in Settings → Templater, enable "Trigger Templater on new file creation." Now each new daily note opens pre-filled with today's date, a human-readable heading like "Tuesday, June 16th," and navigation links to the previous and next days. The `tp.date.now("YYYY-MM-DD", -1)` and `tp.date.now("YYYY-MM-DD", 1)` expressions resolve at creation time, so the links point to the actual neighboring dates.

## Query Your Vault with Dataview

Once you have a couple of weeks of daily notes, [Dataview](https://obsidian.md/plugins?id=dataview) turns them into a self-updating log. Install it the same way as Templater, then add this block to the bottom of your template:

```dataview
LIST
FROM ""
WHERE file.cday = date("<% tp.date.now("YYYY-MM-DD") %>")
AND file.name != this.file.name
SORT file.ctime ASC
```

Because Templater runs this at creation time, each daily note gets a query hardcoded to that specific date. The result is an automatic activity log showing every other note you created that day, with no manual tagging required.

You can extend this to surface unfinished work across the week. Add a second block to the template:

```dataview
TASK
FROM "Daily"
WHERE !completed AND file.day >= date(today) - dur(7d)
SORT file.day DESC
```

This rolls all incomplete tasks from the last seven daily notes into one view. No more losing a to-do item because it was buried in last Thursday's note. If you want due dates and recurring tasks on top of that, the [Obsidian Tasks](https://obsidian.md/plugins?id=obsidian-tasks-plugin) plugin layers on nicely and its queries compose with Dataview ones.

## Start Small, Adjust Weekly

The goal is not a perfect system on day one. Start with the core plugin and a minimal template, use the daily note as your primary capture point for a week or two, then add Dataview once you have enough notes to make the queries useful. Pay attention to which template sections you actually fill in and which you skip; prune the ones you skip. The best daily notes workflow is the one that costs almost nothing to maintain and pays you back every time you open the app.
