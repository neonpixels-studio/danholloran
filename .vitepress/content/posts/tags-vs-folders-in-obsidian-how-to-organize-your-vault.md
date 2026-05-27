---
date: "2026-05-27T07:05:47.000+00:00"
tags:
  ["obsidian", "pkm", "note-taking", "workflows", "tag-vs-folder-organization"]
draft: false
title: "Tags vs. Folders in Obsidian: How to Organize Your Vault Without Going Crazy"
image: "/images/posts/tags-vs-folders-in-obsidian-how-to-organize-your-vault.jpg"
topic: "obsidian"
description: "Folders and tags both have a place in Obsidian, but they solve fundamentally different problems. Here's how to use each one effectively so your vault stays navigable no matter how big it gets."
---

At some point every Obsidian user hits the same wall. You've got a hundred notes, maybe two hundred, and suddenly the file explorer feels like a filing cabinet that someone sneezed on. Do you add more folders? Create a new tag? Reorganize everything from scratch? The temptation to build an elaborate system is real — and so is the regret that comes after spending a weekend reorganizing instead of actually writing.

The good news: folders and tags aren't in competition. They're tools for different jobs, and once you understand what each one is actually _for_, the decisions get a lot easier.

## Folders Are for Location, Not Context

Think of folders the way you think of rooms in a house. A room tells you where something lives — the kitchen, the office, the garage. It doesn't tell you what the thing _means_ to you or how it connects to other things. Folders work the same way.

A good folder structure in Obsidian is shallow and stable. Most experienced vault builders recommend no more than two levels deep: a top-level category (say, `Work`, `Personal`, `Resources`) and maybe one subfolder beneath it. Beyond that, you're creating a treasure hunt for future-you. After a few months you genuinely forget where you put things, and deeply nested folders become more of a burden than a benefit.

The bigger limitation with folders is exclusivity: a note can only live in one folder. If you have a note that's both a `Project` reference and a `Reference/Books` entry, folders force you to pick one. That's where tags come in.

## Tags Are for Discovery, Not Structure

Tags are signals. They let you say "this note shares a property with these other notes" without moving the note anywhere. The power shows up when you click a tag in the Tags panel and suddenly see every related note across your entire vault — regardless of which folder it lives in.

The best tags describe _what a note is_ or _how you're using it_, not _where it belongs_. A few patterns that work well in practice:

**Status tags** keep your workflow visible:

```
#status/active
#status/waiting
#status/done
```

**Type tags** classify the kind of note:

```
#type/reference
#type/project
#type/daily-note
#type/fleeting
```

**Topic tags** group notes by subject matter:

```
#obsidian
#productivity
#writing
```

Obsidian's nested tag support is genuinely useful here. Searching `#status` returns every note with any status subtag — `#status/active`, `#status/done`, all of it. In the Tags panel they render as a collapsible tree, which makes it easy to get a bird's-eye view of your vault without opening a single note.

One thing to avoid: don't replicate your folder structure in your tags. If you already have a `Work/Projects` folder, you don't also need a `#work/projects` tag. That's just double bookkeeping, and it creates maintenance overhead every time you rename something.

## Where Properties Fit In

Since Obsidian 1.0 introduced the Properties panel (formerly frontmatter), there's a third organizational layer worth knowing about. Properties are YAML key-value pairs that live at the top of a note, and they're increasingly useful for structured data:

```yaml
---
status: active
type: reference
source: "Deep Work by Cal Newport"
rating: 5
---
```

The key difference between properties and tags is _queryability_. With the Dataview plugin or Obsidian's built-in Bases view, you can query on properties to build dynamic tables and dashboards. Tags are great for filtering; properties are great for structured data you want to compute with.

A practical split: use tags for loose categorization and discovery, and properties for anything you want to appear in a table or be sorted/filtered programmatically.

## A System That Actually Scales

Here's what a sustainable vault structure looks like in practice:

- **A small set of top-level folders** for genuinely distinct areas of your life (e.g., `Projects`, `Areas`, `Resources`, `Archive` — the PARA method maps cleanly here)
- **Tags for cross-cutting concerns** — status, type, topic — that cut across those areas
- **Properties for structured data** you want to query with Dataview or Bases

The most important principle is to keep the folder structure stable and let tags do the flexible work. Rename a tag with a search-and-replace; rename a folder and you might break links. Tags are cheap to add and modify. Lean on them.

If you want to dig deeper into this, the [Obsidian Forum's knowledge management section](https://forum.obsidian.md/c/knowledge-management/6) is one of the best places to see real vault setups from people who've thought hard about this. You'll find everything from minimalist single-folder setups to elaborate PARA implementations — and somewhere in there is the amount of structure that's right for you.
