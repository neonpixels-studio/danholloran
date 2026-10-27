---
date: "2026-10-27T02:15:06.000-07:00"
tags: ["obsidian", "pkm", "productivity", "properties-and-frontmatter"]
draft: false
title: "Obsidian Bases Formulas: Computed Columns Your Notes Never Have to Store"
image: "/images/posts/obsidian-bases-formulas-computed-columns-your-notes-never-have-to-store.jpg"
topic: "obsidian"
description: "Bases formulas let you calculate deadlines, flags, scores, and labels from the properties you already have, so your frontmatter stays small and your views stay smart."
---

Every vault eventually grows a property that shouldn't exist. A `days_left` field you update by hand. An `overdue: true` checkbox you forget to tick. A `price_per_page` number you calculated once in your head and never touched again. These are values derived from other values, and storing them in frontmatter means they go stale the moment the inputs change.

Bases formulas fix that. A formula is a computed property that lives in the `.base` file, not in your notes. It reads the properties you already have, does the math or the logic, and shows the result as a column, a card field, or a sort key. Your notes keep only the facts. The base works out everything else, every time it renders.

## Where formulas live and how they reference things

You can add a formula from the toolbar (**Properties → Add formula**), and the editor autocompletes function and property names and shows a green checkmark when the expression is valid. Under the hood it lands in the `formulas:` block of the base's YAML:

```yaml
formulas:
  days_label: 'if(due, due.relative(), "No due date")'
  is_overdue: 'due < today() && status != "done"'
  flag: 'if(formula.is_overdue, "🔴 Overdue", "")'
```

Three kinds of values are available inside an expression:

- **Note properties** from frontmatter, like `due` or `note.status`. No prefix means a note property.
- **File properties** that every file has, like `file.mtime`, `file.tags`, `file.links`, or `file.folder`.
- **Other formulas**, prefixed with `formula.`. That's how `flag` above reuses `is_overdue`. Chains are fine as long as nothing is circular.

One YAML gotcha catches almost everyone: formulas are stored as strings, so text literals inside them need their own quotes. Wrap the whole expression in single quotes and use double quotes inside, or the other way around. Mixing them up is the most common reason a formula silently refuses to save.

## A project tracker that maintains itself

Say your project notes have `status`, `start`, `due`, `impact`, `effort`, and a `tags` list. Here's a base that turns those six facts into something useful:

```yaml
filters:
  and:
    - file.inFolder("Projects")
formulas:
  target: 'if(due, due, start + "2w")'
  when: "formula.target.relative()"
  bucket: 'if(status == "done", "Done", if(formula.target < today(), "Overdue", if(formula.target < today() + "7d", "This week", "Later")))'
  score: "if(effort, ((impact * 10) / effort).round(1), 0)"
  stale: 'status != "done" && file.mtime < now() - "30d"'
views:
  - type: table
    name: Triage
    groupBy:
      property: formula.bucket
      direction: ASC
    order:
      - file.name
      - status
      - formula.when
      - formula.score
      - formula.stale
```

A few things are happening here that would each have been a hand-maintained property before:

- `target` falls back to "start plus two weeks" when a project has no due date. Date arithmetic takes duration strings like `"2w"`, `"7d"`, or `"1M"` directly.
- `when` renders the deadline as "in 3 days" or "2 weeks ago" with `relative()`.
- `bucket` is a nested `if()` that sorts every project into one of four groups, and the view groups by it. Because groups now work in table, cards, list, and kanban layouts, the same formula can drive a board too.
- `score` is a crude impact/effort ratio, guarded so a missing `effort` doesn't divide by nothing.
- `stale` flags open projects you haven't touched in a month, using the file's own modified time. No property required at all.

Change a due date in one note and every one of those columns updates. Nothing to remember.

## Lists, links, and summaries

Formulas aren't limited to numbers and dates. List properties get `filter()`, `map()`, `join()`, `unique()`, and `reduce()`, using `value` for the current item:

```yaml
formulas:
  topic_tags: 'file.tags.filter(value.contains("topic/")).join(", ")'
  link_count: "file.links.length"
  authors_text: 'list(author).join(", ")'
```

The `list()` wrapper is worth memorizing. If some notes store `author` as a single value and others as a list, `list()` normalizes both so `join()` never chokes.

For column totals, the view-level `summaries` key handles the common cases (Sum, Average, Earliest, Checked, Unique, and more). When you need something custom, define it at the top level using `values`, the list of every value in that column:

```yaml
summaries:
  avgScore: "values.mean().round(1)"
views:
  - type: table
    name: Triage
    summaries:
      formula.score: avgScore
```

## When to reach for something else

Formulas are expressions, not scripts. There are no loops beyond the list helpers, no reading note bodies, and no writing back to files. If you need to parse task checkboxes inside a note or build a custom HTML report, that's still DataviewJS territory. And if a value is a real fact you'd want in the note itself, like a rating or a finish date, it belongs in frontmatter, not in a formula. The test is simple: if you could compute it from other properties, compute it.

Start by finding one property in your vault you update by hand and delete it. Rebuild it as a formula, add it to a view, and enjoy never touching it again. The [Formulas guide](https://obsidian.md/help/formulas) and the full [Functions reference](https://obsidian.md/help/bases/functions) cover every type and method available.
