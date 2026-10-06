---
date: "2026-10-06T02:15:56.000-07:00"
tags: ["obsidian", "plugins", "markdown", "workflows", "community-plugins"]
draft: false
title: "The Obsidian Linter Plugin: Consistent Frontmatter Without the Discipline"
image: "/images/posts/obsidian-linter-plugin-consistent-frontmatter-without-the-discipline.jpg"
topic: "obsidian"
description: "Linter is Prettier for your vault. Here's how to set it up safely, which YAML rules make your Bases and Dataview queries trustworthy, and how to opt notes out."
---

Every vault drifts. You start with tidy frontmatter, a consistent tag style, and headings that step down one level at a time. Six months later you have notes with `tags: project`, notes with `tags: [Project]`, notes with `#project` buried in the body, and a handful with no frontmatter at all because you captured them on your phone in a hurry. Your Bases views and Dataview queries quietly skip the notes that don't match, and you don't notice until something you were sure existed fails to show up.

You could fix this with discipline. Or you could let a machine do it. The [Linter](https://github.com/platers/obsidian-linter) Community plugin is to your vault what Prettier is to a codebase: you decide the rules once, and it rewrites notes to match them every time you save.

## Getting it running without wrecking anything

Install it from Settings -> Community plugins -> Browse, search for "Linter", and enable it. Out of the box almost every rule is off, which is the right default. Before you turn anything on, make a backup or commit your vault if you use Git. Linter edits files in place, and one of its commands rewrites every note in the vault at once.

Next, decide when it should run. There are four triggers, and you can mix them:

- **Lint on save**: runs on the current file when you press `Ctrl/Cmd+S` (or `:w` in Vim mode). Turn on `Lint on save` in the plugin settings.
- **Lint on File Change**: runs when you close a note or switch to another one, which catches the notes you edit and forget to save manually.
- **Commands**: `Lint the current file` (default `Ctrl+Alt+L`), `Lint all files in the current folder`, and `Lint all files in the vault`.
- **File menu**: right-click a file or folder in the sidebar and lint it from there.

My suggestion: enable lint on save, then try your rules on one folder with the folder command before you ever touch the vault-wide one.

Finally, fence off what it should never touch. `Folders to Ignore` takes paths from the vault root, so your `Templates` folder doesn't get Templater syntax "fixed" into something broken. There is also a regex setting for ignoring files, which is handy for Excalidraw drawings:

```text
.*\.excalidraw\.md$
```

## The YAML rules that earn their keep

Linter has dozens of rules across YAML, headings, footnotes, content, spacing, and paste behavior. The YAML group is where it pays for itself, because frontmatter is what your queries actually read.

**YAML Timestamp** (`yaml-timestamp`) writes created and modified dates into frontmatter from file metadata. The default format is a human-friendly string like `Thursday, January 2nd 2020, 12:00:05 am`, which looks nice and is terrible for sorting. Change the format to an ISO-style Moment string and rename the keys to something your queries already use:

```yaml
# Linter settings -> YAML Timestamp
# Date Created Key:  created
# Date Modified Key: modified
# Format:            YYYY-MM-DDTHH:mm
---
created: 2026-10-06T09:14
modified: 2026-10-06T09:42
---
```

Also turn on `Force Date Created Key Value Retention`. Without it, a sync tool that resets file metadata can silently rewrite your creation dates. One honest caveat: there are open issues on the plugin's GitHub where the modified date doesn't always update when you lint immediately after an edit, so treat `modified` as "roughly when" rather than an audit log.

**Insert YAML attributes** (`insert-yaml-attributes`) guarantees certain keys exist on every note, even empty. That matters because a Bases filter on `status` can't match a note that doesn't have a `status` property:

```yaml
# Text to insert
aliases:
tags:
status:
```

**YAML Key Sort** (`yaml-key-sort`) puts keys in a fixed order, so every note's frontmatter reads the same way when you open it. List your priority keys one per line (say `created`, `modified`, `status`, `tags`) and choose whether the rest are sorted alphabetically or left alone.

**Format Tags in YAML** and **Move Tags to Yaml** clean up the tag mess from the intro: they normalize the tag syntax in frontmatter and can pull inline `#tags` from the body up into the `tags` property, so one place holds the truth.

## Opting out, per note or per paragraph

Some notes need to break the rules: a pasted code sample, a poem with deliberate spacing, a note that mirrors an external format. Linter gives you two escape hatches. Disable specific rules, or all of them, in a note's frontmatter using rule aliases:

```yaml
---
disabled rules: [capitalize-headings, header-increment]
---
```

Or protect just part of a note with a range ignore. Obsidian comments work, so the markers stay invisible in Reading view:

```markdown
Normal text gets linted.

%%linter-disable%%
This block keeps its weird spacing.
%%linter-enable%%

Back to normal.
```

If you leave off the closing marker, everything to the end of the file is ignored, so close your ranges.

## Where to go from here

Start small: YAML Timestamp, Insert YAML attributes, and lint on save. Live with that for a week, then add heading rules or Key Sort once you trust it. If you outgrow the built-in rules, Linter also supports custom regex replacements and custom commands that run after linting a single file. The [full rule reference](https://platers.github.io/obsidian-linter/) shows a before-and-after example for every rule, which is the fastest way to decide what belongs in your vault. The payoff isn't prettier Markdown. It's queries you can trust, because every note finally speaks the same dialect.
