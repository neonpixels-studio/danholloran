import type { GrimicornHue, GrimicornTool } from "@typedefs";

/** The 8 core hues, each with its dark + light value and where it's used. */
export const HUES: GrimicornHue[] = [
  {
    role: "Blue",
    dark: "#83AFE5",
    light: "#4A80C8",
    usage: "Keywords · links · primary accent",
  },
  {
    role: "Purple",
    dark: "#9A93E1",
    light: "#6B63C8",
    usage: "Functions · selectors · secondary",
  },
  {
    role: "Green",
    dark: "#A9CE93",
    light: "#2E7D32",
    usage: "Strings · success · cursor",
  },
  {
    role: "Teal",
    dark: "#80C1CA",
    light: "#3A8E96",
    usage: "Constants · info · properties",
  },
  {
    role: "Yellow",
    dark: "#DADA93",
    light: "#8A8A20",
    usage: "Types · decorators · warnings",
  },
  {
    role: "Salmon",
    dark: "#DD9787",
    light: "#C4604E",
    usage: "Errors · invalid · deletions",
  },
  {
    role: "Gray",
    dark: "#BFBFBF",
    light: "#3C4C55",
    usage: "Comments · muted · inactive",
  },
  {
    role: "Black",
    dark: "#253039",
    light: "#1A262C",
    usage: "Deepest background · ANSI black",
  },
];

/** Background scale, deepest to raised. */
export const BG_DARK = [
  "#1E2A31",
  "#253039",
  "#2E3C44",
  "#3C4C55",
  "#445060",
  "#4E5C66",
];
export const BG_LIGHT = [
  "#E4E4E4",
  "#F0F0F0",
  "#FDFDFD",
  "#EBEBEB",
  "#D0D0D0",
  "#FDFDFD",
];

/** Where the downloadable theme files live (also bundled into the .zip). */
const FILES_BASE = "/grimicorn-themes";

/** Reference palette + the prebuilt bundle of every port. */
export const PALETTE_HREF = `${FILES_BASE}/grimicorn-palette.md`;
export const ZIP_HREF = `${FILES_BASE}/grimicorn-themes.zip`;

