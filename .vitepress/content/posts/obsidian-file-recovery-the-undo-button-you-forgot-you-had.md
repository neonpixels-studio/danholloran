---
date: "2026-09-29T02:15:24.000-07:00"
tags: ["obsidian", "plugins", "workflows", "file-recovery"]
draft: false
title: "Obsidian File Recovery: The Undo Button You Forgot You Had"
image: "/images/posts/obsidian-file-recovery-the-undo-button-you-forgot-you-had.jpg"
topic: "obsidian"
description: "Obsidian quietly snapshots your notes every few minutes. Here's how File recovery works, how to restore a lost paragraph, and why it still isn't a backup."
---

You select a heading, hit a hotkey you meant for something else, and three paragraphs vanish. Or a sync client gets confused and a note you edited this morning comes back as last week's version. Undo is gone because you closed the tab an hour ago. The note is saved, the damage is saved with it, and you start rewriting from memory.

Most people who hit this never realize Obsidian was already holding a copy. The File recovery core plugin has been taking snapshots of your notes in the background the whole time. It is on by default in most vaults, it has no ribbon icon, and it only shows up when you go looking for it. That is exactly the moment you should not be learning how it works.

## What File recovery actually saves

File recovery is a **core plugin**, not a community one, so there is nothing to install. Check that it is enabled under **Settings → Core plugins → File recovery**.

When it is on, Obsidian saves a full copy of a note whenever the file changes, with a minimum gap between snapshots. Two settings control the behavior:

| Setting           | Default   | What it means                                       |
| ----------------- | --------- | --------------------------------------------------- |
| Snapshot interval | 5 minutes | Minimum time between two snapshots of the same file |
| History length    | 7 days    | How long snapshots are kept before being deleted    |

A few details matter more than they look:

- **Snapshots are full copies, not diffs.** Any snapshot can be restored on its own.
- **Unchanged files cost nothing.** A note you never touch does not get a new snapshot every five minutes.
- **Only `.md` and `.canvas` files are covered.** Images, PDFs, and other attachments are not.
- **Snapshots live outside the vault**, in Obsidian's global settings folder. That is deliberate: if the vault folder itself gets wiped, the history survives.

That last point has a catch. Snapshots are tied to the note's absolute path, so if you move your vault by dragging the folder around in Finder instead of using the vault switcher, older snapshots may stop showing up. They are also local to each device. Obsidian Sync, iCloud, and Git do not carry them between machines, so the snapshot you need lives on whichever device you were typing on.

## Getting a paragraph back

There are two ways in, and the faster one is the one nobody mentions.

**From the note you are looking at:** open the command palette (`Cmd/Ctrl + P`) and run **File recovery: Open local history**. You get the snapshot list for the current note immediately. Bind it to a hotkey under **Settings → Hotkeys** if you want a real "oh no" button.

**From settings, for any file** (including ones you deleted):

1. Open **Settings → Core plugins → File recovery**.
2. Next to **Snapshots**, select **View**.
3. Start typing the file name and pick it from the suggestions.
4. Choose a snapshot from the list.

Either way you land in the same viewer. Toggle **Show changes** to see a diff of what was added or removed between versions. Then pick one of two actions:

- **Copy** puts that version on your clipboard. This is the one you want most of the time: paste the lost paragraph back into the current note and keep everything you wrote since.
- **Restore** replaces the whole file with the snapshot. Use it when the current version is simply wrong, like a sync conflict that clobbered the note.

Because the viewer searches by file name rather than by what is currently in the vault, it is also the first place to look when a note was deleted outright, as long as it still falls inside the history window.

## Tuning it without overthinking it

The defaults are reasonable, but seven days is short if you only notice damage during a weekly review. A sensible starting point:

- **History length: 14 to 30 days.** Long enough to cover a missed weekly review or a vacation.
- **Snapshot interval: 2 to 5 minutes.** Shorter means finer-grained recovery during heavy writing sessions.

Resist the urge to crank it to years. File recovery is a short-term safety net, and treating it like an archive just moves the storage problem somewhere you will not see it.

If you want a nicer interface on top of the same data, the community plugin [Time Machine](https://github.com/dsebastien/obsidian-time-machine) reads File recovery snapshots (and Git commits, if your vault is a repo) and puts them on a scrubbable timeline with selective restore. It is optional; the core viewer does the job.

## It is not your backup

Obsidian's own documentation is blunt about this: File recovery is not a complete backup solution. It does not cover attachments, it does not leave the device, and it forgets everything after the history window closes. If your laptop dies, the snapshots die with it.

Think of it as one layer in a stack:

- **File recovery** catches "I just broke this note" within the last few days, on this device.
- **Sync history** covers longer windows across devices. Obsidian Sync keeps note versions for 1 month on Standard and 12 months on Plus.
- **A real backup** (Git, Time Machine on macOS, or any off-device copy) covers the machine itself.

If you have not thought about the second and third layers yet, [my comparison of Obsidian Sync, Git, and iCloud](https://danholloran.me/posts/obsidian-sync-vs-git-vs-icloud-choosing-a-vault-sync-strategy) is a good place to start.

Right now, take thirty seconds: confirm File recovery is enabled, bump the history length to a couple of weeks, and bind **Open local history** to a hotkey. The next time a paragraph disappears, you will spend ten seconds getting it back instead of an hour rewriting it. The [official File recovery docs](https://obsidian.md/help/plugins/file-recovery) cover the rest.
