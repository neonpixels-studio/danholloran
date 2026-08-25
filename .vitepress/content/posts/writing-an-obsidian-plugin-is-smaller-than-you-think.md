---
date: "2026-08-25T02:07:32.000-05:00"
tags: ["obsidian", "plugins", "typescript", "pkm", "obsidian-api-and-themes"]
draft: false
title: "Writing an Obsidian Plugin Is Smaller Than You Think"
image: "/images/posts/writing-an-obsidian-plugin-is-smaller-than-you-think.jpg"
topic: "obsidian"
description: "Most people patch around a missing Obsidian feature with a Templater script and a CSS snippet. The plugin API is often the shorter path, and the surface area you actually need is tiny."
---

Somewhere in your vault there is a workaround. A Templater script that almost does the thing. A CSS snippet that fakes a view Obsidian doesn't have. A Dataview query with a comment above it apologizing for itself. You built it because writing a plugin felt like a bigger commitment than the annoyance justified.

That instinct is usually wrong. The Obsidian plugin API is small, the scaffold is a `git clone`, and most plugin ideas bottom out in one or two registration calls inside a single `onload()`. The hard part is not the API. It's knowing which four methods you actually need.

## The scaffold is a clone and a watch command

Obsidian maintains a sample plugin as a GitHub template repo. You clone it into a vault's plugin folder, install, and start the watcher:

```bash
cd path/to/vault/.obsidian/plugins
git clone https://github.com/obsidianmd/obsidian-sample-plugin.git
cd obsidian-sample-plugin
npm install
npm run dev
```

That produces a `main.js` next to the source. Turn on community plugins in **Settings → Community plugins**, toggle the sample on, and you have a live plugin.

One rule worth taking seriously: the docs tell you to never develop against your main vault, and they mean it. A plugin has write access to every note. A stray `vault.modify()` in a loop is a very fast way to learn what your backup strategy actually is. Make an empty vault for development.

Two reload gotchas. Editing `main.ts` needs the plugin reloaded (toggle it off and on, or run **Reload app without saving** from the command palette). Editing `manifest.json` needs a full restart. The community [Hot-Reload plugin](https://github.com/pjeby/hot-reload) removes the first one from your life.

## Four registrations cover most ideas

`Plugin` extends `Component`, and nearly everything you register through it gets torn down automatically on unload. That's the design worth internalizing: use the `register*` helpers instead of raw listeners and you never write cleanup code.

The first two are the boring ones. `addCommand()` puts an entry in the command palette, auto-prefixed with your plugin id. `addRibbonIcon()` puts an icon in the left rail:

```ts
import { Notice, Plugin } from "obsidian";

export default class HelloWorldPlugin extends Plugin {
  async onload() {
    this.addRibbonIcon("dice", "Greet", () => {
      new Notice("Hello, world!");
    });
  }
}
```

The interesting one is `registerMarkdownCodeBlockProcessor()`. This is how Mermaid diagrams work, and it's how you get your own. Claim a language tag, get the raw source, render whatever you want into the element:

```ts
this.registerMarkdownCodeBlockProcessor("csv", (source, el, ctx) => {
  const rows = source.split("\n").filter((row) => row.length > 0);
  const body = el.createEl("table").createEl("tbody");

  for (const rowText of rows) {
    const row = body.createEl("tr");
    for (const cell of rowText.split(",")) {
      row.createEl("td", { text: cell });
    }
  }
});
```

Twelve lines and ` ```csv ` renders as a table in Reading view. If you've ever wanted a custom block in your notes, that's the whole mechanism.

Its sibling, `registerMarkdownPostProcessor()`, runs against already-rendered HTML and lets you rewrite it — swapping `:sunglasses:` for an emoji, linkifying ticket numbers, badge-ing certain inline code spans. Between those two you can change how nearly anything looks in Reading view without touching a theme.

## The Vault API is where the real footguns live

Reading and writing notes is where a plugin can do damage, so the API draws distinctions that are easy to skim past.

For reads: use `cachedRead()` when you're only displaying content, and `read()` when you plan to write the result back. The difference only matters when a file changed on disk moments before, but that's exactly the case that eats data.

For writes, prefer `process()` over the `read()` then `modify()` dance:

```ts
function emojify(vault: Vault, file: TFile): Promise<string> {
  return vault.process(file, (data) => data.replace(":)", "🙂"));
}
```

`process()` guarantees the file didn't change between the read and the write. `read()` plus `modify()` gives you a window where it can, and you'll overwrite whatever landed in it. `process()` is synchronous only — for async work, `cachedRead()`, do the slow thing, then `process()` and verify the content still matches what you read.

And when deleting, `trash()` moves the file to the system bin or the vault's `.trash`; `delete()` removes it without a trace. Default to `trash()`.

## Start with the annoyance, not the idea

The best first plugin is the workaround you're already maintaining. If it's a rendering problem, it's a code block processor. If it's a repetitive action, it's a command. If it's "I want to see all my notes where X," check whether Bases already does it before you write anything.

The [official docs](https://docs.obsidian.md/Plugins/Getting+started/Build+a+plugin) are unusually good, and the TypeScript API reference lists every registration method on `Plugin` with the version it landed in. Skim that list once. You'll recognize your workaround in it.
