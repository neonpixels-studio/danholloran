---
date: "2026-11-10T02:15:53.000-08:00"
tags:
  [
    "obsidian",
    "markdown",
    "productivity",
    "workflows",
    "obsidian-for-developers",
  ]
draft: false
title: "Obsidian as Your Default Markdown App: Opening Files Outside the Vault"
image: "/images/posts/obsidian-as-your-default-markdown-app-opening-files-outside-the-vault.jpg"
topic: "obsidian"
description: "Obsidian 1.14 can finally open a Markdown file that isn't in a vault. Here's how to make it your default .md app, what works on stray files, and what doesn't."
---

For most of Obsidian's life, double-clicking a stray `README.md` was a small act of betrayal. Obsidian was the best Markdown app on your machine, and it flatly refused to open a Markdown file unless that file lived inside a vault. So the README in a cloned repo, the changelog in a downloaded zip, or the notes file a coworker sent you all went to a text editor, a browser preview, or VS Code. The [feature request](https://forum.obsidian.md/t/have-obsidian-be-the-handler-of-md-files-add-ability-to-use-obsidian-as-a-markdown-editor-on-files-outside-vault-file-association/314) asking for this is one of the oldest threads on the forum and runs to nine pages.

Obsidian 1.14 fixes it. The [October 5 public release](https://obsidian.md/changelog/2026-10-05-desktop-v1.14.4/) lets you open individual Markdown files from anywhere on disk, register Obsidian as your system's default `.md` app, and (on macOS) preview Markdown in Finder with Quick Look even when Obsidian is closed. It is desktop only, and there is one catch that will trip up a lot of people, so let's start there.

## Get the New Installer First

The in-app updater is not enough. File associations and the Quick Look extension live in the installer, and the changelog is explicit that opening Markdown files "requires the latest installer." If you have been accepting in-app updates for months, you are probably on an old installer even though the app itself reports 1.14.

Download a fresh copy from [obsidian.md/download](https://obsidian.md/download) and reinstall over the top. Your vaults and settings are untouched. As of 1.14, **Settings → General** also shows a notice when a newer installer is available, so you will know next time without guessing.

## Three Ways In

Once you're on the new installer, there are three entry points.

**The command palette.** Run **Open file from outside the vault…**, pick a Markdown file, and it opens as a tab in your current window, next to your regular notes. This is the one to bind to a hotkey (**Settings → Hotkeys**, search "outside") if you read a lot of repo docs.

**Open with.** Obsidian now registers itself with the operating system, so it shows up in Finder's or Explorer's **Open with** menu for `.md` files.

**Make it the default.** On macOS, select any `.md` file in Finder, press `Cmd+I`, choose Obsidian under **Open with**, and click **Change All…**. On Windows, right-click a Markdown file, choose **Open with → Choose another app**, pick Obsidian, and tick "Always". If you manage your Mac from dotfiles, the third-party [duti](https://github.com/moretension/duti) tool does the same thing from a script:

```bash
# Make Obsidian the default handler for Markdown (macOS, requires: brew install duti)
duti -s md.obsidian net.daringfireball.markdown all

# Confirm it took
duti -x md
```

Quick Look needs no setup beyond the installer. Select a Markdown file in Finder and press Space to get a rendered preview instead of raw text. From a terminal, `qlmanage -p README.md` opens the same preview, which is handy for checking a doc before you commit it.

## What Works on a File That Isn't in a Vault

A stray file is not a vault note, and the release notes are careful about what carries over. The ones you will actually notice:

- **Relative paths resolve from the file's own folder.** Image embeds and links to other local files are resolved relative to the Markdown file, which is exactly how GitHub and most static site generators treat them. A typical repo README renders correctly:

```markdown
# my-project

![Architecture diagram](docs/architecture.png)

See the [contributing guide](CONTRIBUTING.md) and the
[API reference](docs/api.md) before opening a PR.
```

- **Outline and Outgoing links work.** The core Outline view gives you a heading tree for long docs, and Outgoing links lists the local files the document points to. For a sprawling `docs/` folder, that pair is a decent way to navigate.
- **It is not indexed into your vault.** The file is opened, not imported. Don't expect it in vault search, in backlinks, in the graph, or in a Base. If you want any of that, move the file into the vault.
- **Clicking an external `.md` link still uses the OS default.** A `file:///` link inside one of your notes is handed to whatever app the operating system picks, not the "open from outside" path. A [forum request](https://forum.obsidian.md/t/open-external-markdown-file-links-inside-obsidian-instead-of-the-system-default-app/118341) asks to change that; until then, setting Obsidian as the system default is the workaround.

The changelog describes all of this as viewing the file in the app. Treat it as a reader for Markdown that lives elsewhere, and keep anything you want to write, link, and query inside the vault where Obsidian can see it.

## Where It Fits

This closes a gap rather than changing how a vault works, and that is the right size for it. For developers it means repo docs, design notes, and ADRs render in the same app, with the same theme and CSS snippets, as everything else you read all day. For everyone else it means the "where do I open this .md file" question finally has one answer.

Grab the new installer, set Obsidian as your default for `.md`, and press Space on the next README you download. If you already script your vault with the [Obsidian CLI](/posts/the-obsidian-cli-script-your-vault-from-the-terminal), this is the other half: Obsidian is now the Markdown app for files both inside the vault and out.
