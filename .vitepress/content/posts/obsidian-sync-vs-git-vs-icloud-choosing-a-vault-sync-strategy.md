---
date: "2026-07-14T02:07:00.000-05:00"
tags: ["obsidian", "pkm", "workflows", "obsidian-sync", "knowledge-management"]
draft: false
title: "Obsidian Sync vs. Git vs. iCloud: Choosing a Vault Sync Strategy"
image: "/images/posts/obsidian-sync-vs-git-vs-icloud-choosing-a-vault-sync-strategy.jpg"
topic: "obsidian"
description: "Your vault is just a folder of Markdown, which makes syncing it feel like a solved problem. It isn't. Here's how Obsidian Sync, Git, and iCloud actually behave once mobile and plugins enter the picture."
---

The pitch for Obsidian is that your notes are just Markdown files in a folder on disk. No lock-in, no proprietary database, no vendor between you and your writing. Which makes syncing sound trivial: drop the folder in a cloud drive and you're done.

Then you open the vault on your phone, get a file called `Daily Note (conflicted copy).md`, notice your plugin settings didn't come along, and discover the mobile app spent forty seconds spinning on a folder that contains 900 tiny files and a `.obsidian` directory full of JSON. The folder-of-Markdown story is true. The "so syncing is easy" corollary is not.

## What you're actually syncing

A vault is three different things wearing one trench coat: your notes, your attachments, and your configuration. The `.obsidian` folder holds your enabled plugins, their settings, your hotkeys, your theme, and your CSS snippets. Some sync strategies carry all three. Some carry only the first two. Some carry all three and then corrupt the third when two devices write to `workspace.json` at the same time.

The other thing that trips people up is the shape of the data. A vault is thousands of small text files that change constantly, which is close to the worst case for consumer file-sync engines. They're built for a 40 MB PDF that changes twice a year, not 900 files where three of them get a one-character edit every minute you're typing. That mismatch is where conflicted copies come from.

So the real question isn't "which service is best." It's: how many devices, do you need mobile, and do you want your config to travel?

## Obsidian Sync: pay to stop thinking about it

The first-party option is [Obsidian Sync](https://obsidian.md/sync), at $4/user/month billed annually or $5 billed monthly. What you get for that is end-to-end encryption, version history, syncing of shared vaults, and — the part people undersell — selective syncing of the `.obsidian` folder itself. You choose whether to bring plugins, themes, and hotkeys across, and you can exclude a device from parts of it (handy when you don't want a heavy graph plugin loading on your phone).

It also understands what a vault is. It syncs at the file level with conflict resolution designed for exactly this workload, rather than treating your notes like a Dropbox photo library. On mobile it is far and away the least aggravating option, and the version history has saved me more than once after an over-enthusiastic find-and-replace.

The catch is the obvious one: it's a subscription, and it's the only piece of Obsidian you're renting.

## Git: perfect history, terrible on your phone

If you're a developer, Git is the tempting answer, and for a desktop-only vault it's genuinely great. Real diffs, real history, real branching, zero cost, and your notes live in the same tooling as everything else you do. The [Obsidian Git](https://github.com/Vinzent03/obsidian-git) community plugin will auto-commit on an interval so you're not manually staging changes all day.

```bash
# .gitignore for a vault — keep the config, drop the churn
.obsidian/workspace.json
.obsidian/workspace-mobile.json
.obsidian/cache
.trash/
```

That `.gitignore` matters. `workspace.json` records which panes are open, so it changes every time you click anything, and it will conflict on every single pull if you track it. Ignore it, keep the rest of `.obsidian`, and your plugin config travels with the repo for free.

The wall you hit is mobile. Git on a phone means an isolated storage sandbox, a plugin doing the work, and a merge conflict resolved on a 6-inch screen with no good UI for it. It's possible. It is not pleasant. Git is the right call when your vault is desktop-first and you value auditability more than convenience.

## iCloud and friends: free, fine, until it isn't

Point iCloud Drive (or Dropbox, or OneDrive) at your vault folder and it works, right up until two devices are open at once. Then you get conflicted copies, and because Markdown has no merge UI, resolving them is a manual diff you do by eye.

It's a reasonable fit for one person, one or two devices, notes-only, no config syncing, no strong need for history. On iOS specifically, iCloud is the only free path that the mobile app handles natively — but it's also the setup that generates the most "why do I have three copies of this note" forum posts.

## The honest decision rule

Three or more devices, or any mobile use, or you want plugin settings to follow you: pay for Sync. Desktop-only and you already live in a terminal: Git, with `workspace.json` ignored. One laptop and a phone you barely take notes on: iCloud is fine, and you can always upgrade later — the vault is still just a folder.

The one thing you shouldn't do is stack two of them on the same folder. iCloud and Obsidian Sync fighting over the same directory is a genuinely bad time, and it's the fastest way to turn "just Markdown in a folder" into a recovery project.
