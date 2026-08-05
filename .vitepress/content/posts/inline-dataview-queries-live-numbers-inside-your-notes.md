---
date: "2026-08-04T02:07:44.000-05:00"
tags: ["obsidian", "dataview", "pkm", "workflows", "dataview-plugin"]
draft: false
title: "Inline Dataview Queries: Live Numbers Inside Your Notes"
image: "/images/posts/inline-dataview-queries-live-numbers-inside-your-notes.jpg"
topic: "obsidian"
description: "Dataview code blocks give you tables. Inline queries give you a single live value in the middle of a sentence, which turns out to be the feature you reach for far more often."
---

Most people meet Dataview through the big fenced code block: a `dataview` block that spits out a table of every project, every book, every unfinished task. It is genuinely great, and it is also the reason a lot of vaults end up with one enormous dashboard note that nobody reads and a hundred ordinary notes still full of hand-typed numbers that went stale weeks ago.

The line at the top of a project note that says "3 open tasks, due in 12 days" is the problem. You wrote it once, it was true once, and now it quietly lies. A table cannot fix that, because a table is not a sentence. What fixes it is the part of Dataview almost nobody uses on day one: the inline query.

## One backtick and an equals sign

An inline DQL query is an inline code span whose content starts with `=`. Dataview replaces the whole span with the computed value when the note renders:

```markdown
Last edited `= this.file.mtime`, filed under `= this.area`.
```

`this.` refers to the current page, so `this.file.name`, `this.file.mtime`, and any property you have defined in frontmatter or as an inline field are all fair game. You can reach into another note with link syntax:

```markdown
The kickoff deck lives in `= [[Q3 Launch]].file.folder`.
```

Two constraints keep this honest. An inline DQL query always renders **exactly one value**, never a list or a table. And query types and data commands (`TABLE`, `FROM`, `WHERE`, `SORT`) are not available inside inlines. What you get instead is the full expression and function library, which is more than enough:

```markdown
Ships in `= this.deadline - date(today)`.

Status: `= choice(this.blocked, "**Blocked**", "Moving")`.
```

That `choice()` call is the whole trick in miniature. The sentence reads like prose, and it rewrites itself the moment the `blocked` property flips.

If the `=` prefix collides with something in your writing, Settings → Community plugins → Dataview → Codeblock Settings → Inline Query Prefix will let you change it to `dv:` or `~` instead.

## Where this actually earns its keep

The obvious use is a daily note header. Instead of a dashboard you have to navigate to, the count comes to you:

```markdown
# `= dateformat(date(today), "cccc, LLLL d")`

`= length(filter(this.file.tasks, (t) => !t.completed))` open today.
Weather planning: `= choice(date(today).weekday > 5, "weekend pace", "workday pace")`.
```

The second use is subtler and better: metadata that reads as English. Dataview indexes inline fields written with a double colon, so a project note can carry its own state in a sentence rather than in a properties block nobody scrolls up to check.

```markdown
Currently status:: waiting on legal, owner:: Dana, review-by:: 2026-08-19.

That is `= this.review-by - date(today)` from now, which means
`= choice(this.review-by - date(today) < dur("7 days"), "escalate this week", "no action yet")`.
```

Note the field names. `status` and `Status` are different fields to Dataview, and `"Active"` will never match `"active"` in a comparison. Inline fields make this failure mode easier to hit than frontmatter does, because you are typing them mid-sentence rather than filling in a template. Pick lowercase, hyphenated names and never deviate.

The third use is index and MOC notes. A map-of-content page that says "42 notes" is wrong the day after you write it, but this is not:

```markdown
This area holds `= length(link(this.file.name).file.inlinks)` linked notes.
```

## When to reach for the JS variant, and when to stop

There is a second inline form, prefixed with `$=`, that runs Dataview's JavaScript API and can output multiple values:

```markdown
`$= dv.current().file.tasks.where(t => !t.completed).length`
```

It is more capable and correspondingly more dangerous. Dataview JS has access to your file system, so never paste a `dataviewjs` snippet from a forum thread you have not read line by line. For most inline needs, plain DQL with `choice()`, `length()`, and `filter()` covers it without opening that door.

The bigger caution is portability. Every inline query is Dataview-specific syntax living inside your Markdown. Open the vault in any other editor, or hand a note to a colleague, and they see a literal backtick-equals string instead of a number. Obsidian's core Bases plugin now handles the table-shaped half of this problem natively, but there is no core equivalent for a computed value inside a paragraph. That is a real trade: you are buying live prose with plugin lock-in.

Which is fine, as long as you spend it deliberately. Use inline queries for the handful of numbers you would otherwise be tempted to hand-update, and leave everything else as plain text. The [Dataview documentation on DQL, JS, and inlines](https://blacksmithgu.github.io/obsidian-dataview/queries/dql-js-inline/) is the reference worth bookmarking; the [expression and function pages](https://blacksmithgu.github.io/obsidian-dataview/reference/functions/) are where the good ideas hide.
