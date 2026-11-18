---
date: "2026-11-17T02:15:24.000-08:00"
tags: ["obsidian", "productivity", "workflows", "obsidian-sync"]
draft: false
title: "Sharing an Obsidian Vault With Obsidian Sync: What Actually Works"
image: "/images/posts/sharing-an-obsidian-vault-with-obsidian-sync-what-actually-works.jpg"
topic: "obsidian"
description: "Obsidian Sync can share a vault with up to 20 people, but there's no live co-editing. Here's how merges, conflicts, and version history behave."
---

The first time someone invites you into a shared Obsidian vault, it feels like Google Docs for Markdown. You open a note, start typing, and assume your teammate sees your cursor. They don't. Ten minutes later you both saved different versions of the same meeting notes, and one of you is staring at a paragraph that now appears twice.

Shared vaults in Obsidian Sync are useful, but they are not real-time collaboration. They are file sync with merging. Once you understand that, you can set a vault up so a small team (or a household) rarely trips over each other.

## What a shared vault actually is

Any Sync remote vault can be shared from **Settings → Sync → Remote vault → Manage → Manage sharing**. Enter a collaborator's email and they get access. A few rules from the [official docs](https://obsidian.md/help/sync/collaborate) shape everything else:

- **Every collaborator needs their own Sync subscription.** One person paying does not cover the team. Joining a shared vault does not count against the collaborator's own vault limit, though.
- **Up to 20 collaborators** per vault.
- **No permission levels.** Everyone gets the same access as the owner, except only the owner can invite people. There is no read-only seat.
- **The owner's plan sets the file size cap.** On Standard that's 5 MB per file, on Plus it's 200 MB. If the owner is on Standard, a teammate on Plus still can't sync a 20 MB PDF into that vault.
- **End-to-end encryption still applies.** If the vault is encrypted, each collaborator enters the encryption password on first connect, so you have to share that password out of band.

The big one: **no live editing.** You won't see anyone else's cursor, and their changes appear only after Sync uploads them and your device pulls them down.

## How conflicts get resolved

A conflict happens when the same file changes on two devices before either syncs. In a shared vault, "two devices" usually means two people. Obsidian handles it differently depending on file type, per the [troubleshooting docs](https://obsidian.md/help/sync/troubleshoot):

- **Markdown notes** are merged with Google's diff-match-patch algorithm.
- **Everything else, including `.canvas` files**, uses last-modified-wins. The older edit is simply replaced.
- **Settings JSON** is merged key by key, with local keys applied on top of remote ones.

That canvas rule matters for teams. If two people rearrange the same canvas at once, one person's work silently loses. Treat shared canvases as single-owner files.

Since Obsidian 1.9.7 you can change the Markdown behavior under **Settings → Sync → Conflict resolution**:

- **Automatically merge** (default): keeps every edit but can produce duplicated lines or broken formatting.
- **Create conflict file**: keeps the remote version in the original note and writes your local changes to a separate file.

The conflict file follows a predictable pattern:

```text
Meeting notes (Conflicted copy MyMacBook2 202611171430).md
```

For a shared vault, I'd pick **Create conflict file**. A visible extra file is easier to deal with than a duplicated paragraph nobody notices for a week. The catch is that this setting is **per device**. Every collaborator has to change it on every device they use, so put it in your onboarding note.

You can then find conflict copies quickly with a search query:

```text
file:"Conflicted copy"
```

## Structure the vault so people rarely collide

Merging is a fallback, not a workflow. The best shared vaults are arranged so two people almost never edit the same file at the same time:

- **Give each person their own daily or scratch folder**, like `People/Alex/` and `People/Sam/`, and link out to shared notes instead of editing them for every small thought.
- **Watch out for notes created on startup.** The docs specifically call out Daily Notes and Templater templates that create files automatically. If a note is created locally and Sync downloads a remote version of the same file within a couple of minutes, Sync keeps the remote copy without merging. A shared `Daily/2026-11-17.md` that two people's apps create at 9 a.m. is a recipe for lost text. Per-person daily folders avoid it entirely.
- **Append, don't rewrite.** Meeting notes and logs work well when people add new sections at the bottom rather than editing the same paragraph.
- **Decide what config to share.** Vault configuration sync covers themes, hotkeys, and core plugin settings by default, but community plugins only sync if you enable **Active community plugin list** and **Installed community plugin list**. In a team, sharing the plugin list keeps everyone's Dataview or Bases views rendering the same. Sharing hotkeys and appearance usually just annoys people, so consider turning those off on each device.

## Use history to answer "who changed this?"

Two built-in tools cover the inevitable "where did my paragraph go?" moment. The **Sync history** sidebar (run _Sync: Show Sync history_ from the command palette) lists recently synced files, and on desktop, hovering an item shows who last edited it. Right-click any note and choose **Open version history** to view and restore earlier versions.

Know the retention limits before you rely on it: notes are kept for **1 month on Standard** and **12 months on Plus**, and attachment versions only last **two weeks**. Deleted files can be restored from **Settings → Sync → Deleted files → View**. Local [File recovery](https://obsidian.md/help/plugins/file-recovery) snapshots are a separate safety net, but they live on one device and never sync.

## The takeaway

Obsidian Sync shared vaults work well for a small team that writes in mostly separate files and links between them. They work poorly as a stand-in for live co-editing. Switch conflict handling to conflict files on every device, give people their own folders, keep canvases single-owner, and teach everyone where Sync history lives. If you need true simultaneous editing or read-only access, that's a sign to reach for a different tool, and the [collaboration docs](https://obsidian.md/help/sync/collaborate) are worth rechecking since permissions are listed as "not supported yet."
