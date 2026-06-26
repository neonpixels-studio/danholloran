# Grimicorn — Color Palette Reference

> Use this document as the single source of truth when porting the Grimicorn theme to any new tool or service.

---

## Core Philosophy

- Dark variant uses a **muted blue-gray base** with soft pastel syntax colors — nothing is saturated enough to cause eye fatigue.
- Light variant desaturates everything toward darker ink-on-paper tones; the same hue roles apply but the values are shifted darker.
- Accent hierarchy: **Blue → Purple → Teal** (primary → secondary → tertiary interactions).
- Semantic colors are consistent: Green = success/strings, Teal = info/constants, Yellow = types/warnings, Salmon = errors, Gray = muted/comments.

---

## Palette

### ANSI / Semantic Colors (the 8 key hues)

| Role | Dark Hex | Light Hex | Usage |
|------|----------|-----------|-------|
| **Blue** | `#83AFE5` | `#4A80C8` | Keywords, links, primary accent, badges |
| **Purple** | `#9A93E1` | `#6B63C8` | Functions, CSS selectors, markdown italic |
| **Green** | `#A9CE93` | `#2E7D32` | Strings, success states, cursor |
| **Teal** | `#80C1CA` | `#3A8E96` | Constants, info, object properties, selection |
| **Yellow** | `#DADA93` | `#8A8A20` | Types/classes, decorators, warnings, markdown bold |
| **Salmon** | `#DD9787` | `#C4604E` | Errors, invalid, deleted git decorations |
| **Gray** | `#BFBFBF` | `#3C4C55` | Comments, muted text, inactive elements |
| **Black/Dark** | `#253039` | `#1A262C` | Deepest background, terminal ANSI black |

### Background Scale (Dark)

| Token | Hex | Usage |
|-------|-----|-------|
| `base-00` | `#1E2A31` | Deepest / absolute bottom |
| `base-05` | `#253039` | Activity bar, status bar, title bar, deep panels |
| `base-10` | `#2E3C44` | Sidebar, panels, terminal bg, inactive tabs |
| `base-20` | `#3C4C55` | **Primary editor background**, active tab |
| `base-25` | `#445060` | Line highlight, list hover |
| `base-30` | `#4E5C66` | Subtle raised elements |
| `base-100` | `#E5E5E5` | Primary foreground text |

### Background Scale (Light)

| Token | Hex | Usage |
|-------|-----|-------|
| Deep | `#E4E4E4` | Activity bar, status bar, title bar |
| Panel | `#F0F0F0` | Sidebar, inactive tabs, panels |
| **Editor** | `#FDFDFD` | **Primary editor / content background** |
| Border | `#D0D0D0` | Dividers, tab borders |
| Line HL | `#EBEBEB` | Line highlight, list hover |
| Foreground | `#1A262C` | Primary body text |

---

## Color Values by Variant

### Dark — Full Reference

```
Background (editor)      #3C4C55
Background (sidebar)     #2E3C44
Background (activity)    #253039
Background (line HL)     #445060
Foreground (primary)     #E5E5E5
Foreground (muted)       #BFBFBF
Foreground (faint)       #6B7880

Accent Blue              #83AFE5   hsl(210°, 65%, 71%)
Accent Purple            #9A93E1
Accent Green             #A9CE93
Accent Teal              #80C1CA
Accent Yellow            #DADA93
Accent Salmon            #DD9787

Selection                #80C1CA44  (teal at ~27% opacity)
Find match               #DADA9355  (yellow at ~33% opacity)
Diff added bg            #A9CE9322
Diff removed bg          #DD978722
```

### Light — Full Reference

```
Background (editor)      #FDFDFD
Background (sidebar)     #F0F0F0
Background (activity)    #E4E4E4
Background (line HL)     #EBEBEB
Foreground (primary)     #1A262C
Foreground (muted/gray)  #3C4C55

Accent Blue              #4A80C8
Accent Purple            #6B63C8
Accent Green             #2E7D32
Accent Teal              #3A8E96
Accent Yellow            #8A8A20
Accent Salmon            #C4604E
```

---

## Syntax Token Mapping

| Token | Dark | Light | Notes |
|-------|------|-------|-------|
| Comments | `#BFBFBF` italic | `#3C4C5588` italic | Muted gray |
| Keywords / storage | `#83AFE5` | `#4A80C8` | Blue |
| Operators | `#83AFE5` | `#4A80C8` | Blue |
| Functions | `#9A93E1` | `#6B63C8` | Purple |
| Strings | `#A9CE93` | `#2E7D32` | Green |
| String escapes / template expr | `#80C1CA` | `#3A8E96` | Teal |
| Types / Classes / Tags | `#DADA93` | `#8A8A20` | Yellow |
| Constants / Numbers | `#80C1CA` | `#3A8E96` | Teal |
| Variables / Punctuation | `#E5E5E5` | `#1A262C` | Foreground |
| Object properties | `#80C1CA` | `#3A8E96` | Teal |
| HTML attributes | `#83AFE5` | `#4A80C8` | Blue |
| CSS properties | `#83AFE5` | `#4A80C8` | Blue |
| CSS selectors (class/id) | `#9A93E1` | `#6B63C8` | Purple |
| CSS values | `#A9CE93` | `#2E7D32` | Green |
| Decorators | `#DADA93` italic | `#8A8A20` italic | Yellow |
| Errors / Invalid | `#DD9787` | `#C4604E` | Salmon |

