---
date: "2026-06-11T07:09:22.000+00:00"
tags: ["obsidian", "pkm", "plugins", "templater", "workflows", "note-taking"]
draft: false
title: "Templater for Obsidian: Stop Writing the Same Thing Twice"
image: "/images/posts/templater-plugin-stop-writing-the-same-thing-twice.jpg"
topic: "obsidian"
description: "The Templater plugin turns Obsidian's static template system into a real automation engine — dynamic dates, user prompts, folder triggers, and optional JavaScript make note creation genuinely effortless."
---

Every Obsidian user eventually hits the same wall. You create a new meeting note and spend the first thirty seconds typing the date, filling in the same status field, adding the same tags you always add. You do this for project notes, book notes, weekly reviews. The core Templates plugin helps a little — it can insert a fixed block of text — but it has no idea what time it is, it can't ask you for input, and it won't run automatically when you create a new file.

That's where Templater comes in.

## What Templater Does That Core Templates Can't

Templater is a Community plugin (Settings → Community plugins → Browse, search "Templater") built by SilentVoid13. Where Obsidian's built-in Templates feature does simple text substitution with a handful of hardcoded variables like `{{date}}` and `{{title}}`, Templater runs a full expression engine every time a template is applied.

The difference in practice is significant. Here's a core Templates date:

```markdown
{{date}}
```

And here's the Templater equivalent with real control over formatting:

```markdown
<% tp.date.now("YYYY-MM-DD, dddd") %>
```

That second version doesn't just insert today's date — you can offset it, format it however you want, and combine it with other logic. You can insert yesterday (`tp.date.yesterday`), calculate a due date a week out (`tp.date.now("YYYY-MM-DD", 7)`), or use the note's own creation date instead of the system clock.

Beyond dates, Templater gives you `tp.file` (access the note's title, path, folder), `tp.system.prompt` (ask the user for input mid-creation), and `tp.system.suggester` (show a dropdown of choices). These alone cover the vast majority of real-world template use cases without requiring any custom JavaScript.

## Practical Templates You Can Use Today

Here's a meeting note template that dynamically fills in today's date, prompts for the meeting title, and pre-fills a standard structure:

```markdown
---
date: <% tp.date.now("YYYY-MM-DD") %>
attendees:
status: open
tags: [meetings]
---

# <% await tp.system.prompt("Meeting title") %>

**Date:** <% tp.date.now("dddd, MMMM D, YYYY") %>

## Agenda

## Notes

## Action Items

- [ ]
```

When you apply this template, Templater fires a prompt asking for the meeting title, then inserts everything in one shot. The note is ready to write in before you've even moved your hands.

Here's a project note template that uses `tp.file.title` to avoid repeating yourself:

```markdown
---
created: <% tp.date.now("YYYY-MM-DD") %>
status: active
tags: [projects]
---

# <% tp.file.title %>

## Goal

## Tasks

- [ ]

## Notes
```

Because `tp.file.title` reads whatever you named the file, you don't need to type the project name twice.

## Folder Templates: The Feature That Changes Everything

The most powerful Templater setting is one a lot of people miss: **Folder Templates**. Found under Settings → Templater → Folder Templates, this lets you map a folder path to a template file. Any new note created inside that folder — whether you use Quick Switcher, the New Note button, or a link — automatically gets the template applied on creation.

Set `Projects/` to use your project template, `Meetings/` to use your meeting template, `Books/` to use your book note template. From that point on, you never manually apply templates again. Create the note in the right folder and it shows up fully formed.

This pairs especially well with a folder-based vault structure. If you're using the PARA method or any folder-first organization approach, folder templates are the natural complement — each area of your vault has its own default note shape.

## Going Further with JavaScript

For users who want more, Templater lets you drop into JavaScript using execution tags (`<%* ... %>`). This is where you can do things like rename the file on creation, conditionally include sections based on user input, or fetch data from an external API.

```markdown
<%\*
const type = await tp.system.suggester(
["Meeting", "1-on-1", "Workshop"],
["meeting", "one-on-one", "workshop"]
);
await tp.file.rename(`${tp.date.now("YYYY-MM-DD")}-${type}`);
%>
```

This snippet asks the user to pick a note type from a list, then renames the file to `2026-06-11-meeting` (or whatever they chose) automatically. The `<%* %>` execution tag runs the code without inserting any output into the document.

You don't need to touch JavaScript to get a lot out of Templater — `tp.date`, `tp.file`, and `tp.system` cover the majority of workflows. But it's there when you need it, and the [Templater documentation](https://silentvoid13.github.io/Templater/) is thorough if you want to explore.

## Getting Started

Install Templater from the Community plugins browser, then create a `Templates/` folder in your vault if you don't have one. Set the Template folder location under Settings → Templater → Template folder location. Start with one template — a daily note or a meeting note — and get a feel for how the syntax works before building out your whole system. The jump from Obsidian's core Templates to Templater is one of those upgrades that's immediately obvious and hard to go back from.