/** Tool ports — each ships a dark and a light file. */
export const TOOLS: GrimicornTool[] = [
  {
    name: "VS Code",
    kind: "editor",
    featured: true,
    desc: "Full editor + workbench theme. Pick “Grimicorn Dark / Light” from the theme picker.",
    files: [
      {
        label: "Dark",
        href: `${FILES_BASE}/vscode/grimicorn-dark.color-theme.json`,
        download: "grimicorn-dark.color-theme.json",
      },
      {
        label: "Light",
        href: `${FILES_BASE}/vscode/grimicorn-light.color-theme.json`,
        download: "grimicorn-light.color-theme.json",
      },
    ],
    install:
      "Drop both files into a folder with a package.json under <code>~/.vscode/extensions/grimicorn/</code>, reload, then choose the theme in <code>⌘K ⌘T</code>.",
    docs: "https://code.visualstudio.com/docs/configure/themes",
  },
  {
    name: "Git Tower",
    kind: "git",
    desc: "Diff & syntax theme for the Tower git client.",
    featured: true,
    files: [
      {
        label: "Dark",
        href: `${FILES_BASE}/gittower/Grimicorn-Dark.towertheme`,
        download: "Grimicorn (Dark).towertheme",
      },
      {
        label: "Light",
        href: `${FILES_BASE}/gittower/Grimicorn-Light.towertheme`,
        download: "Grimicorn (Light).towertheme",
      },
    ],
    install:
      "Double-click the <code>.towertheme</code> to install, then pick it in Tower → Settings → Git Config / Appearance.",
    docs: "https://www.git-tower.com/help/guides/integration/syntax-highlighting/mac",
  },
  {
    name: "Obsidian",
    kind: "notes",
    featured: true,
    desc: "Vault theme with the full heading-color waterfall.",
    files: [
      {
        label: "theme.css",
        href: `${FILES_BASE}/obsidian/theme.css`,
        download: "theme.css",
      },
      {
        label: "manifest.json",
        href: `${FILES_BASE}/obsidian/manifest.json`,
        download: "manifest.json",
      },
    ],
    install:
      "Place both files in <code>.obsidian/themes/Grimicorn/</code>, then Settings → Appearance → <em>Grimicorn</em>.",
    docs: "https://help.obsidian.md/themes",
  },
  {
    name: "Claude Code",
    kind: "agent",
    featured: true,
    desc: "Terminal-agent palette — diffs, prompts, plan & accept modes.",
    files: [
      {
        label: "Dark",
        href: `${FILES_BASE}/claude-code/grimicorn-dark.json`,
        download: "grimicorn-dark.json",
      },
      {
        label: "Light",
        href: `${FILES_BASE}/claude-code/grimicorn-light.json`,
        download: "grimicorn-light.json",
      },
    ],
    install:
      "Drop the JSON into <code>~/.claude/themes/</code>, then select Grimicorn from the theme menu.",
    docs: "https://docs.anthropic.com/en/docs/claude-code/overview",
  },
  {
    name: "Ghostty",
    kind: "terminal",
    desc: "Terminal config — background, foreground, cursor & the 16-color ANSI palette.",
    featured: true,
    files: [
      {
        label: "Dark",
        href: `${FILES_BASE}/ghostty/grimicorn-dark.conf`,
        download: "grimicorn-dark.conf",
      },
      {
        label: "Light",
        href: `${FILES_BASE}/ghostty/grimicorn-light.conf`,
        download: "grimicorn-light.conf",
      },
    ],
    install:
      "Drop it in <code>~/.config/ghostty/themes/</code> and set <code>theme = grimicorn-dark</code>, or include it with <code>config-file = …</code>.",
    docs: "https://ghostty.org/docs/config/reference#theme",
  },
  {
    name: "Cursor",
    kind: "editor",
    desc: "AI-first VS Code fork — the same Grimicorn editor + workbench theme.",
    files: [
      {
        label: "Dark",
        href: `${FILES_BASE}/cursor/grimicorn-cursor-dark.color-theme.json`,
        download: "grimicorn-cursor-dark.color-theme.json",
      },
      {
        label: "Light",
        href: `${FILES_BASE}/cursor/grimicorn-cursor-light.color-theme.json`,
        download: "grimicorn-cursor-light.color-theme.json",
      },
    ],
    install:
      "Drop both files into a folder with a package.json under <code>~/.cursor/extensions/grimicorn/</code>, reload, then pick the theme in <code>⌘K ⌘T</code>.",
    docs: "https://docs.cursor.com/",
  },
  {
    name: "Devin",
    kind: "agent",
    desc: "Cognition's AI engineer — Grimicorn for its VS Code-based workspace editor.",
    files: [
      {
        label: "Dark",
        href: `${FILES_BASE}/devin/grimicorn-devin-dark.color-theme.json`,
        download: "grimicorn-devin-dark.color-theme.json",
      },
      {
        label: "Light",
        href: `${FILES_BASE}/devin/grimicorn-devin-light.color-theme.json`,
        download: "grimicorn-devin-light.color-theme.json",
      },
    ],
    install:
      "Devin's workspace runs a VS Code editor — load it as a VS Code color theme (a folder with a package.json in the extensions directory), then select Grimicorn.",
    docs: "https://docs.devin.ai/",
  },
  {
    name: "Antigravity",
    kind: "editor",
    desc: "Google's agentic IDE (VS Code-based) — the full Grimicorn editor theme.",
    files: [
      {
        label: "Dark",
        href: `${FILES_BASE}/antigravity/grimicorn-antigravity-dark.color-theme.json`,
        download: "grimicorn-antigravity-dark.color-theme.json",
      },
      {
        label: "Light",
        href: `${FILES_BASE}/antigravity/grimicorn-antigravity-light.color-theme.json`,
        download: "grimicorn-antigravity-light.color-theme.json",
      },
    ],
    install:
      "Load it like any VS Code theme — a folder with a package.json in Antigravity's extensions directory — then pick Grimicorn.",
    docs: "https://antigravity.google/",
  },
  {
    name: "JetBrains IDE",
    kind: "editor",
    desc: "Editor color scheme for IntelliJ, WebStorm, PyCharm & the rest.",
    files: [
      {
        label: "Dark",
        href: `${FILES_BASE}/jetbrains/Grimicorn-Dark.icls`,
        download: "Grimicorn-Dark.icls",
      },
      {
        label: "Light",
        href: `${FILES_BASE}/jetbrains/Grimicorn-Light.icls`,
        download: "Grimicorn-Light.icls",
      },
    ],
    install:
      "Settings → Editor → Color Scheme → ⚙︎ → <em>Import Scheme…</em>, choose the <code>.icls</code>, then select Grimicorn.",
    docs: "https://www.jetbrains.com/help/idea/configuring-colors-and-fonts.html",
  },
  {
    name: "Warp",
    kind: "terminal",
    desc: "YAML theme — accent, background & the full 16-color ANSI set.",
    files: [
      {
        label: "Dark",
        href: `${FILES_BASE}/warp/grimicorn-dark.yaml`,
        download: "grimicorn-dark.yaml",
      },
      {
        label: "Light",
        href: `${FILES_BASE}/warp/grimicorn-light.yaml`,
        download: "grimicorn-light.yaml",
      },
    ],
    install:
      "Copy the file into <code>~/.warp/themes/</code>, then Settings → Appearance → Themes → <em>Grimicorn</em>.",
    docs: "https://docs.warp.dev/terminal/appearance/custom-themes",
  },
  {
    name: "iTerm2",
    kind: "terminal",
    desc: "Color presets for the macOS terminal favorite.",
    files: [
      {
        label: "Dark",
        href: `${FILES_BASE}/iterm/Grimicorn-Dark.itermcolors`,
        download: "Grimicorn-Dark.itermcolors",
      },
      {
        label: "Light",
        href: `${FILES_BASE}/iterm/Grimicorn-Light.itermcolors`,
        download: "Grimicorn-Light.itermcolors",
      },
    ],
    install:
      "Settings → Profiles → Colors → <em>Color Presets…</em> → <em>Import</em>, then select the preset.",
    docs: "https://iterm2.com/documentation-preferences-profiles-colors.html",
  },
  {
    name: "Panic Prompt",
    kind: "terminal",
    featured: true,
    desc: "Panic's SSH client for Mac & iOS — background, cursor, selection & the full 16-color ANSI palette.",
    files: [
      {
        label: "Dark",
        href: `${FILES_BASE}/prompt/Grimicorn-Dark.promptTheme`,
        download: "Grimicorn-Dark.promptTheme",
      },
      {
        label: "Light",
        href: `${FILES_BASE}/prompt/Grimicorn-Light.promptTheme`,
        download: "Grimicorn-Light.promptTheme",
      },
    ],
    install:
      "Double-click the <code>.promptTheme</code> to import (or Settings → Themes → ⚙︎ → <em>Import</em>), then pick Grimicorn from the theme list.",
    docs: "https://help.panic.com/prompt/prompt-themes/",
  },
  {
    name: "macOS Terminal",
    kind: "terminal",
    desc: "Native Terminal.app profiles.",
    files: [
      {
        label: "Dark",
        href: `${FILES_BASE}/terminal/Grimicorn-Dark.terminal`,
        download: "Grimicorn (Dark).terminal",
      },
      {
        label: "Light",
        href: `${FILES_BASE}/terminal/Grimicorn-Light.terminal`,
        download: "Grimicorn (Light).terminal",
      },
    ],
    install:
      "Double-click the file (or Settings → Profiles → ⚙︎ → <em>Import</em>), then set as default.",
    docs: "https://support.apple.com/guide/terminal/change-profiles-color-trml1067/mac",
  },
  {
    name: "tmux",
    kind: "terminal",
    desc: "Status-line theme — session pill, window tabs, pane borders & copy mode.",
    files: [
      {
        label: "Dark",
        href: `${FILES_BASE}/tmux/grimicorn-tmux-dark.conf`,
        download: "grimicorn-tmux-dark.conf",
      },
      {
        label: "Light",
        href: `${FILES_BASE}/tmux/grimicorn-tmux-light.conf`,
        download: "grimicorn-tmux-light.conf",
      },
    ],
    install:
      "Add <code>source-file ~/path/grimicorn-tmux-dark.conf</code> to your <code>.tmux.conf</code>, then reload with <code>tmux source-file ~/.tmux.conf</code>.",
    docs: "https://man.openbsd.org/tmux#STYLES",
  },
  {
    name: "Shiki",
    kind: "highlighter",
    desc: "TextMate themes that power this very blog's syntax highlighting — drop them into any Shiki-based site.",
    files: [
      {
        label: "Dark",
        href: `${FILES_BASE}/shiki/grimicorn-dark.tmTheme`,
        download: "grimicorn-dark.tmTheme",
      },
      {
        label: "Light",
        href: `${FILES_BASE}/shiki/grimicorn-light.tmTheme`,
        download: "grimicorn-light.tmTheme",
      },
    ],
    install:
      "Parse the <code>.tmTheme</code> with a plist reader and pass the object to Shiki's <code>theme</code> option (VitePress, Astro, etc.).",
    docs: "https://shiki.style/guide/load-theme",
  },
];
