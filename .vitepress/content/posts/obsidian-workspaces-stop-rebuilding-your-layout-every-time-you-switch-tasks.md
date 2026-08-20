---
date: "2026-08-18T02:08:16.000-05:00"
tags: ["obsidian", "pkm", "workflows", "productivity", "workspaces"]
draft: false
title: "Obsidian Workspaces: Stop Rebuilding Your Layout Every Time You Switch Tasks"
image: "/images/posts/obsidian-workspaces-stop-rebuilding-your-layout-every-time-you-switch-tasks.jpg"
topic: "obsidian"
description: "Workspaces is a core Obsidian plugin that saves your entire pane layout under a name and restores it in one command. Here's how to design layouts worth saving, and the gotcha that trips everyone up."
---

There is a particular kind of friction that never shows up on anyone's list of Obsidian complaints, because it feels like your own fault. You sit down to write, so you close the graph view, collapse the right sidebar, open the outline pane, and pull up your research note in a split. Twenty minutes later you switch to reviewing tasks, and you tear the whole thing down and build a different arrangement. Then you go to capture something quickly and do it a third time.

None of those rearrangements takes more than fifteen seconds. That is exactly why nobody fixes it. But fifteen seconds of pane wrangling at the front of every context switch is a tax on starting, and the tax is paid at the worst possible moment: right when you have decided to do the work but have not started yet.

Obsidian has shipped a fix for this since forever, and it is off by default. It is called Workspaces.

## What a workspace actually saves

Workspaces is a core plugin, not a community one. Enable it under **Settings → Core plugins → Workspaces** and a new **Manage workspace layouts** icon appears in the ribbon.

A workspace stores the arrangement, not the content: which files are open, how tabs and splits are organized, and the width and visibility of each sidebar. It is a snapshot of the app frame around your notes. Saving one is three steps from the ribbon, or from the command palette:

```
Cmd/Ctrl+P → "Manage workspace layouts" → name it → Save
```

Loading is the same dialog with **Load** instead. To update an existing workspace, you save over it: enter the same name and hit Save again.

Here is the gotcha that catches everyone, and it is worth internalizing before you build anything on top of this. **Workspaces do not autosave.** If you load `Writing`, then open four new tabs and drag a pane around, none of that survives. Next time you load `Writing` you get the layout exactly as you last saved it.

That behavior is a feature once you stop fighting it. Your saved layouts become stable environments you return to rather than drifting sessions that accumulate junk. But if you expected the tabs you opened this morning to still be there tomorrow, you need to explicitly save over the workspace before you switch away.

## Three layouts that earn their keep

Saving a workspace for every project is a trap; you end up with fifteen layouts and no idea which is which. Save layouts for _modes of work_, not for subjects. Three is usually enough:

**Writing.** One main pane, left sidebar hidden entirely, right sidebar showing only the outline. No graph, no backlinks, nothing that invites you to go look at something else. This one exists to remove options.

**Review.** Your dashboard or MOC note pinned in the left split, a task query in the right, file explorer visible. This is the layout you load when you want to decide what to do rather than do it.

**Capture.** Today's daily note open, the quick switcher one keystroke away, sidebars collapsed. Fast in, fast out.

The layouts live in your vault's config folder as `.obsidian/workspaces.json`. If you sync with Git, that file is version-controlled like anything else in `.obsidian`, which means a layout you like is portable across machines. Obsidian Sync treats workspace layouts as a separate toggle, so check that setting if your layouts are not following you between devices — different machines often _should_ have different layouts anyway, since a 13-inch laptop cannot usefully hold the three-pane arrangement your desktop can.

## Make switching cost one keystroke

A workspace you have to click through a dialog to reach is a workspace you will stop using. Bind the command:

**Settings → Hotkeys → search "workspace"** and assign the **Manage workspace layouts** command something you can hit without looking. `Cmd/Ctrl+Shift+W` is usually free.

The core plugin gives you one hotkey that opens the picker, which is a small extra step. If you switch layouts constantly, two community plugins go further: **Workspaces Plus** adds per-workspace hotkeys and a status-bar switcher, and **Workspace++** lets you cycle sessions directly with `Cmd/Ctrl+Shift+Enter` and step backward and forward with `Cmd/Ctrl+Shift+,` and `Cmd/Ctrl+Shift+.`. Both are worth a look, but try the core plugin for a week first. Most people discover they only ever switch between two layouts, and one hotkey plus one Enter is fine for that.

## The actual payoff

The point is not the fifteen seconds. The point is that a layout is a commitment device. Loading `Writing` and watching the graph view and backlinks pane disappear is a much stronger signal to your brain than telling yourself you are going to focus now.

Set up two workspaces this week — one for making things and one for looking at things — and bind the switch to a key. If you find yourself reaching for it without thinking, that is the whole feature working.
