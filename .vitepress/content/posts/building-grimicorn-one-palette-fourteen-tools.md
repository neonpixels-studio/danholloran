---
date: '2026-06-27T16:35:47.000+00:00'
tags: ['tooling', 'css', 'typescript', 'accessibility']
draft: true
title: "Building Grimicorn: One Palette, Fourteen Tools"
image: '/images/posts/building-grimicorn-one-palette-fourteen-tools.jpg'
topic: 'development'
description: "How I turned a single calm, low-fatigue color palette into matching dark and light themes for VS Code, terminals, Obsidian, Claude Code and ten other tools — all generated from one source of truth."
---

A typical day moves through a lot of windows. Editor, terminal, a git client, a notes app, and lately an agentic coding tool or two. Each one ships its own default theme, and even when you pick a "good" one in each, the seams show: the blue that means *keyword* in your editor means *directory* in your shell and *link* in your notes. Your eyes re-learn the color language every time you switch context. It is a small tax, but you pay it hundreds of times a day.

Grimicorn started as a fix for that tax. It is a calm, low-fatigue color theme — the name is grim reaper × unicorn, dead serious but secretly colorful — built on a muted blue-gray base with soft pastel syntax. The real work, though, was not picking the colors. It was making one palette behave identically across fourteen different tools.

## Color by role, not by name

The mistake most themes make is thinking in colors instead of roles. "I'll use teal here because it looks nice" is how you end up with a teal that means three unrelated things in three places.

Grimicorn is built around eight core roles, and each role owns a job everywhere it appears. Blue (`#83AFE5`) is keywords, links, and the primary accent. Green (`#A9CE93`) is strings, success, and the cursor. Salmon (`#DD9787`) is errors, invalid input, and deletions. Yellow (`#DADA93`) is types, decorators, and warnings. The semantic mapping never drifts: green is always "this is good," salmon is always "this is wrong," and accents follow a strict hierarchy of blue → purple → teal so the most important thing on screen is always the same hue.

Once colors are defined by role, porting becomes a translation problem rather than a taste problem. A VS Code `tokenColors` entry for "string" and a Ghostty ANSI green slot are the same decision wearing different clothes.

## One source of truth, many targets

Fourteen tools means fourteen wildly different file formats. VS Code wants JSON with scopes. iTerm2 wants an XML plist of `srgb` components. tmux wants a config script. Ghostty and Warp want their own flavors of key-value. Maintaining those by hand would guarantee drift — fix a color in one, forget the other thirteen.

So every file is generated from a single source of truth: a `grimicorn-palette.md` that defines each role once. A small build step reads that palette and emits each target format:

```ts
const palette = {
  blue:   '#83AFE5', // keywords · links · primary
  green:  '#A9CE93', // strings · success · cursor
  salmon: '#DD9787', // errors · invalid · deletions
  // ...eight roles total
} as const

function toVSCode(p: typeof palette) {
  return {
    'editor.foreground': p.gray,
    tokenColors: [
      { scope: 'keyword', settings: { foreground: p.blue } },
      { scope: 'string',  settings: { foreground: p.green } },
    ],
  }
}
```

Each tool gets its own emitter — `toVSCode`, `toGhostty`, `toITerm`, `toTmux` — but they all read the same eight values. Change `green` once and every one of the fourteen ports regenerates with the new value. That is the whole reason the set stays coherent: there is no place for a stray hex code to hide.

## Tuning for low fatigue

The "calm" part is not a vibe; it is a constraint. Nothing in the palette is saturated enough to vibrate against the background. The dark variant rests the same eight roles on a muted blue-gray base; the light variant shifts them toward ink-on-paper without changing what any role *means*. A six-step background scale (`#1E2A31` through `#4E5C66`) gives panels, gutters, and selections somewhere to sit without resorting to pure black or harsh borders.

Shipping a light variant from the same source is where role-based design pays off again. Light mode is not a separate theme — it is the same role map with each color re-tuned for a bright surface. Blue darkens from `#83AFE5` to `#4A80C8` so it still reads as the primary accent against paper. Because the roles are fixed, dark and light stay in sync by construction.

The payoff is the thing you stop noticing. Switch from the editor to the terminal to your notes and the color language holds. A string is the same green in all three. Nothing flares. After enough late nights, that quiet is worth more than any single pretty color.

If you want to try it, every tool ships a dark and a light file, and you can grab one port or the whole set from the [Grimicorn theme page](https://danholloran.me/themes/grimicorn) — all generated, as promised, from that one palette.
