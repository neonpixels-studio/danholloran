import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, it, expect } from "vitest";
import {
  THEME_COLOR_DARK,
  THEME_COLOR_LIGHT,
  buildThemeColorHeadEntries,
} from "../../theme/utils/themeColor";

const ROOT = process.cwd();
const MANIFEST_PATH = resolve(ROOT, "public/images/site.webmanifest");
const CONFIG_PATH = resolve(ROOT, ".vitepress/config.ts");
const STYLE_PATH = resolve(ROOT, ".vitepress/theme/style.css");
const LIGHT_BG_RE = /@theme\s*\{[^}]*?--color-bg:\s*(#[0-9a-f]{6})\s*;/i;
const DARK_BG_RE = /html\.dark\s*\{[^}]*?--color-bg:\s*(#[0-9a-f]{6})\s*;/i;

// Anchored to a whole line so a commented-out call does not satisfy it.
const HEAD_SPREAD_RE = /^\s*\.\.\.buildThemeColorHeadEntries\(\),?\s*$/m;

interface ManifestIcon {
  src: string;
  sizes: string;
  purpose?: string;
}

function readManifest() {
  return JSON.parse(readFileSync(MANIFEST_PATH, "utf8")) as {
    id?: string;
    start_url?: string;
    theme_color?: string;
    background_color?: string;
    icons: ManifestIcon[];
  };
}

function iconPurposes(icon: ManifestIcon): string[] {
  return (icon.purpose ?? "any").split(/\s+/);
}

describe("site.webmanifest", () => {
  it("points every icon at a file that exists in public/", () => {
    const { icons } = readManifest();

    expect(icons.length).toBeGreaterThan(0);
    for (const icon of icons) {
      const filePath = icon.src.split("?")[0];
      expect(existsSync(resolve(ROOT, "public", `.${filePath}`))).toBe(true);
    }
  });

  it("declares both an 'any' and a 'maskable' icon", () => {
    const purposes = readManifest().icons.flatMap(iconPurposes);

    expect(purposes).toContain("any");
    expect(purposes).toContain("maskable");
  });

  it("sets start_url and id", () => {
    const manifest = readManifest();

    expect(manifest.start_url).toBe("/");
    expect(manifest.id).toBeTruthy();
  });

  it("keeps theme_color and background_color equal to the light theme color", () => {
    const manifest = readManifest();

    expect(manifest.theme_color).toBe(THEME_COLOR_LIGHT);
    expect(manifest.background_color).toBe(THEME_COLOR_LIGHT);
  });
});

describe("theme-color meta tags", () => {
  it("emits one light and one dark tag with the theme colors", () => {
    const entries = buildThemeColorHeadEntries();

    expect(entries).toEqual([
      [
        "meta",
        {
          name: "theme-color",
          content: THEME_COLOR_LIGHT,
          media: "(prefers-color-scheme: light)",
        },
      ],
      [
        "meta",
        {
          name: "theme-color",
          content: THEME_COLOR_DARK,
          media: "(prefers-color-scheme: dark)",
        },
      ],
    ]);
  });

  it("matches the --color-bg tokens in style.css", () => {
    const css = readFileSync(STYLE_PATH, "utf8");

    expect(css.match(LIGHT_BG_RE)?.[1].toLowerCase()).toBe(THEME_COLOR_LIGHT);
    expect(css.match(DARK_BG_RE)?.[1].toLowerCase()).toBe(THEME_COLOR_DARK);
  });

  it("is wired into the VitePress head config", () => {
    const configSource = readFileSync(CONFIG_PATH, "utf8");

    expect(configSource).toMatch(HEAD_SPREAD_RE);
  });
});
