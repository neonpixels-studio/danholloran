---
date: "2026-09-11T02:07:54.000-07:00"
tags:
  [
    "obsidian",
    "pkm",
    "note-taking",
    "workflows",
    "vault-organization-strategies",
  ]
draft: false
title: "Obsidian's Note Composer: Refactor Your Notes Without Copy-Paste"
image: "/images/posts/obsidian-note-composer-refactor-your-notes-without-copy-paste.jpg"
topic: "obsidian"
description: "Note composer is a core Obsidian plugin that merges notes and extracts selections into new ones, rewriting your links as it goes. Here's how to actually use it."
---

Every vault eventually grows a note that should have been five notes. It started as "API Ideas," picked up a section on rate limiting, then a section on auth, then a running list of vendors you evaluated. Now you want to link to the rate limiting part from somewhere else, and you can't, because it isn't a note. It's a heading buried in a 900-word dumping ground.

The obvious fix is to select the section, cut it, create a new note, paste it, then go hunting for anything that linked to the old note to make sure nothing broke. That's four manual steps and one silent failure mode. Obsidian ships a core plugin that does all of it for you, and most people never turn it on.

## Turning it on and what it actually does

Note composer lives in **Settings → Core plugins**. No download, no community plugin risk, no supply chain to audit. Flip it on and you get two commands in the command palette:

- `Note composer: Merge current file with another file...`
- `Note composer: Extract current selection...`

Merge takes the note you're in, appends or prepends it to a destination note, deletes the original, and **updates every link in your vault that pointed to the deleted note** so they point at the destination instead. That last part is the whole reason to use it rather than copy-paste. Extract does the inverse: it takes whatever text you've highlighted and moves it into another note, new or existing.

Both commands are also available by right-clicking. Right-click a file in the File explorer for **Merge entire file with...**, or right-click a selection in the editor for **Extract current selection...**.

The modifier keys in the destination picker are where the real control is, and the dialog doesn't advertise them:

| Key                        | Behavior                                             |
| -------------------------- | ---------------------------------------------------- |
| `Enter`                    | Add content to the **end** of the destination note   |
| `Shift+Enter`              | Add content to the **start** of the destination note |
| `Ctrl+Enter` / `Cmd+Enter` | Create a **new** note with the content               |

So `Cmd+Enter` is your "split this out into its own atomic note" shortcut. Highlight the rate limiting section, run Extract, type the new name, hit `Cmd+Enter`. Done.

## The setting that changes the workflow

By default, extracting leaves a link behind where the text used to be. Your original note keeps its shape, and the extracted section becomes a clickable pointer. That's usually what you want for a hub note that should stay readable as an outline.

But there are two other options in the plugin settings, and picking the right one per workflow matters more than it sounds:

- **Replace with link** (default) — the outline stays intact, the detail moves out.
- **Replace with embed** — the original note still _renders_ the full content via `![[Extracted Note]]`, so nothing visually changes, but the text now lives in exactly one place. This is the right choice when you're deduplicating: you want one source of truth without breaking a document someone reads top to bottom.
- **Remove** — leaves nothing behind. Use this when you're genuinely dismantling a note rather than refactoring it.

Worth knowing before you start merging aggressively: Obsidian asks for confirmation on merges by default. If you disable that prompt to move faster and then merge the wrong pair, the **File recovery** core plugin still has snapshots of the deleted note. Enable File recovery before you disable the confirmation, not after.

## Templates make extracted notes consistent

The piece that turns Note composer from a convenience into a real workflow is the **Template file location** setting. Point it at a template note and every extracted or merged note gets built from it instead of arriving as a bare wall of text.

The template supports four variables:

```markdown
---
created: { { date:YYYY-MM-DD } }
source: "[[{{fromTitle}}]]"
tags: [atomic]
---

# {{newTitle}}

{{content}}
```

`{{content}}` is the extracted text, `{{fromTitle}}` is the note it came from, `{{newTitle}}` is the new note's name, and `{{date:FORMAT}}` takes any Moment format string. If you leave `{{content}}` out entirely, Obsidian appends the content at the bottom of the template rather than dropping it.

That `source: "[[{{fromTitle}}]]"` line is doing quiet work. Every note you extract carries a backlink to its parent automatically, so your graph stays connected instead of accumulating orphans — which is the usual cost of splitting notes apart by hand.

## Where the core plugin stops

Two limits to know about. First, there's no built-in "split this note at every heading" command — the core plugin extracts one selection at a time. If you regularly need to atomize a long note in one pass, the community plugin **Note Refactor** has a split-by-headings command that covers H1 through H6.

Second, Note composer updates links to the note it moved, but it doesn't always fix _relative_ links inside the content being moved. The community plugin **Advanced Note Composer** extends the core behavior specifically to rewrite those relative links so they don't break when content changes location. If your vault uses relative link resolution rather than shortest-path, that one is worth the install.

Neither is necessary to start. Turn on the core plugin, set up a three-line template, and the next time you hit a note that's outgrown itself, refactor it in about six seconds instead of six minutes.

Full details are in the [official Note composer documentation](https://help.obsidian.md/plugins/note-composer).
