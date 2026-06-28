---
date: "2026-06-28T17:38:59.000+00:00"
tags: ["tooling", "css", "accessibility", "typescript"]
draft: false
title: "Grimicorn Neon: When a Calm Theme Goes Loud"
image: "/images/posts/grimicorn-neon-when-a-calm-theme-goes-loud.jpg"
topic: "development"
description: "The high-voltage variant of Grimicorn keeps every semantic role and swaps in eight electric hexes. Here's what changes, what doesn't, and the contrast tradeoff that makes neon-on-black a deliberate choice."
---

The original Grimicorn was an exercise in restraint: muted pastels on a blue-gray base, tuned so nothing on screen ever burns your eyes. Grimicorn Neon is the opposite impulse. Same grim-reaper-meets-unicorn idea, except this one is plugged into the mains — saturated, glowing accents on a near-black base, dark-only, loud on purpose.

What makes the pair interesting from an engineering angle is how little had to change to get there. Neon is not a new theme so much as the same theme with the volume knob turned all the way up. That only works because of a decision made back in the calm version: colors are defined by role, not by appearance.

## Eight roles, eight louder hexes

Both themes share the exact same role map. Blue is keywords, links, and the primary accent. Green is strings, success, and the cursor. Yellow is types, decorators, and warnings. The accent hierarchy is still blue → purple → teal, and the semantic anchors still hold: green means good, the error color means wrong.

What changes is only the values bound to those roles. Calm Grimicorn's blue is a soft `#83AFE5`; Neon's is an electric `#2323FF`. Calm green is a sage `#A9CE93`; Neon green is an acid `#A3E635`. The error role even swaps identity, from a gentle salmon to a hot `#FF2D9B` pink. Lay the two palettes side by side and the structure is identical — only the saturation and brightness move:

```ts
// same eight roles, two personalities
const calm = {
  blue: "#83AFE5",
  green: "#A9CE93",
  error: "#DD9787",
  base: "#253039",
};
const neon = {
  blue: "#2323FF",
  green: "#A3E635",
  error: "#FF2D9B",
  base: "#0A0A0B",
};
```

Because every one of the fourteen tool ports — VS Code, Ghostty, Obsidian, Claude Code, JetBrains, tmux, and the rest — is generated from a single `palette.md`, producing the neon set was mostly a matter of feeding the build a different eight values. The emitters that translate roles into VS Code scopes or ANSI slots never knew the difference. That is the real payoff of role-based theming: one architecture, two completely different moods, no forked codebase.

## The near-black base is doing real work

Neon accents only read as neon if the thing behind them gets out of the way. Calm Grimicorn could afford a blue-gray base because its accents were gentle. Crank the accents to full saturation and that same base would turn into mud — everything competing, nothing glowing.

So Neon drops the floor to near-black. The background scale runs from `#050506` through `#303036`, six steps that are almost monochrome by design. The chrome recedes, and the only saturated pixels left on screen are the ones carrying meaning: a keyword, a string, an error. High contrast plus near-zero background saturation is what produces the "glow." It is the same trick a concert uses — a dark room is what lets the lights pop.

## Loud is a tradeoff, not a free upgrade

Worth being honest here: maximum-saturation text on a black background is the highest-contrast pairing you can build, and that is not purely a win. On dark UIs, very bright, very saturated glyphs can bloom slightly at their edges — a halation effect that some eyes, especially astigmatic ones, read as fuzziness after a long session. That is exactly the fatigue the calm variant was designed to avoid, which is why Neon ships dark-only and is framed as a mood rather than a default. It is a theme for when you want your screen to feel alive, not for the eighth straight hour of debugging.

That is also why both themes exist instead of one. Calm is the everyday driver; Neon is the rave you opt into. Same roles, same pipeline, same fourteen tools — one tuned to disappear, the other tuned to shout.

If you want to plug in, every tool gets a single neon file, and you can grab one port or the whole set from the [Grimicorn Neon page](https://danholloran.me/themes/grimicorn-neon). The calm original is one click away if your eyes need the quiet back.
