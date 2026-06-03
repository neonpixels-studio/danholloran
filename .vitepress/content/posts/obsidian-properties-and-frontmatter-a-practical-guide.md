---
date: "2026-06-03T07:05:08.000+00:00"
tags:
  [
    "obsidian",
    "pkm",
    "note-taking",
    "properties-and-frontmatter",
    "markdown",
    "workflows",
  ]
draft: false
title: "Obsidian Properties and Frontmatter: Stop Treating Metadata as an Afterthought"
image: "/images/posts/obsidian-properties-and-frontmatter-a-practical-guide.jpg"
topic: "obsidian"
description: "Obsidian's Properties panel makes YAML frontmatter approachable for every note, and pairing it with typed fields and Dataview queries turns your vault into a genuinely queryable database."
---

You add a tag here, a status field there — and suddenly half your notes have inconsistent frontmatter, your Dataview queries keep returning empty tables, and you're not sure which notes even have a `due_date` key. Metadata in Obsidian is powerful, but it's easy to let it sprawl into something unmaintainable.

The good news: since Obsidian 1.4, there's been a much better way to work with this stuff. The Properties panel — and a handful of conventions that go with it — can turn your vault's frontmatter from a mess of ad-hoc YAML into a coherent system you actually want to use.

## What Properties Are (and What Changed in 1.4)

Every note in Obsidian can have a YAML frontmatter block at the very top, flanked by triple dashes:

```yaml
---
title: "My Note"
status: in-progress
tags: [projects, writing]
due: 2026-06-15
---
```

Before Obsidian 1.4, this was raw YAML — useful, but opaque. You had to know the exact key names, remember your own conventions, and edit text to change anything. The Properties panel changed that. Open any note and you'll see a structured form above the document body where you can add, edit, and type your properties without touching raw YAML. Click `+` to add a field, choose a type (text, number, date, checkbox, list), and Obsidian handles the YAML serialization for you.

This matters because typed properties aren't just cosmetic. A field typed as `date` stores its value in ISO format so it can be sorted, filtered, and compared by plugins like Dataview. A field typed as `checkbox` stores `true` or `false`. A `list` becomes a proper YAML array. Getting these types right upfront saves a lot of corrective work later.

You can manage your global property types under **Settings → Properties view** — this is where you define, once, that `due` is always a date or that `rating` is always a number. From that point on, every note that uses those keys respects the same type.

## Building a Useful Schema

The most common mistake is treating frontmatter as freeform: adding whatever feels relevant to each note without a consistent schema. The result is noise that's impossible to query reliably.

A better approach is to decide on a small set of properties that apply across a note type, then apply them consistently — ideally via a Templater template that pre-populates the frontmatter. Here's an example schema for a book note:

```yaml
---
title: "The Pragmatic Programmer"
author: "David Thomas, Andrew Hunt"
status: reading
rating:
tags: [books, programming]
finished:
---
```

And for a project note:

```yaml
---
title: "Redesign the onboarding flow"
status: active
priority: high
due: 2026-07-01
tags: [projects, work]
---
```

The key is that `status`, `priority`, and `due` mean the same thing across every project note in your vault. That consistency is what lets you write queries that actually work.

## Querying Your Properties with Dataview

Once your frontmatter is typed and consistent, Dataview (Community plugin) becomes genuinely useful. Here's a simple table query that lists all active projects sorted by due date:

```dataview
TABLE status, priority, due
FROM #projects
WHERE status = "active"
SORT due ASC
```

Or a reading list that shows only books you've finished and rated:

```dataview
TABLE author, rating, finished
FROM #books
WHERE status = "finished" AND rating != null
SORT rating DESC
```

Dataview reads directly from your YAML frontmatter, so the quality of your queries is entirely dependent on the quality of your metadata. Typed properties, consistent key names, and populated fields are what separate a useful Dataview table from a frustrating, always-half-empty one.

One caveat: Dataview treats missing fields and empty fields differently. `WHERE rating != null` filters out notes where the key doesn't exist, but notes with an empty `rating:` field will pass that filter (they'll have a `null` value in Dataview's type system). If you want to exclude empties too, use `WHERE rating AND rating != null`.

## Keeping It Sustainable

The biggest risk with a properties system is over-engineering it. Five well-maintained fields are more useful than twenty inconsistently-filled ones. A few habits that help:

Start every note type with a template that includes only the fields you'll actually fill in — [Templater](https://community.obsidian.md/plugins/templater-obsidian) makes this easy. Review your global property list periodically and delete keys you've stopped using. And when you find yourself adding a one-off property to a single note, ask whether it belongs in the frontmatter at all or whether it's just inline content.

The [Obsidian Properties documentation](https://help.obsidian.md/Editing+and+formatting/Properties) is a solid reference for type syntax and limitations, and the [Obsidian forum](https://forum.obsidian.md) has plenty of community-shared schemas if you want inspiration for a specific note type. A little upfront investment in your metadata conventions pays off the moment your vault grows large enough that you need to find things fast.
