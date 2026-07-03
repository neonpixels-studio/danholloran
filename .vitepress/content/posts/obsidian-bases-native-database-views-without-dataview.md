---
date: "2026-07-03T02:07:46.000-05:00"
tags: ["obsidian", "pkm", "plugins", "dataview"]
draft: false
title: "Obsidian Bases: Native Database Views Without Dataview"
image: "/images/posts/obsidian-bases-native-database-views-without-dataview.jpg"
topic: "obsidian"
description: "Bases is Obsidian's built-in core plugin for turning notes and their properties into live tables and cards. Here's how the syntax works and when to reach for it instead of Dataview."
---

For years, the answer to "how do I query my notes like a database?" in Obsidian was a single word: Dataview. It's a brilliant community plugin, but it asks you to learn a query language that lives only inside code blocks, renders read-only output, and quietly breaks the moment you hand your vault to someone who hasn't installed it. Bases changes that calculus. It ships **inside Obsidian** as a core plugin, so there's nothing to install, and it treats your frontmatter properties as columns in a real, interactive table.

If you've been tracking books, projects, or research notes with a wall of `dataview` queries, this is worth a careful look. Bases isn't just Dataview with a nicer coat of paint. It's a different model, and understanding where it fits will save you from rebuilding your vault twice.

## What a base actually is

A base is a saved view over your notes. By default it includes **every file in your vault** — there's no `FROM` or `source` clause like in SQL or Dataview. You narrow the set with filters, add computed columns with formulas, and choose how to render it. Bases are stored as `.base` files, but you can also drop one straight into a note with a fenced `base` code block.

Here's a minimal example that shows every note tagged `book` as a table:

```yaml
filters:
  and:
    - file.hasTag("book")
views:
  - type: table
    name: Reading list
    order:
      - file.name
      - status
      - rating
```

The `order` list is just the column order. Each entry is a property: `file.name` is a built-in file property, while `status` and `rating` are whatever you put in the note's frontmatter. That's the whole mental model — file properties describe the file, note properties come from your YAML frontmatter, and both become columns.

## Filters and formulas do the real work

Filters can nest with `and`, `or`, and `not`, so you can express conditions that would be painful in prose. Say you want books you haven't finished, plus anything in your "Required Reading" folder regardless of tag:

```yaml
filters:
  or:
    - and:
        - file.hasTag("book")
        - 'status != "done"'
    - file.inFolder("Required Reading")
```

Formulas add computed columns that don't exist in any note. They support arithmetic, dates, and a growing library of functions. A classic use is turning a raw price and page count into a cost-per-page value, or formatting a date:

```yaml
formulas:
  cost_per_page: "(price / pages).toFixed(2)"
  age: 'if(published, (today() - published).format("y"))'
```

Date math is genuinely useful here. `file.mtime > now() - "1 week"` is `true` for anything you touched in the last seven days, which makes a "recently edited" dashboard a two-line filter. There's no plugin to configure and no JavaScript to sandbox — it's part of the app.

## When to reach for it, and when not to

The headline feature is that Bases views are **live and interactive**. Sort a column, and it sorts. Edit a value in the table, and it writes back to the note's frontmatter. Group rows by a property with `groupBy`, and you get collapsible sections. Dataview, by contrast, renders static output you can't click into and edit.

That said, Bases is not a Dataview replacement for everyone yet. Dataview's `dataviewjs` escape hatch lets you write arbitrary JavaScript, pull from inline fields scattered mid-note, and build output Bases simply can't express. Bases reads frontmatter properties, so if your metadata lives as inline `key:: value` fields in the body of your notes, you'll need to migrate them to real properties first. The upside of doing that migration is portability: because Bases is core, a `.base` file works in any modern Obsidian install, including on mobile and in shared vaults, with nothing to install.

My rule of thumb: if you're building a structured tracker over notes that already use frontmatter properties, start with Bases. If you need computed logic that only JavaScript can express, or your metadata is trapped in inline fields you don't want to convert, Dataview still earns its place. For a lot of vaults, the honest answer is that they'll run both for a while — and that's fine.

Start small. Open the command palette, create a base, point it at one tag you already use, and watch your notes snap into a sortable grid. The [official Bases syntax reference](https://obsidian.md/help/bases/syntax) is the place to go once you want to push past tables into cards, summaries, and grouped views.
