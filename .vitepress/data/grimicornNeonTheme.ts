import type { GrimicornNeonHue, GrimicornTool } from "@typedefs";

/**
 * Grimicorn Neon — the always-on-rave variant. Dark-only, electric accents
 * pulled from grimicorn.dev, on a near-black base.
 */
export const NEON_HUES: GrimicornNeonHue[] = [
  { role: "Blue", hex: "#2323FF", usage: "Keywords · links · primary accent" },
  {
    role: "Purple",
    hex: "#A855F7",
    usage: "Functions · selectors · secondary",
  },
  { role: "Green", hex: "#A3E635", usage: "Strings · success · cursor" },
  { role: "Teal", hex: "#22D3EE", usage: "Constants · info · properties" },
  { role: "Yellow", hex: "#FACC15", usage: "Types · decorators · warnings" },
  { role: "Pink", hex: "#FF2D9B", usage: "Errors · invalid · deletions" },
  { role: "Gray", hex: "#A7A39C", usage: "Comments · muted · inactive" },
  { role: "Black", hex: "#0A0A0B", usage: "Deepest background · ANSI black" },
];

/** Near-black background scale, deepest to raised. */
export const NEON_BG = [
  "#050506",
  "#0A0A0B",
  "#131316",
  "#1C1C20",
  "#26262B",
  "#303036",
];

/** The six rainbow stops, in order, for gradient text + rave animation. */
export const NEON_RAINBOW = [
  "#FF2D9B",
  "#FACC15",
  "#A3E635",
  "#22D3EE",
  "#2323FF",
  "#A855F7",
];

const FILES_BASE = "/grimicorn-neon-themes";

export const NEON_PALETTE_HREF = `${FILES_BASE}/grimicorn-palette.md`;
export const NEON_ZIP_HREF = `${FILES_BASE}/grimicorn-neon-themes.zip`;

