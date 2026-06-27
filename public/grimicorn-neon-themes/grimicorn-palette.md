# Grimicorn Neon — Color Palette Reference

> The high-voltage, always-on-rave variant of Grimicorn. Same hue roles, cranked to neon on a near-black base. Use this as the source of truth when porting Grimicorn Neon to a new tool.

---

## Core Philosophy

- Neon is **dark-only**: saturated, glowing accents on a near-black `#0A0A0B` base — the loud opposite of the calm original, by design.
- Same hue roles as Grimicorn, remapped to electric values pulled from grimicorn.dev.
- Accent hierarchy: **Blue → Purple → Teal** (primary → secondary → tertiary interactions).
- Semantic colors are consistent: Green = success/strings, Teal = info/constants, Yellow = types/warnings, Pink = errors, Gray = muted/comments.

---

## Palette

### ANSI / Semantic Colors (the 8 key hues)

| Role | Dark Hex | Light Hex | Usage |
|------|----------|-----------|-------|
| **Blue** | `#2323FF` | `#2323FF` | Keywords, links, primary accent, badges |
| **Purple** | `#A855F7` | `#A855F7` | Functions, CSS selectors, markdown italic |
| **Green** | `#A3E635` | `#A3E635` | Strings, success states, cursor |
| **Teal** | `#22D3EE` | `#22D3EE` | Constants, info, object properties, selection |
| **Yellow** | `#FACC15` | `#FACC15` | Types/classes, decorators, warnings, markdown bold |
| **Pink** | `#FF2D9B` | `#FF2D9B` | Errors, invalid, deleted git decorations |
| **Gray** | `#A7A39C` | `#1C1C20` | Comments, muted text, inactive elements |
| **Black/Dark** | `#0A0A0B` | `#E7E5E4` | Deepest background, terminal ANSI black |

### Background Scale (Dark)

| Token | Hex | Usage |
|-------|-----|-------|
| `base-00` | `#050506` | Deepest / absolute bottom |
| `base-05` | `#0A0A0B` | Activity bar, status bar, title bar, deep panels |
| `base-10` | `#131316` | Sidebar, panels, terminal bg, inactive tabs |
| `base-20` | `#1C1C20` | **Primary editor background**, active tab |
| `base-25` | `#26262B` | Line highlight, list hover |
| `base-30` | `#303036` | Subtle raised elements |
| `base-100` | `#E7E5E4` | Primary foreground text |

### Background Scale (Light)

| Token | Hex | Usage |
|-------|-----|-------|
| Deep | `#0A0A0B` | Activity bar, status bar, title bar |
| Panel | `#131316` | Sidebar, inactive tabs, panels |
| **Editor** | `#1C1C20` | **Primary editor / content background** |
| Border | `#303036` | Dividers, tab borders |
| Line HL | `#26262B` | Line highlight, list hover |
| Foreground | `#E7E5E4` | Primary body text |

---

## Color Values by Variant

### Dark — Full Reference

```
Background (editor)      #1C1C20
Background (sidebar)     #131316
Background (activity)    #0A0A0B
Background (line HL)     #26262B
Foreground (primary)     #E7E5E4
Foreground (muted)       #A7A39C
Foreground (faint)       #75726B

Accent Blue              #2323FF   hsl(210°, 65%, 71%)
Accent Purple            #A855F7
Accent Green             #A3E635
Accent Teal              #22D3EE
Accent Yellow            #FACC15
Accent Pink               #FF2D9B

Selection                #22D3EE44  (teal at ~27% opacity)
Find match               #FACC1555  (yellow at ~33% opacity)
Diff added bg            #A3E63522
Diff removed bg          #FF2D9B22
```

### Light — Full Reference

```
Background (editor)      #1C1C20
Background (sidebar)     #131316
Background (activity)    #0A0A0B
Background (line HL)     #26262B
Foreground (primary)     #E7E5E4
Foreground (muted/gray)  #1C1C20

Accent Blue              #2323FF
Accent Purple            #A855F7
Accent Green             #A3E635
Accent Teal              #22D3EE
Accent Yellow            #FACC15
Accent Pink               #FF2D9B
```

---

## Syntax Token Mapping

| Token | Dark | Light | Notes |
|-------|------|-------|-------|
| Comments | `#A7A39C` italic | `#1C1C2088` italic | Muted gray |
| Keywords / storage | `#2323FF` | `#2323FF` | Blue |
| Operators | `#2323FF` | `#2323FF` | Blue |
| Functions | `#A855F7` | `#A855F7` | Purple |
| Strings | `#A3E635` | `#A3E635` | Green |
| String escapes / template expr | `#22D3EE` | `#22D3EE` | Teal |
| Types / Classes / Tags | `#FACC15` | `#FACC15` | Yellow |
| Constants / Numbers | `#22D3EE` | `#22D3EE` | Teal |
| Variables / Punctuation | `#E7E5E4` | `#E7E5E4` | Foreground |
| Object properties | `#22D3EE` | `#22D3EE` | Teal |
| HTML attributes | `#2323FF` | `#2323FF` | Blue |
| CSS properties | `#2323FF` | `#2323FF` | Blue |
| CSS selectors (class/id) | `#A855F7` | `#A855F7` | Purple |
| CSS values | `#A3E635` | `#A3E635` | Green |
| Decorators | `#FACC15` italic | `#FACC15` italic | Yellow |
| Errors / Invalid | `#FF2D9B` | `#FF2D9B` | Pink |

