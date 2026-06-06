---
date: "2026-06-06T07:08:27.000+00:00"
tags: ["obsidian", "dataview", "workflows", "productivity"]
draft: false
title: "Using Dataview for Project Tracking in Obsidian"
image: "/images/posts/using-dataview-for-project-tracking-in-obsidian.jpg"
topic: "obsidian"
description: "Turn your Obsidian vault into a self-updating project tracker with Dataview: frontmatter conventions, a live dashboard, and task queries that never go stale."
---

Every hand-maintained "Active Projects" note has the same fatal flaw: it's accurate for about a week. You finish a project and forget to remove it from the list. You start two more and never add them. Eventually the index lies to you badly enough that you stop trusting it, and you're back to scrolling folders to figure out what you're actually working on.

The Dataview plugin fixes this by inverting the relationship. Instead of writing the index by hand, you give each project note a little structured metadata and let queries assemble the dashboard for you. The list updates itself the moment a note changes — finish a project, flip one frontmatter field, and it falls off the active list on its own. Dataview is a Community plugin, so install it from Settings → Community plugins before following along.

## Step 1: Give every project note the same frontmatter

Dataview can only query what you've made queryable. The foundation is a consistent properties block at the top of each project note. Mine live in a `Projects/` folder and start like this:

```markdown
---
type: project
status: active
deadline: 2026-07-15
area: work
priority: 2
---
```

Keep the vocabulary small and boring: `status` is one of `active`, `waiting`, `someday`, or `done`, and that's it. Consistency matters more than expressiveness — `Active` and `active` are different values to Dataview, which is exactly the kind of silent mismatch that makes queries return mysteriously empty tables. A Templater or core Templates template for new project notes is the easiest way to keep yourself honest.

You can also attach metadata inline anywhere in a note with double-colon fields, like `next-action:: send draft to Sarah`. Inline fields are handy for values that change often, since you can edit them mid-note without scrolling to the top.

## Step 2: Build the dashboard

Create a note called `Project Dashboard` and drop in a query:

````markdown
```dataview
TABLE status, deadline, next-action AS "Next Action"
FROM "Projects"
WHERE type = "project" AND status = "active"
SORT deadline ASC
```
````

That renders a live table of every active project, soonest deadline first, with each row linked to its note. Want to see what's blocked? Duplicate the block and change the `WHERE` to `status = "waiting"`. A "recently shipped" log is one more block:

````markdown
```dataview
TABLE deadline AS "Was Due", area
FROM "Projects"
WHERE status = "done"
SORT file.mtime DESC
LIMIT 10
```
````

The dashboard note itself never gets edited again. All the action happens in the project notes, where it belongs.

## Step 3: Surface the actual work

A project tracker that only shows project titles still leaves you opening each note to find the next step. Dataview's `TASK` query type pulls checkbox items out of notes directly:

````markdown
```dataview
TASK
FROM "Projects"
WHERE !completed AND contains(text, "#next")
GROUP BY file.link
```
````

Tag a checkbox with `#next` inside any project note and it appears on the dashboard, grouped by project, checkable right from the query results. Pair that with a deadline guard — `WHERE deadline AND deadline < date(today) + dur(7 days)` on a `LIST` query — and you've got a "due this week" section that catches things before they're late rather than after.

One honest caveat: Obsidian shipped Bases as a core feature, and it covers some of the same ground with a no-code, spreadsheet-style interface. If your needs stop at "show me a sortable table of notes," Bases may be enough. Dataview earns its install when you want computed values, task queries, and `WHERE` clauses with real logic in them.

The pattern to take away is structure once, query forever. Spend ten minutes adding frontmatter to your project notes and a dashboard maintains itself indefinitely. The [Dataview documentation](https://blacksmithgu.github.io/obsidian-dataview/) is excellent when you're ready to go deeper — calculated fields, `GROUP BY` rollups, and DataviewJS for anything the query language can't express.
