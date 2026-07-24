---
date: "2026-07-24T02:07:32.000-05:00"
tags:
  [
    "obsidian",
    "knowledge-management",
    "productivity",
    "obsidian-api-and-themes",
  ]
draft: false
title: "Building an Obsidian Theme: A Practical Guide to CSS Variables"
image: "/images/posts/building-an-obsidian-theme-a-practical-guide-to-css-variables.jpg"
topic: "obsidian"
description: "You do not need to fight cascade specificity to restyle Obsidian. Override a handful of CSS variables and you have a real theme that respects light and dark mode."
---

Most people who want to change how Obsidian looks reach for a community theme, tweak it until something breaks, and give up. The friction is real, but it usually comes from the wrong mental model. You picture a theme as thousands of lines of CSS selectors chasing deeply nested elements, each one a fresh fight with specificity. Obsidian's actual design is much kinder than that. The entire interface is painted from a few hundred named CSS variables, and a theme is mostly just a file that overrides the ones you care about.

Once that clicks, building a theme stops being a reverse-engineering exercise and becomes something closer to filling in a palette.

## The whole theme is two files

Obsidian loads themes from the `themes` folder inside your vault's `.obsidian` directory. A theme is a folder with exactly two files: a `manifest.json` that names it and a `theme.css` that styles it. The fastest way to start is to clone the official sample:

```bash
cd path/to/vault/.obsidian/themes
git clone https://github.com/obsidianmd/obsidian-sample-theme.git "My Theme"
```

Open `manifest.json`, set `name` to something human like `"My Theme"`, and make sure the folder on disk matches that name exactly. Obsidian keys the theme off the manifest name, so a mismatch means it silently will not appear. Restart Obsidian after editing the manifest, then enable the theme under Settings, Appearance, Themes. From here, every change lives in `theme.css` and reloads without a restart.

## Override variables, not selectors

The heart of theming is overriding Obsidian's built-in variables rather than writing new rules. The app exposes more than 400 of them, covering color, typography, spacing, and component chrome. To change the editor font and the background, you do not target the editor element. You reassign the variables it already reads from:

```css
body {
  --font-text-theme: Georgia, serif;
}

.theme-dark {
  --background-primary: #18004f;
  --background-secondary: #220070;
}

.theme-light {
  --background-primary: #ece4ff;
  --background-secondary: #d9c9ff;
}
```

The selector you choose is what makes a theme feel finished. Put values that should hold in both color schemes on `body`. Put anything that should change between modes under `.theme-dark` or `.theme-light`. This split is why a good theme flips cleanly when someone toggles their base color scheme, and why a lazy one looks broken the moment the sun goes down. Reserve `:root` for the handful of plugin-facing variables that genuinely need to reach every element, like input focus borders; overusing it is how themes become impossible to tweak with a snippet later.

## Find the variable with the inspector

The reference list is long, but you rarely need to read it top to bottom. Obsidian ships Chromium's developer tools, so you can point at any element and read the variable straight off it. Open the tools with `Cmd+Option+I` (or `Ctrl+Shift+I`), click the element-picker cursor, and select, say, the left ribbon. In the Styles panel you will see the rule resolve to something like `background-color: var(--ribbon-background)`. Now you know the exact knob to turn:

```css
body {
  --ribbon-background: #12003a;
}
```

If you would rather browse, open the Sources tab, expand Page, top, obsidian.md, and open `app.css`. Search for a name with two leading spaces, like `  --ribbon-`, and you will land on the definitions rather than the hundreds of places they are used. That two-space trick is the single most useful habit for theme work.

## Ship it with restraint

The temptation once you find the inspector is to override everything. Resist it. The best themes lean on the semantic layer, colors like `--background-primary`, `--text-normal`, and `--interactive-accent`, and let Obsidian's own component variables inherit from those. Change the accent once and buttons, links, and the active-line highlight all move together. Hardcode a hex value deep in a component and you have created a spot that will drift out of sync the next time Obsidian updates its defaults.

When you are ready to share, the sample theme repo doubles as a template you can publish to the community gallery. But you do not have to go that far to benefit. A twenty-line `theme.css` that recolors your workspace to something you actually enjoy staring at for eight hours is a completely legitimate theme, and now you know it is only twenty lines away. Start with the two files, override the semantic colors, and reach for the inspector whenever something surprises you.