---

## Semantic / UI Token Mapping

| Role | Dark | Light |
|------|------|-------|
| Cursor | `#A3E635` | `#A3E635` |
| Active tab accent (top border) | `#2323FF` | `#2323FF` |
| Badges / buttons | `#2323FF` bg / `#000000` fg | `#2323FF` bg / `#FFFFFF` fg |
| Button hover | `#5A5AFF` | `#5A5AFF` |
| Git added | `#A3E635` | `#A3E635` |
| Git modified | `#FACC15` | `#FACC15` |
| Git deleted | `#FF2D9B` | `#FF2D9B` |
| Git untracked | `#22D3EE` | `#22D3EE` |
| Bracket pair 1 | `#2323FF` | `#2323FF` |
| Bracket pair 2 | `#A855F7` | `#A855F7` |
| Bracket pair 3 | `#22D3EE` | `#22D3EE` |

---

## Heading Color Stack

Obsidian and any tool supporting per-level heading colors can use this waterfall (dark values shown):

```
H1  #2323FF  (Blue)
H2  #A855F7  (Purple)
H3  #22D3EE  (Teal)
H4  #A3E635  (Green)
H5  #FACC15  (Yellow)
H6  #A7A39C  (Gray)
```

---

## ANSI Terminal Palette

Used for terminal emulators (iTerm2, macOS Terminal, etc.):

| ANSI Slot | Dark | Light |
|-----------|------|-------|
| Black (0) | `#0A0A0B` | `#E7E5E4` |
| Red (1) | `#FF2D9B` | `#FF2D9B` |
| Green (2) | `#A3E635` | `#A3E635` |
| Yellow (3) | `#FACC15` | `#FACC15` |
| Blue (4) | `#2323FF` | `#2323FF` |
| Magenta (5) | `#A855F7` | `#A855F7` |
| Cyan (6) | `#22D3EE` | `#22D3EE` |
| White (7) | `#A7A39C` | `#1C1C20` |
| Bright Black (8) | `#1C1C20` | `#1C1C20` |
| Bright Red (9) | `#FF2D9B` | `#FF2D9B` |
| Bright Green (10) | `#A3E635` | `#A3E635` |
| Bright Yellow (11) | `#FACC15` | `#FACC15` |
| Bright Blue (12) | `#2323FF` | `#2323FF` |
| Bright Magenta (13) | `#A855F7` | `#A855F7` |
| Bright Cyan (14) | `#22D3EE` | `#22D3EE` |
| Bright White (15) | `#E7E5E4` | `#1C1C20` |
| Foreground | `#E7E5E4` | `#E7E5E4` |
| Background | `#131316` | `#131316` |

---

## Quick-Start Template for New Tools

When porting to a new tool, assign these roles:

```
BACKGROUND_PRIMARY    = #1C1C20 / #1C1C20
BACKGROUND_SECONDARY  = #131316 / #131316
BACKGROUND_DEEP       = #0A0A0B / #0A0A0B
FOREGROUND_PRIMARY    = #E7E5E4 / #E7E5E4
FOREGROUND_MUTED      = #A7A39C / #1C1C20
ACCENT_PRIMARY        = #2323FF / #2323FF   (Blue — main interactive accent)
ACCENT_SECONDARY      = #A855F7 / #A855F7   (Purple — secondary accent)
ACCENT_TERTIARY       = #22D3EE / #22D3EE   (Teal — info / tertiary)
COLOR_SUCCESS         = #A3E635 / #A3E635   (Green)
COLOR_WARNING         = #FACC15 / #FACC15   (Yellow)
COLOR_ERROR           = #FF2D9B / #FF2D9B   (Pink)
COLOR_INFO            = #22D3EE / #22D3EE   (Teal)
BORDER_DEFAULT        = #0A0A0B / #303036
BORDER_FOCUS          = #2323FF / #2323FF
```

---

## Existing Theme Ports

Neon ships a single dark-only file per tool.

| Tool | Neon file | Folder |
|------|-----------|--------|
| VS Code | `grimicorn-neon.color-theme.json` | `themes/vscode/` |
| iTerm2 | `Grimicorn-Neon.itermcolors` | `themes/iterm/` |
| macOS Terminal | `Grimicorn-Neon.terminal` | `themes/terminal/` |
| Git Tower | `Grimicorn-Neon.towertheme` | `themes/gittower/` |
| Obsidian | `theme.css` + `manifest.json` | `themes/obsidian/` |
| Claude Code | `grimicorn-neon.json` | `themes/claude-code/` |
| Ghostty | `grimicorn-neon.conf` | `themes/ghostty/` |
| tmux | `grimicorn-neon-tmux.conf` | `themes/tmux/` |
| Shiki | `grimicorn-neon.tmTheme` | `themes/shiki/` |
| Cursor | `grimicorn-neon-cursor.color-theme.json` | `themes/cursor/` |
| Devin | `grimicorn-neon-devin.color-theme.json` | `themes/devin/` |
| Antigravity | `grimicorn-neon-antigravity.color-theme.json` | `themes/antigravity/` |
| JetBrains IDE | `Grimicorn-Neon.icls` | `themes/jetbrains/` |
| Warp | `grimicorn-neon.yaml` | `themes/warp/` |
