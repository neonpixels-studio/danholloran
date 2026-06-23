---
date: '2026-06-23T07:07:56.000+00:00'
tags: ['obsidian', 'pkm', 'note-taking', 'markdown', 'workflows', 'callouts']
draft: true
title: "Obsidian Callouts: Make Your Notes Scannable at a Glance"
image: '/images/posts/obsidian-callouts-make-your-notes-scannable-at-a-glance.jpg'
topic: 'obsidian'
description: "Obsidian's callout feature turns plain blockquotes into visual highlights — warnings, tips, collapsible sections, and custom types — using nothing but Markdown."
---

Most Obsidian notes start clean and turn into walls of text. The idea you needed to find was buried in there somewhere — you know you wrote it three weeks ago, but now you're scanning paragraph after paragraph to track it down. Callouts are Obsidian's answer to that problem: a way to make important content visually distinct without reaching for a plugin or learning a new system.

## What a Callout Actually Is

A callout is a styled blockquote that Obsidian parses specially when the first line starts with `[!type]`. The syntax is minimal:

```markdown
> [!note]
> This is a note callout. Obsidian renders it with a colored icon and box.
```

Obsidian ships with a solid set of built-in types, each with its own color and Lucide icon. The most useful ones:

- `note` — the default, blue pencil icon
- `tip` / `hint` / `important` — green lightbulb
- `warning` / `caution` / `attention` — yellow alert triangle
- `danger` / `error` — red lightning bolt
- `info` — blue info circle
- `success` / `check` / `done` — green checkmark
- `question` / `help` / `faq` — blue question mark
- `failure` / `fail` / `missing` — red X
- `bug` — red bug icon
- `example` — purple list icon
- `quote` / `cite` — gray quotation marks
- `abstract` / `summary` / `tldr` — cyan clipboard

You can give any callout a custom title by placing it after the type identifier on the first line:

```markdown
> [!warning] Don't skip this
> Renaming the vault root folder breaks all your links. Move the folder instead.
```

The type keyword is case-insensitive, so `[!NOTE]`, `[!Note]`, and `[!note]` all produce identical output. If you use a type Obsidian doesn't recognize, it falls back to the `note` style — so `[!recipe]` renders without breaking anything even before you add custom CSS.

## Foldable Callouts and Nesting

One feature that doesn't get enough attention: callouts can be collapsible. Add a `+` after the type to make it expanded by default, or a `-` to make it collapsed by default:

```markdown
> [!example]- Click to expand
> Here are three worked examples of the concept above.
```

This is useful for meeting notes, reference docs, or any note where some sections are supporting detail rather than content you need every time you open the file. You get accordion behavior without any plugin.

Callouts also nest cleanly. Drop a callout inside another by adding an extra `>` level:

```markdown
> [!info] Setting up the project
> Clone the repo and install dependencies.
>
>> [!warning] Node version
>> This project requires Node 20+. Run `node -v` before installing.
```

Each nested level renders with its own icon, color, and indent. It reads better than raw indented blockquotes and makes complex notes easier to skim.

## Custom Callouts with CSS Snippets

The built-in types cover most use cases, but you can define your own. If you have a specific workflow — say, a `[!decision]` callout for architectural decisions, or a `[!status]` block for project updates — a small CSS snippet handles it.

Go to Settings → Appearance → CSS Snippets and click "Open snippets folder." Create a `.css` file with:

```css
.callout[data-callout="decision"] {
  --callout-color: 130, 80, 255; /* RGB purple */
  --callout-icon: lucide-gavel;
}
```

Back in Settings, click "Reload snippets" and toggle the file on. Now `[!decision]` works in any note. The `--callout-icon` value accepts any Lucide icon name — the full list lives at [lucide.dev](https://lucide.dev). You can also override built-in types this way to change their colors or icons to better fit your theme.

If writing CSS by hand isn't your thing, the "Callout Manager" community plugin gives you a visual interface for creating and previewing custom callout types without touching a stylesheet.

## Building a Callout Habit

The trap with callouts is going overboard — wrapping every paragraph in a colored box defeats the purpose entirely. They work best when they signal something specific: a risk, a key decision, an action item, or a takeaway that shouldn't get lost on a second read.

A few patterns worth stealing: use `[!danger]` for destructive actions in runbook-style notes. Use `[!tip]` for things you wish you'd known when you first learned a topic. Use `[!abstract]` at the top of long research notes as a TL;DR. Use foldable `[!example]-` blocks for worked examples that clutter the reading flow when you don't need them.

None of this requires a plugin — callouts are a core Obsidian feature built on top of standard Markdown blockquote syntax. They work in both Reading View and Live Preview, and if you ever export your notes to another tool, they degrade gracefully to plain blockquotes. That's a rare combination: visually useful inside Obsidian, portable outside it.

The official reference is at [help.obsidian.md/callouts](https://help.obsidian.md/Editing+and+formatting/Callouts) if you want the full type list or the CSS variable reference.
