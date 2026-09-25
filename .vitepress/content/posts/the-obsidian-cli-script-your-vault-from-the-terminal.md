---
date: "2026-09-25T02:15:09.000-07:00"
tags: ["obsidian", "productivity", "workflows", "obsidian-for-developers"]
draft: false
title: "The Obsidian CLI: Script Your Vault From the Terminal"
image: "/images/posts/the-obsidian-cli-script-your-vault-from-the-terminal.jpg"
topic: "obsidian"
description: "Obsidian 1.12 ships an official command line interface. Here's how to use it to capture notes, query tasks and Bases, and run vault health checks from shell scripts."
---

For years, automating Obsidian from outside the app meant picking your poison. You could write directly to the Markdown files and hope Obsidian noticed, lean on Obsidian URIs that open windows you did not ask for, or install a community plugin that exposes a local REST API. All of them worked, sort of, and none of them understood your vault the way Obsidian does: how wikilinks resolve, which note is today's daily note, what your templates expand to.

Obsidian 1.12 closed that gap with an official command line interface. It ships inside the app, it talks to the running Obsidian instance, and according to the [official docs](https://obsidian.md/help/cli) "anything you can do in Obsidian you can do from the command line." If you live in a terminal, this changes how your vault fits into the rest of your tooling.

## Turning It On

The CLI needs the 1.12 **installer**, not just an in-app update. If you have been updating in place for a while, download a fresh installer (1.12.7 or later) first. Then:

1. Go to **Settings → General**.
2. Enable **Command line interface**.
3. Follow the prompt to register the CLI on your PATH.

On macOS this creates a symlink at `/usr/local/bin/obsidian` (you will get an admin prompt). On Linux it copies the binary to `~/.local/bin/obsidian`, so make sure that directory is on your PATH. Restart your terminal afterward.

One thing to internalize early: **the CLI is a remote control, not a headless engine.** Obsidian has to be running. If it is not, the first command launches it. That matters for automation, which we will get to below.

Run `obsidian` with no arguments to open the interactive TUI, which has autocomplete, command history, and `Ctrl+R` reverse search. Or run single commands directly, which is what you want for scripts.

## Everyday Commands That Replace Clicking

Commands take `key=value` parameters and bare flags. The ones I reach for most are around capture and lookup:

```bash
# Drop a task into today's daily note without switching windows
obsidian daily:append content="- [ ] Review PR for the auth refactor"

# Create a note from a template
obsidian create name="Weekly Review 2026-W39" template="Weekly Review"

# Find notes and show matching lines, grep style
obsidian search:context query="rate limiting" limit=10

# Every open task in the vault
obsidian tasks todo
```

File targeting is smarter than a raw path. `file=Recipe` resolves the same way a `[[Recipe]]` wikilink does, so you do not need the folder or extension. Use `path=` when you need to be exact. And if your terminal is sitting inside a vault folder, that vault is the default target; otherwise prefix the command with `vault="My Vault"`.

Properties are scriptable too, which is handy for bulk metadata changes you would otherwise do one note at a time:

```bash
obsidian property:set file="Project Atlas" name=status value=shipped
obsidian property:read file="Project Atlas" name=status
```

Add `--copy` to any command to send its output to the clipboard instead of reading it off the screen.

## Getting Data Out: Bases, Tasks, and Links as JSON

The capture commands are nice. The query commands are where the CLI starts earning its place in real scripts, because many of them accept `format=json`, `csv`, or `tsv`.

If you have been building views with [Bases](https://obsidian.md/help/bases), you can now query them from outside the app:

```bash
# Export a Bases view as CSV for a spreadsheet or report
obsidian base:query file=Reading view="Finished" format=csv > finished-books.csv
```

Link and structure commands make vault maintenance measurable. `orphans` lists notes nothing links to, `deadends` lists notes that link nowhere, and `unresolved` lists links pointing at notes that do not exist yet. Each takes a `total` flag to return just a count. That is enough to build a small health check:

```bash
#!/usr/bin/env bash
# vault-health.sh: append link-hygiene stats to today's daily note
ORPHANS=$(obsidian orphans total)
DEADENDS=$(obsidian deadends total)
UNRESOLVED=$(obsidian unresolved total)
OPEN_TASKS=$(obsidian tasks todo total)

obsidian daily:append content="## Vault health\n- Orphans: ${ORPHANS}\n- Dead ends: ${DEADENDS}\n- Unresolved links: ${UNRESOLVED}\n- Open tasks: ${OPEN_TASKS}"
```

Schedule it with cron or launchd on a Monday morning and you get a running record of whether your vault is getting more connected or quietly fragmenting. Just remember the remote-control rule: if Obsidian is closed, the script will launch it. Schedule for a time when that is fine, or check with `pgrep` first.

For plugin and theme authors, there is a whole set of developer commands: `plugin:reload`, `dev:console`, `dev:errors`, `dev:screenshot`, and `eval` for running JavaScript against the `app` object. These are what make it practical for an AI coding agent to reload your plugin, read the console, and check its own work without you clicking anything.

## When Not to Reach for It

The CLI is not a sync or server tool. If you need to process a vault on a machine where no desktop app will ever run, it is the wrong layer; plain file access, Git, or Obsidian's separate headless sync option fit better. It also inherits your app state, so a command like `delete` or `plugin:uninstall` really does what it says. Test destructive scripts against a copy of your vault first, and prefer the default trash behavior over the `permanent` flag.

The best way to start is small. Pick one thing you do by hand every day (appending a task, checking what is still open, exporting a view) and turn it into a one-line shell alias. Run `obsidian help` to see the full list, then read the [CLI reference](https://obsidian.md/help/cli) for every parameter. Once your vault answers to the terminal, it stops being an island and starts behaving like the rest of your toolchain.