/** Tool ports — neon ships a single dark-only file per tool (Obsidian needs two). */
export const NEON_TOOLS: GrimicornTool[] = [
  {
    name: "VS Code",
    kind: "editor",
    featured: true,
    desc: "Full editor + workbench theme, glowing on near-black.",
    files: [
      {
        label: "Neon",
        href: `${FILES_BASE}/vscode/grimicorn-neon.color-theme.json`,
        download: "grimicorn-neon.color-theme.json",
      },
    ],
    install:
      "Drop the file into a folder with a package.json under <code>~/.vscode/extensions/grimicorn-neon/</code>, reload, then pick Grimicorn Neon in <code>⌘K ⌘T</code>.",
    docs: "https://code.visualstudio.com/docs/configure/themes",
  },
  {
    name: "Git Tower",
    kind: "git",
    featured: true,
    desc: "Diff & syntax theme for the Tower git client.",
    files: [
      {
        label: "Neon",
        href: `${FILES_BASE}/gittower/Grimicorn-Neon.towertheme`,
        download: "Grimicorn Neon.towertheme",
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
    desc: "Vault theme with the full neon heading-color waterfall.",
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
      "Place both files in <code>.obsidian/themes/Grimicorn Neon/</code>, then Settings → Appearance → <em>Grimicorn Neon</em>.",
    docs: "https://help.obsidian.md/themes",
  },
  {
    name: "Claude Code",
    kind: "agent",
    featured: true,
    desc: "Terminal-agent palette — diffs, prompts, plan & accept modes.",
    files: [
      {
        label: "Neon",
        href: `${FILES_BASE}/claude-code/grimicorn-neon.json`,
        download: "grimicorn-neon.json",
      },
    ],
    install:
      "Drop the JSON into <code>~/.claude/themes/</code>, then select Grimicorn Neon from the theme menu.",
    docs: "https://docs.anthropic.com/en/docs/claude-code/overview",
  },
  {
    name: "Ghostty",
    kind: "terminal",
    featured: true,
    desc: "Terminal config — background, foreground, cursor & the 16-color ANSI palette.",
    files: [
      {
        label: "Neon",
        href: `${FILES_BASE}/ghostty/grimicorn-neon.conf`,
        download: "grimicorn-neon.conf",
      },
    ],
    install:
      "Drop it in <code>~/.config/ghostty/themes/</code> and set <code>theme = grimicorn-neon</code>, or include it with <code>config-file = …</code>.",
    docs: "https://ghostty.org/docs/config/reference#theme",
  },
  {
    name: "Cursor",
    kind: "editor",
    desc: "AI-first VS Code fork — the same neon editor + workbench theme.",
    files: [
      {
        label: "Neon",
        href: `${FILES_BASE}/cursor/grimicorn-neon-cursor.color-theme.json`,
        download: "grimicorn-neon-cursor.color-theme.json",
      },
    ],
    install:
      "Drop the file into a folder with a package.json under <code>~/.cursor/extensions/grimicorn-neon/</code>, reload, then pick Grimicorn Neon in <code>⌘K ⌘T</code>.",
    docs: "https://docs.cursor.com/",
  },
  {
    name: "Devin",
    kind: "agent",
    desc: "Cognition's AI engineer — neon for its VS Code-based workspace editor.",
    files: [
      {
        label: "Neon",
        href: `${FILES_BASE}/devin/grimicorn-neon-devin.color-theme.json`,
        download: "grimicorn-neon-devin.color-theme.json",
      },
    ],
    install:
      "Devin's workspace runs a VS Code editor — load it as a VS Code color theme, then select Grimicorn Neon.",
    docs: "https://docs.devin.ai/",
  },
  {
    name: "Antigravity",
    kind: "editor",
    desc: "Google's agentic IDE (VS Code-based) — the full neon editor theme.",
    files: [
      {
        label: "Neon",
        href: `${FILES_BASE}/antigravity/grimicorn-neon-antigravity.color-theme.json`,
        download: "grimicorn-neon-antigravity.color-theme.json",
      },
    ],
    install:
      "Load it like any VS Code theme — a folder with a package.json in Antigravity's extensions directory — then pick Grimicorn Neon.",
    docs: "https://antigravity.google/",
  },
  {
    name: "JetBrains IDE",
    kind: "editor",
    desc: "Editor color scheme for IntelliJ, WebStorm, PyCharm & the rest.",
    files: [
      {
        label: "Neon",
        href: `${FILES_BASE}/jetbrains/Grimicorn-Neon.icls`,
        download: "Grimicorn-Neon.icls",
      },
    ],
    install:
      "Settings → Editor → Color Scheme → ⚙︎ → <em>Import Scheme…</em>, choose the <code>.icls</code>, then select Grimicorn Neon.",
    docs: "https://www.jetbrains.com/help/idea/configuring-colors-and-fonts.html",
  },
  {
    name: "Warp",
    kind: "terminal",
    desc: "YAML theme — accent, background & the full 16-color ANSI set.",
    files: [
      {
        label: "Neon",
        href: `${FILES_BASE}/warp/grimicorn-neon.yaml`,
        download: "grimicorn-neon.yaml",
      },
    ],
    install:
      "Copy the file into <code>~/.warp/themes/</code>, then Settings → Appearance → Themes → <em>Grimicorn Neon</em>.",
    docs: "https://docs.warp.dev/terminal/appearance/custom-themes",
  },
  {
    name: "iTerm2",
    kind: "terminal",
    desc: "Color preset for the macOS terminal favorite.",
    files: [
      {
        label: "Neon",
        href: `${FILES_BASE}/iterm/Grimicorn-Neon.itermcolors`,
        download: "Grimicorn-Neon.itermcolors",
      },
    ],
    install:
      "Settings → Profiles → Colors → <em>Color Presets…</em> → <em>Import</em>, then select the preset.",
    docs: "https://iterm2.com/documentation-preferences-profiles-colors.html",
  },
  {
    name: "macOS Terminal",
    kind: "terminal",
    desc: "Native Terminal.app profile.",
    files: [
      {
        label: "Neon",
        href: `${FILES_BASE}/terminal/Grimicorn-Neon.terminal`,
        download: "Grimicorn Neon.terminal",
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
        label: "Neon",
        href: `${FILES_BASE}/tmux/grimicorn-neon-tmux.conf`,
        download: "grimicorn-neon-tmux.conf",
      },
    ],
    install:
      "Add <code>source-file ~/path/grimicorn-neon-tmux.conf</code> to your <code>.tmux.conf</code>, then reload with <code>tmux source-file ~/.tmux.conf</code>.",
    docs: "https://man.openbsd.org/tmux#STYLES",
  },
  {
    name: "Shiki",
    kind: "highlighter",
    desc: "TextMate theme for any Shiki-based site — neon syntax on near-black.",
    files: [
      {
        label: "Neon",
        href: `${FILES_BASE}/shiki/grimicorn-neon.tmTheme`,
        download: "grimicorn-neon.tmTheme",
      },
    ],
    install:
      "Parse the <code>.tmTheme</code> with a plist reader and pass the object to Shiki's <code>theme</code> option (VitePress, Astro, etc.).",
    docs: "https://shiki.style/guide/load-theme",
  },
];
