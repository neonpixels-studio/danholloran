---
date: "2026-07-28T02:08:00.000-05:00"
tags: ["obsidian", "plugins", "workflows", "productivity"]
draft: false
title: "Obsidian QuickAdd: Capture, Templates, and Macros Without Leaving Your Keyboard"
image: "/images/posts/obsidian-quickadd-capture-templates-and-macros-without-leaving-your-keyboard.jpg"
topic: "obsidian"
description: "QuickAdd turns Obsidian into a keyboard-driven capture machine. Here is how its Captures, Templates, and Macros actually work, with copy-paste examples."
---

The friction that kills most note-taking systems is the gap between having a thought and writing it down. You want to jot a quick idea, but first you have to find the right note, scroll to the right section, format the line, and by then the thought is gone. Obsidian's core Templates plugin helps a little, but it stops at "insert this text here." It cannot ask you a question, drop the answer into a file you are not currently looking at, and link it back to where you started.

That is the space [QuickAdd](https://quickadd.obsidian.guide/) fills. It is a Community plugin that bundles four choice types — Capture, Template, Macro, and Multi — into commands you trigger from the palette or a hotkey. Once configured, adding a timestamped log entry, spinning up a fully populated meeting note, or running a five-step workflow all become a single keystroke.

## Captures: append to a file you're not looking at

A Capture is the workhorse. It writes content into a predefined file without making you open it first. Open Settings → Community plugins → QuickAdd, type a name like "Log to journal," pick **Capture** in the dropdown, click **Add Choice**, then click the gear (⚙) to configure it.

The two fields that matter are **Capture To** and **Capture format**. Capture To is the destination path, and it accepts the same placeholder syntax as everything else in QuickAdd:

```
Journal/{{DATE:YYYY-MM-DD}}.md
```

Turn on Capture format and define the shape of one entry:

```
- {{DATE:HH:mm}} {{VALUE}}
```

Now trigger the command, type "called the dentist," and QuickAdd appends `- 14:32 called the dentist` to today's journal file — even though you were three notes away. `{{VALUE}}` opens a prompt and inserts whatever you type; if you had text selected in the editor, that selection becomes the value instead of prompting. The `{{DATE}}` placeholder takes a [Moment.js format string](https://quickadd.obsidian.guide/docs/FormatSyntax/) after the colon, and even supports a day offset like `{{DATE:YYYY-MM-DD+3}}` for "three days from now." Options like **Insert after** let you target a specific heading, so a capture can land under `## Log` rather than at the bottom of the file.

## Templates: new notes, fully filled in

A Template choice creates a whole new note from a template file. This is where QuickAdd earns its keep for anything repetitive — meeting notes, book notes, project kickoffs. You point the choice at a template, set a **File Name Format** (which also accepts placeholders), and choose the folder.

Say your template file contains:

```markdown
---
type: meeting
attendees: { { VALUE:who was there? } }
---

# {{VALUE:meeting title}}

Date:: {{DATE:YYYY-MM-DD}}
```

Set the file name format to `Meetings/{{DATE:YYYY-MM-DD}} {{VALUE:meeting title}}` and trigger the command. QuickAdd prompts you once for the title, once for attendees, builds the note, fills the frontmatter and date, and drops you into it ready to type. Named prompts like `{{VALUE:meeting title}}` reuse the same answer everywhere the name appears, so the title flows into both the filename and the heading from a single question.

## Macros: chain it all into one keystroke

A Macro is what separates QuickAdd from lighter tools. It chains several actions into one command and passes data from step to step. A single macro can capture a line to your daily note, then open a template-generated project note, then run a bit of inline JavaScript to fetch the current clipboard URL and drop it in. Because macros can call user scripts, this is also where QuickAdd overlaps with [Templater](https://quickadd.obsidian.guide/docs/ComingFromTemplater/) — but with a menu-driven flow instead of embedding logic in every template.

A practical macro: "New reading note" captures the highlighted title to a `Reading/Inbox.md` list, then creates a book note from a template, then adds a backlink between them. You build it by adding each choice to the macro in order; QuickAdd runs them top to bottom.

The payoff is compounding. Each individual choice is small, but once you have a handful bound to hotkeys, the mechanical overhead of maintaining a vault mostly disappears. Start with one Capture for your most common quick note, live with it for a week, and add the next piece only when you feel the friction. The [Getting Started guide](https://quickadd.obsidian.guide/docs/) is the fastest way in, and the format syntax page is worth bookmarking — most of QuickAdd's power lives in those placeholders.