---

## Semantic / UI Token Mapping

| Role | Dark | Light |
|------|------|-------|
| Cursor | `#A9CE93` | `#2E7D32` |
| Active tab accent (top border) | `#83AFE5` | `#4A80C8` |
| Badges / buttons | `#83AFE5` bg / `#000000` fg | `#4A80C8` bg / `#FFFFFF` fg |
| Button hover | `#9BBFEF` | `#5A90D8` |
| Git added | `#A9CE93` | `#2E7D32` |
| Git modified | `#DADA93` | `#8A8A20` |
| Git deleted | `#DD9787` | `#C4604E` |
| Git untracked | `#80C1CA` | `#3A8E96` |
| Bracket pair 1 | `#83AFE5` | `#4A80C8` |
| Bracket pair 2 | `#9A93E1` | `#6B63C8` |
| Bracket pair 3 | `#80C1CA` | `#3A8E96` |

---

## Heading Color Stack

Obsidian and any tool supporting per-level heading colors can use this waterfall (dark values shown):

```
H1  #83AFE5  (Blue)
H2  #9A93E1  (Purple)
H3  #80C1CA  (Teal)
H4  #A9CE93  (Green)
H5  #DADA93  (Yellow)
H6  #BFBFBF  (Gray)
```

---

## ANSI Terminal Palette

Used for terminal emulators (iTerm2, macOS Terminal, etc.):

| ANSI Slot | Dark | Light |
|-----------|------|-------|
| Black (0) | `#253039` | `#1A262C` |
| Red (1) | `#DD9787` | `#C4604E` |
| Green (2) | `#A9CE93` | `#2E7D32` |
| Yellow (3) | `#DADA93` | `#8A8A20` |
| Blue (4) | `#83AFE5` | `#4A80C8` |
| Magenta (5) | `#9A93E1` | `#6B63C8` |
| Cyan (6) | `#80C1CA` | `#3A8E96` |
| White (7) | `#BFBFBF` | `#FDFDFD` |
| Bright Black (8) | `#3C4C55` | `#3C4C55` |
| Bright Red (9) | `#DD9787` | `#DD9787` |
| Bright Green (10) | `#A9CE93` | `#A9CE93` |
| Bright Yellow (11) | `#DADA93` | `#DADA93` |
| Bright Blue (12) | `#83AFE5` | `#83AFE5` |
| Bright Magenta (13) | `#9A93E1` | `#9A93E1` |
| Bright Cyan (14) | `#80C1CA` | `#80C1CA` |
| Bright White (15) | `#E5E5E5` | `#FDFDFD` |
| Foreground | `#E5E5E5` | `#1A262C` |
| Background | `#2E3C44` | `#F0F0F0` |

---

## Quick-Start Template for New Tools

When porting to a new tool, assign these roles:

```
BACKGROUND_PRIMARY    = #3C4C55 / #FDFDFD
BACKGROUND_SECONDARY  = #2E3C44 / #F0F0F0
BACKGROUND_DEEP       = #253039 / #E4E4E4
FOREGROUND_PRIMARY    = #E5E5E5 / #1A262C
FOREGROUND_MUTED      = #BFBFBF / #3C4C55
ACCENT_PRIMARY        = #83AFE5 / #4A80C8   (Blue — main interactive accent)
ACCENT_SECONDARY      = #9A93E1 / #6B63C8   (Purple — secondary accent)
ACCENT_TERTIARY       = #80C1CA / #3A8E96   (Teal — info / tertiary)
COLOR_SUCCESS         = #A9CE93 / #2E7D32   (Green)
COLOR_WARNING         = #DADA93 / #8A8A20   (Yellow)
COLOR_ERROR           = #DD9787 / #C4604E   (Salmon)
COLOR_INFO            = #80C1CA / #3A8E96   (Teal)
BORDER_DEFAULT        = #253039 / #D0D0D0
BORDER_FOCUS          = #83AFE5 / #4A80C8
```

---

## Existing Theme Ports

| Tool | Dark | Light | File |
|------|------|-------|------|
| VS Code | ✅ `grimicorn-dark.color-theme.json` | ✅ `grimicorn-light.color-theme.json` | `themes/vscode/` |
| iTerm2 | ✅ `Grimicorn-Dark.itermcolors` | ✅ `Grimicorn-Light.itermcolors` | `themes/iterm/` |
| macOS Terminal | ✅ `Grimicorn (Dark).terminal` | ✅ `Grimicorn (Light).terminal` | `themes/terminal/` |
| Git Tower | ✅ `Grimicorn (Dark).towertheme` | ✅ `Grimicorn (Light).towertheme` | `themes/gittower/` |
| Obsidian | ✅ `theme.css` | ✅ (same file, `.theme-light` block) | `themes/obsidian/Grimicorn/` |
| Claude Code | ✅ `grimicorn-dark.json` | ✅ `grimicorn-light.json` | `~/.claude/themes/` |
| cmux | ✅ `grimicorn-dark.conf` | ✅ `grimicorn-light.conf` | `themes/cmux/` |
| Shiki | ✅ `grimicorn-dark.tmTheme` | ✅ `grimicorn-light.tmTheme` | `themes/shiki/` |
