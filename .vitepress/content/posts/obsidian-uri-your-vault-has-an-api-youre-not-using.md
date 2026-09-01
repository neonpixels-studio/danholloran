---
date: "2026-09-01T02:07:46.000-05:00"
tags: ["obsidian", "workflows", "plugins", "productivity", "community-plugins"]
draft: false
title: "Obsidian URI: Your Vault Has an API You're Not Using"
image: "/images/posts/obsidian-uri-your-vault-has-an-api-youre-not-using.jpg"
topic: "obsidian"
description: "Obsidian ships with a custom URI protocol that lets scripts, browsers, and phone shortcuts read and write your vault without you touching the app. Here's how the core actions work and where the Advanced URI plugin picks up the slack."
---

Most Obsidian capture workflows stop at the app boundary. You have templates, hotkeys, maybe a QuickAdd macro that files things perfectly — and all of it requires you to already be in Obsidian. So the idea you had while reading a changelog in your browser goes into a scratch file, and the note you meant to append from a terminal never gets appended.

The fix has been sitting in the app since the beginning. Obsidian registers a custom URI protocol on your OS, which means anything that can open a link can also drive your vault. No plugin, no HTTP server, no API key.

## The core protocol, no plugin required

Obsidian URIs follow a single shape:

```
obsidian://action?param1=value&param2=value
```

The built-in actions are `open`, `new`, `daily`, `unique`, `search`, and `choose-vault`. That covers more than it sounds like:

```bash
# Open a specific note
open "obsidian://open?vault=my%20vault&file=projects%2Froadmap"

# Create a note with content, in a new tab
open "obsidian://new?vault=my%20vault&name=meeting%20notes&content=Hello&paneType=tab"

# Append the clipboard to today's daily note without stealing focus
open "obsidian://daily?vault=my%20vault&clipboard&append&silent"

# Run a search
open "obsidian://search?vault=my%20vault&query=tag%3A%23inbox"
```

That third one is the sleeper. `clipboard` pulls content from the system clipboard instead of the URL, `append` adds to the existing note rather than replacing it, and `silent` means Obsidian does the write without pulling you out of whatever you were doing. Chained together, that's a full capture pipeline in one line.

A few details that will bite you if you skip them. Encoding is not optional: a bare `/` in a path or a space in a vault name will break the parse, so percent-encode everything (`%2F`, `%20`). The `.md` extension can be omitted from `file`. `paneType` accepts `tab`, `split`, or `window`. And there's a shorthand if you're hand-writing links inside notes — `obsidian://vault/my vault/my note` is the same as the long `open` form.

## Where Advanced URI picks up the slack

The core protocol can create and append. It cannot overwrite a specific heading, run a command, or do a regex search-and-replace. That's what [Advanced URI](https://github.com/Vinzent03/obsidian-advanced-uri) is for. It uses its own scheme, `obsidian://adv-uri`, and adds a `mode` parameter:

```bash
# Append to a specific heading in today's daily note
open "obsidian://adv-uri?vault=my%20vault&daily=true&heading=Log&data=Deployed%20v2.1&mode=append"

# Overwrite a file outright
open "obsidian://adv-uri?vault=my%20vault&filepath=status&data=green&mode=overwrite"
```

`mode` takes `write` (only if the file doesn't exist), `overwrite`, `append`, `prepend`, and `new` (always creates, appending an incrementing number on collision). Append and prepend default to a newline separator, but `separator=,` or anything else works if you're building a list.

Two features are worth the install on their own. The first is running commands by ID:

```
obsidian://adv-uri?vault=my%20vault&filepath=notes%2Fdraft&commandid=workspace%3Aclose
```

That switches to the tab holding `notes/draft` and then fires the "Close current tab" command — so you can close an arbitrary tab by path. Any command in the palette works. Prefer `commandid` over `commandname`; names get reworded between plugin releases, IDs almost never do.

The second is the `uid` identifier. Instead of `filepath`, you reference a note by a UUID stored in its frontmatter:

```
obsidian://adv-uri?vault=my%20vault&uid=d43f7a17-058c-4aea-b8dc-515ea646825a
```

Rename or move the note and the link still resolves. If you're embedding Obsidian links into task managers, calendar events, or a codebase, this is the difference between links that survive a vault reorg and links that quietly rot.

## Making it actually useful

The protocol is only worth it if something else is calling it. A shell function is the lowest-effort win:

```bash
jot() {
  local text
  text=$(python3 -c 'import sys,urllib.parse; print(urllib.parse.quote(sys.argv[1]))' "$*")
  open "obsidian://daily?vault=my%20vault&content=- ${text}&append&silent"
}
```

Now `jot "check why the build cache missed"` lands in today's daily note from any terminal, and Obsidian never comes to the foreground. The same URL works as a browser bookmarklet, an iOS Shortcut action, a Raycast script, or a step in a cron job.

One nicety before you start hand-writing these: Advanced URI ships helper commands in the palette that generate and copy a correct, fully encoded URI for the current file, daily note, command, or search-and-replace. Use those to get a working URL, then edit it — it's a lot faster than debugging your own percent-encoding at midnight.

Sources: [Obsidian URI (official help)](https://help.obsidian.md/Extending+Obsidian/Obsidian+URI), [Advanced URI documentation](https://publish.obsidian.md/advanced-uri-doc/).
