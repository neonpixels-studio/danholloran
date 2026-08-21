---
date: "2026-08-21T02:08:03.000-05:00"
tags: ["obsidian", "productivity", "workflows", "hotkeys"]
draft: false
title: "Obsidian Hotkeys and the Command Palette: Building a Keyboard-First Vault"
image: "/images/posts/obsidian-hotkeys-and-the-command-palette-a-keyboard-first-vault.jpg"
topic: "obsidian"
description: "Most Obsidian friction is the round trip from keyboard to mouse and back. Here is how the command palette, a short list of hotkeys, and a little usage data get rid of it."
---

You are three sentences into a thought and you need to insert a template. Your hand leaves the keyboard, you find the ribbon icon, you click, you come back. It costs about two seconds. Do it forty times a day and you have lost roughly an hour a month, which is annoying but survivable.

The real cost is the thought you were three sentences into. Reaching for the mouse is a context switch, and context switches are where half-finished notes come from. The fix is not memorizing a wall of shortcuts. It is knowing which handful of things you actually do, and letting Obsidian's built-in command system handle the rest.

## The command palette is an index, not a shortcut

`Ctrl+P` (`Cmd+P` on macOS) opens the Command palette, a core plugin that exposes every command Obsidian and your plugins have registered. It supports fuzzy matching, so you do not need the exact name: typing `scf` finds **Save current file**. As of Obsidian 1.8.3, recently used commands float to the top of the list, though once you start typing, fuzzy matching takes over and shorter command names get prioritized again.

The palette's underrated job is discovery. Every command shows its assigned hotkey next to it, which makes the palette the fastest way to answer "does this already have a shortcut?" without opening settings at all. Install a plugin, open the palette, type its name, and you get a readable inventory of what it added.

For the handful of commands you run constantly but never remembered the name of, pin them: **Settings → Command palette → New pinned command → Select a command**. Pinned commands sit at the top of the palette with no typing required, which is a nice middle tier between "buried in a menu" and "deserves its own key combination."

## Promote by evidence, not by vibes

My rule of thumb: if you run a command more than about ten times a week, it has earned a hotkey. Below that, the palette is fine and a binding is just one more thing to forget.

The trap is that people are bad at guessing which commands those are. You will confidently bind six shortcuts, use two of them, and let the other four rot. If you want to skip the guessing, the community plugin **Command Tracker** counts how often each command actually fires. Run it for two weeks, sort the list, and bind the top of it.

Start with three anchors before anything plugin-specific:

| Command             | Default hotkey     | What it replaces           |
| ------------------- | ------------------ | -------------------------- |
| Command palette     | `Ctrl/Cmd+P`       | Hunting through menus      |
| Quick switcher      | `Ctrl/Cmd+O`       | Clicking the file explorer |
| Search in all files | `Ctrl/Cmd+Shift+F` | Scrolling to find a note   |

Those three cover navigation and execution. Everything after that is personal.

To set one, open **Settings → Hotkeys**, filter for the command, click the plus icon, press the combination, and select **Save**. You can assign more than one combination to a single command by clicking plus again, which is genuinely useful if you are migrating from another editor and want the old muscle memory to keep working while the new one sets in. The filter icon at the top shows only commands that already have a hotkey, which makes it a decent quarterly audit view.

One layout gotcha: Obsidian displays hotkeys as they would appear on a US keyboard. If you are on a different layout, the display may not match your keycaps, but the binding follows the physical keys you actually pressed.

A convention that keeps things sane: reserve one modifier stack for your own bindings. I use `Cmd+Shift+<letter>` for anything I added myself, so a collision with an Obsidian default or a plugin default is basically impossible, and I always know whether a shortcut is mine.

## Trim the palette, then place what is left

Once you have a few dozen plugins, the palette itself gets noisy. **Command Block List** hides commands from the palette entirely, which is the right move for the fifteen commands a single plugin registered when you only ever use one of them.

For the opposite problem, **Commander** puts commands into parts of the interface that do not have keyboards at all: the ribbon, the status bar, page headers, and context menus. It can also hide commands added by Obsidian or other plugins, and it lets you choose which devices show each command. That last part is the reason to care. Your desktop vault wants hotkeys; your phone wants three big buttons in the toolbar. Commander lets the same synced vault have both.

If you want to go further, **Shell commands** registers system commands as Obsidian commands, at which point anything you can run in a terminal becomes hotkey-able from inside your notes. That is powerful and worth being deliberate about, since a hotkey that runs a script is a hotkey that can do real damage to real files.

Give yourself an afternoon: open the palette, watch what you reach for, bind the five things you keep doing, and audit the list next quarter. A keyboard-first vault is not fifty shortcuts. It is about a dozen, and a palette that finds everything else.
