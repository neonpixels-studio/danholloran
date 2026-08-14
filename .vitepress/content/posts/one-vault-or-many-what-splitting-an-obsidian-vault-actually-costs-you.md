---
date: "2026-08-14T02:08:50.000-05:00"
tags:
  [
    "obsidian",
    "pkm",
    "knowledge-management",
    "workflows",
    "vault-organization-strategies",
  ]
draft: false
title: "One Vault or Many? What Splitting an Obsidian Vault Actually Costs You"
image: "/images/posts/one-vault-or-many-what-splitting-an-obsidian-vault-actually-costs-you.jpg"
topic: "obsidian"
description: "Splitting your Obsidian vault feels like tidying up, but a vault boundary is a hard wall your search, links, and queries cannot cross. Here is what you actually give up, and when it is worth it."
---

Every few months someone in the Obsidian forums asks the same question: should I keep one big vault, or split my notes into a work vault and a personal vault? The answers usually turn into a preference argument, which is a shame, because it isn't really one. A vault boundary is not an organizational choice like a folder or a tag. It's a hard wall, and almost everything that makes Obsidian interesting stops at it.

Understanding exactly what stops at that wall makes the decision much easier than debating aesthetics.

## A vault is a folder with a config folder in it

There is nothing mystical here. A vault is a folder on your file system containing your notes, your attachments, and a `.obsidian` configuration folder holding the settings for that vault specifically. That last part is the one people underestimate.

Your enabled community plugins, your hotkeys, your theme, your CSS snippets, your Templater templates directory, your daily note format — all of it lives in `.obsidian`, inside one vault. Create a second vault and you get factory defaults. Obsidian's own documentation is blunt about the fix: copy the `.obsidian` folder from the source vault to the destination vault, then restart. That's the supported migration path.

Which means every settings change you make from then on is a change you make twice, or a change you forget to make twice. Six months in, your second vault is running a plugin version behind and a hotkey map you no longer remember.

## Everything that stops at the boundary

This is the part worth being concrete about, because it's a longer list than most people expect:

- **Search.** Global search covers one vault. There is no "search all my vaults."
- **Links.** `[[Wikilinks]]` resolve within a vault. You cannot link a work note to a personal note.
- **Backlinks and unlinked mentions.** Same story — vault-scoped, so cross-vault connections are simply invisible.
- **Graph view.** Two vaults means two graphs that never touch.
- **Dataview, Bases, and Tasks queries.** Every one of them queries the current vault only.
- **Tags.** A `#reading` tag in one vault and a `#reading` tag in another are unrelated strings.

There is one escape hatch, and it's narrow. The Obsidian URI protocol will open a note in another vault:

```markdown
[Client brief](obsidian://open?vault=work&file=clients%2Facme%2Fbrief)
```

That works, and it's genuinely useful for a handful of deliberate jumps. But note what it is: an external protocol link, not a wikilink. It doesn't create a backlink. It doesn't appear in the graph. It won't be found by a Dataview query. And it breaks if you rename the vault, unless you use the 16-character vault ID instead of the name — which you can copy from the vault switcher's context menu. It's a doorway between two buildings, not a hallway inside one.

## When a split is actually the right call

None of that means one vault always wins. Some separations are real, and folders can't express them:

- **Confidentiality.** A client vault you can hand over, archive, or delete without disentangling it from your journal. Same for anything under an NDA that shouldn't sit on the same sync as your grocery lists.
- **Different machines or accounts.** A work laptop that shouldn't hold personal notes at all.
- **Publishing.** A vault you intend to publish wholesale is easier to reason about when everything in it is meant to be public.
- **Genuinely different tooling.** A vault built around Excalidraw and canvases has little in common with a plaintext writing vault, and keeping the plugin sets apart keeps both faster.

The pattern in all four: the separation already exists in the real world. The vault boundary is just recording it. That's very different from splitting because your file tree got long.

## Try the cheaper fixes first

If the actual complaint is "my vault feels cluttered," the boundary is the wrong tool. A top-level folder split gives you nearly all the visual separation with none of the cost, and search still crosses it when you want it to. Search operators narrow scope on demand — `path:work/ meeting` gets you a work-only search without giving up the option of a global one. The Workspaces core plugin saves and restores entire pane layouts, so switching from "work mode" to "writing mode" is a command, not an app restart. And Bookmarks pins the handful of notes you actually open every day, which is usually the real problem hiding behind "too many files."

My honest default: start with one vault and split only when you can name the specific thing that forces it. Merging two vaults later is a drag-and-drop plus some link repair. Un-splitting a knowledge base you've spent two years failing to connect is a much harder afternoon.
