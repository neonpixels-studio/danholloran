---
date: "2026-08-28T02:07:12.000-05:00"
tags:
  ["obsidian", "dataview", "plugins", "knowledge-management", "dataview-plugin"]
draft: false
title: "DataviewJS: The Escape Hatch When Bases and DQL Run Out"
image: "/images/posts/dataviewjs-the-escape-hatch-when-bases-and-dql-run-out.jpg"
topic: "obsidian"
description: "Bases handles most vault dashboards now, and Dataview's query language covers the rest. DataviewJS is what you reach for when neither can express the thing you actually want."
---

You write a Dataview query, it almost works, and then you hit the wall. You want a table of projects where the third column is a percentage of completed subtasks. Or a list grouped by month, but only months that have more than three entries. Or a rollup that reads a value out of a linked note two hops away. DQL has no arithmetic over grouped children, no early exit, no real branching. You end up writing three queries and eyeballing the results.

That is the moment DataviewJS exists for. It is not a better Dataview — it is the same index with the query language peeled off, handed to you as a JavaScript object called `dv`. Everything DQL does is a thin wrapper over calls you can make yourself, plus all the things a query language cannot express.

## It's off by default, and that's the first thing that bites people

If you paste a `dataviewjs` block into a note and get an empty render with no error, you have not made a mistake. **Settings → Community plugins → Dataview → JavaScript Queries** is off out of the box. Turn it on and the same block works. The setting exists because a `dataviewjs` block is arbitrary JavaScript running with your vault's API surface — the same reason you should not paste one in from a random forum thread without reading it first.

Once it's on, the shape is always the same: fence the block with `dataviewjs`, use `dv`, and render with a `dv.*` call rather than returning a value.

````markdown
```dataviewjs
const books = dv.pages('#book')
  .where(b => b.rating >= 4)
  .sort(b => b.rating, 'desc');

dv.table(
  ['Book', 'Genre', 'Rating'],
  books.map(b => [b.file.link, b.genre, b.rating])
);
```
````

`dv.pages()` takes the same source string DQL takes — a tag, a folder in quotes, a link, or a boolean combination of them. What comes back is a `DataArray`, a lazy list with `where`, `map`, `sort`, `groupBy`, `flatMap`, and friends. `dv.table()` wants headers as an array and rows as an array of arrays, and it renders nested arrays as bullets inside the cell, which is handy for multi-value fields.

## The queries you couldn't write before

Here is the thing DQL genuinely cannot do: computed aggregates across a group.

````markdown
```dataviewjs
const groups = dv.pages('"Projects"')
  .where(p => p.file.tasks.length > 0)
  .groupBy(p => p.status ?? 'unset');

dv.table(
  ['Status', 'Projects', 'Tasks done'],
  groups.map(g => {
    const tasks = g.rows.file.tasks.flat();
    const done = tasks.where(t => t.completed).length;
    const pct = tasks.length ? Math.round((done / tasks.length) * 100) : 0;
    return [g.key, g.rows.length, `${done}/${tasks.length} (${pct}%)`];
  })
);
```
````

Three things happened there that DQL has no syntax for: a null-coalescing default on a missing property, arithmetic across the children of a group, and string formatting on the result. Same for tasks — `dv.taskList(dv.pages('#ukulele').file.tasks.where(t => !t.completed))` gives you a live, checkable task list filtered by any predicate you can write, including ones that look at the parent note's frontmatter.

You also get async access when you need it. `await dv.io.load(path)` reads a file's raw text, which is how you build things like a dashboard that greps for a pattern the indexer doesn't track as a field.

## When not to reach for it

In 2026 the honest default is Bases first. It ships in the app, it's maintained by the Obsidian team, it has a visual editor, and since 1.9 it's grown table, card, list, and map views. For "show me my notes with these properties, sorted", Bases is faster and you don't own the maintenance.

Dataview's position has shifted accordingly. blacksmithgu's last commit was mid-2024 and 0.5.70 landed as a beta in April 2026 — treat the plugin as stable but effectively frozen. Thirty thousand lines of working code is not nothing, but it is code nobody is actively steering, and that is a real consideration for something rendering on every note open.

So the split I'd suggest: Bases for property-driven views, inline DQL for a live number inside a sentence, and DataviewJS only when you need computation, task-level predicates, or file I/O that neither of the other two can express. Keep the JS blocks few and in dashboard notes rather than scattered through your daily notes, because each one is a script that runs on render — and because the fewer you have, the cheaper it is the day you migrate them.

Start with the [code reference](https://blacksmithgu.github.io/obsidian-dataview/api/code-reference/) — it is short, and most of what you'll ever need is `dv.pages`, `dv.table`, `dv.list`, and `dv.taskList`.
