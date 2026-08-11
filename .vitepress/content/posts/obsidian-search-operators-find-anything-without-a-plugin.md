---
date: "2026-08-11T02:07:46.000-05:00"
tags:
  [
    "obsidian",
    "pkm",
    "workflows",
    "productivity",
    "vault-organization-strategies",
  ]
draft: false
title: "Obsidian Search Operators: Find Anything Without a Plugin"
image: "/images/posts/obsidian-search-operators-find-anything-without-a-plugin.jpg"
topic: "obsidian"
description: "Obsidian's core Search has a real query language hiding behind the search box. Here's how file, path, line, block, section, task, and property operators replace half the plugins people install to find things."
---

You know the note exists. You wrote it. Something about a Postgres connection pool, in a meeting note or a daily note, sometime last spring. So you type `postgres` in the search box, get forty-seven results, and start scrolling. That scroll is the moment most people go looking for a search plugin.

You almost certainly do not need one. Obsidian's core Search has a genuine query language behind it, and it covers a lot of what people install Dataview to do. The catch is that the whole thing is documented on one help page that nobody reads twice, so most vaults use maybe ten percent of it.

## Narrow by where, not just what

The first thing to internalize is that a bare search term matches file contents. If you want to filter by _location_, you need operators.

`file:` matches the filename, `path:` matches the full path from the vault root, and both match any file in the vault, not just notes:

```
path:"Daily notes/2026-03" postgres
file:meeting postgres
```

That first query drops you from forty-seven results to whatever you wrote in March. `tag:` is worth calling out separately, because it is not just sugar for typing `#work`. It ignores matches inside code blocks and non-Markdown content, which makes it both faster and more accurate than a plain full-text search for the same string. One gotcha: `tag:#work` does not return `#myjob/work`, so nested tags need their own query.

You can negate anything with a leading hyphen, and group with parentheses:

```
tag:#project -path:Archive
meeting (work OR standup) -tag:#personal
```

## Scope the match: line, block, and section

This is the part that changes how search feels. By default, every word in your term is matched independently _anywhere in the same file_. Search for `flour sugar` and you get a note that mentions flour in a recipe at the top and sugar in an unrelated grocery list at the bottom. Technically a match. Practically useless.

Three operators tighten the radius:

```
line:(mix flour)
block:(dog cat)
section:(deploy rollback)
```

`line:` requires the words on the same line. `block:` requires them in the same Markdown block. `section:` requires them between the same pair of headings. Going back to the opening example, `section:(postgres "connection pool")` finds the note where you actually wrote about the thing, not the note that happens to contain both words a thousand words apart.

Worth knowing: `block:` has to parse the Markdown of every file in the vault, so on a large vault it is noticeably slower than the others. Reach for `line:` first and escalate.

## Tasks and properties

There are three task operators, and they work block by block: `task:` matches any task, `task-todo:` only unchecked ones, `task-done:` only completed ones. An empty string matches everything, which is how you get "every open task in the vault":

```
task-todo:"" tag:#work
task-done:deploy path:"Projects/api"
```

Properties get bracket syntax. `[aliases]` returns files that have that property at all, `[status:Draft]` matches a value, and `[aliases:null]` finds the property present but empty. Sub-queries work inside the brackets too:

```
[status:Draft OR "In review"]
[due] -task-done:""
```

One caveat on `null`: it matches a genuinely empty property, but not one set to empty quotes (`""`) or empty brackets (`[]`). If your templates write those, `null` will quietly miss them.

## Freeze a good query into a note

Once a query earns its keep, stop retyping it. A `query` code block embeds live search results directly in a note:

````markdown
```query
task-todo:"" tag:#work -path:Archive
```
````

Drop that in your daily note template and you have an open-tasks dashboard with no plugin, no dependency, and nothing to break when a maintainer walks away. It updates on its own, because it is just a search.

Two more things that live in the search pane and deserve more use. **Explain search term**, under Search settings, breaks a query down into plain English, which turns debugging a gnarly nested query from guesswork into reading. And regex works anywhere a term does, wrapped in forward slashes, including inside operators: `path:/\d{4}-\d{2}-\d{2}/` finds every note with an ISO date in its path.

None of this is new, which is sort of the point. The next time you catch yourself scrolling a result list, try adding one operator instead of opening the Community Plugins browser. Most of the time, `section:` is the whole answer.
