---
date: "2026-10-09T02:15:36.000-07:00"
tags: ["obsidian", "canvas", "plugins", "workflows", "markdown"]
draft: false
title: "JSON Canvas: Generate Obsidian Canvases From a Script"
image: "/images/posts/json-canvas-generate-obsidian-canvases-from-a-script.jpg"
topic: "obsidian"
description: "A .canvas file is just JSON with an open spec. Here's how the format works and how to build a canvas from your notes with a short Node script instead of dragging cards by hand."
---

Canvas is one of those Obsidian features that feels great for the first ten cards and tedious by the fiftieth. You want a board of every project note, grouped by status, with arrows to the notes they depend on. Dragging that together by hand is slow, and the moment a status changes in frontmatter, the board is stale.

Here's the part a lot of people miss: a `.canvas` file isn't a proprietary blob. It's plain JSON, and since March 2024 the format has had its own name, [JSON Canvas](https://jsoncanvas.org/), with an MIT-licensed spec maintained by the Obsidian team. If you can write a JSON file, you can generate a canvas.

## What's actually inside a .canvas file

Open any canvas in a text editor and you'll find two top-level arrays, both optional: `nodes` and `edges`. The [1.0 spec](https://jsoncanvas.org/spec/1.0/) is short enough to read over coffee.

Every node has a required `id`, `type`, `x`, `y`, `width`, and `height`, all positions and sizes in pixels. There are four node types:

- **`text`** holds Markdown in a `text` field
- **`file`** points at a file in your vault via `file`, with an optional `subpath` (starting with `#`) to target a heading or block
- **`link`** embeds a web page via `url`
- **`group`** is a visual container with an optional `label` and background image

Edges connect nodes with `fromNode` and `toNode`, plus optional `fromSide`/`toSide` (`top`, `right`, `bottom`, `left`), a `label`, and endpoint shapes. `toEnd` defaults to `arrow` and `fromEnd` defaults to `none`, so a bare edge already draws a one-way arrow.

Here's a minimal, valid canvas with one note, one sticky, and an arrow between them:

```json
{
  "nodes": [
    {
      "id": "a1",
      "type": "file",
      "file": "Projects/Website Redesign.md",
      "x": 0,
      "y": 0,
      "width": 400,
      "height": 300
    },
    {
      "id": "b2",
      "type": "text",
      "text": "**Blocked** on new brand colors",
      "x": 500,
      "y": 100,
      "width": 260,
      "height": 80,
      "color": "1"
    }
  ],
  "edges": [
    {
      "id": "e1",
      "fromNode": "b2",
      "fromSide": "left",
      "toNode": "a1",
      "toSide": "right"
    }
  ]
}
```

Two details worth knowing. First, node order is z-order: the first node in the array renders at the bottom, so groups should come **before** the cards that sit inside them. Second, colors are either hex strings like `"#FF0000"` or the presets `"1"` through `"6"` (red, orange, yellow, green, cyan, purple). The spec deliberately leaves the exact preset shades to the app, which is why they follow your Obsidian theme.

## Generate a status board from your notes

Say your project notes live in `Projects/` and each has a `status` property like `active`, `waiting`, or `done`. This Node script, with no dependencies, reads them and writes a canvas with one group per status and a file card for each note:

```js
// scripts/build-project-canvas.mjs
import { readdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { randomBytes } from "node:crypto";

const VAULT = process.argv[2] ?? ".";
const FOLDER = "Projects";
const STATUSES = ["active", "waiting", "done"];
const COLORS = { active: "4", waiting: "3", done: "5" };
const CARD = { w: 360, h: 220, gap: 40 };

const id = () => randomBytes(8).toString("hex");

function readStatus(source) {
  const fm = source.match(/^---\n([\s\S]*?)\n---/);
  const line = fm?.[1].match(/^status:\s*['"]?(\w+)/m);
  return line?.[1] ?? "active";
}

const files = (await readdir(join(VAULT, FOLDER))).filter((f) =>
  f.endsWith(".md"),
);
const byStatus = Object.fromEntries(STATUSES.map((s) => [s, []]));

for (const name of files) {
  const status = readStatus(await readFile(join(VAULT, FOLDER, name), "utf8"));
  (byStatus[status] ?? byStatus.active).push(`${FOLDER}/${name}`);
}

const groups = [];
const cards = [];

STATUSES.forEach((status, col) => {
  const x = col * (CARD.w + CARD.gap * 3);
  const notes = byStatus[status];
  const height = Math.max(1, notes.length) * (CARD.h + CARD.gap) + CARD.gap;

  groups.push({
    id: id(),
    type: "group",
    label: status,
    color: COLORS[status],
    x: x - CARD.gap,
    y: -CARD.gap,
    width: CARD.w + CARD.gap * 2,
    height,
  });

  notes.forEach((file, row) => {
    cards.push({
      id: id(),
      type: "file",
      file,
      x,
      y: row * (CARD.h + CARD.gap),
      width: CARD.w,
      height: CARD.h,
    });
  });
});

// Groups first so they render beneath their cards
const canvas = { nodes: [...groups, ...cards], edges: [] };
await writeFile(
  join(VAULT, "Project Board.canvas"),
  JSON.stringify(canvas, null, 2),
);
console.log(`Wrote ${cards.length} cards across ${STATUSES.length} groups`);
```

Run it with `node scripts/build-project-canvas.mjs ~/Vault` and open `Project Board.canvas`. File paths in `file` nodes are vault-relative, which is why the script stores `Projects/<name>.md` rather than an absolute path.

The frontmatter parsing here is intentionally naive. If your properties get more complex, swap in a YAML parser, or pair this with [the Obsidian CLI](/posts/the-obsidian-cli-script-your-vault-from-the-terminal/) to pull note metadata instead of regexing it yourself.

## When generating beats dragging

Generated canvases shine when the layout is derived from data you already maintain: status boards, a reading list grouped by tag, a map of every note linking to a given MOC, or a dependency graph built from a `blockedBy` property. Rerun the script and the board catches up.

They're a worse fit for freeform thinking. If you rearrange cards by hand and then regenerate, your layout is gone. A practical compromise is to generate into a file named something like `Project Board (generated).canvas` and treat it as read-only, keeping your hand-tuned canvases separate. The [Canvas core plugin](/posts/obsidian-canvas-turn-your-vault-into-a-visual-thinking-space/) is still the right tool when the arrangement itself is the thinking.

Also note that the spec is, in the Obsidian team's own words, "relatively conservative." It covers the shared core, not every feature an app might add, so stick to the documented fields if you want files that other JSON Canvas apps can open too.

## Wrapping up

The real win with JSON Canvas is the same one Obsidian sells for notes: your data is a readable file you own. That makes canvases scriptable, diffable in Git, and portable to the [other apps that support the format](https://jsoncanvas.org/docs/apps). Start with the script above, point it at a folder you already organize with properties, and see how much hand-dragging you can delete.
