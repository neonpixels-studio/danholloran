import { readFileSync, readdirSync } from "node:fs";
import { join, resolve } from "node:path";
import { describe, it, expect } from "vitest";
import { PAST_LOCATIONS } from "@data/resume";
import { buildThemeStylesheet } from "@utils/themeStylesheet";

const THEME_DIRECTORY = resolve(process.cwd(), ".vitepress/theme");
const STYLE_CSS = readFileSync(join(THEME_DIRECTORY, "style.css"), "utf8");
// style.css generates min-w-ch-1 through min-w-ch-40 (see @source inline).
const MAX_FOOTER_LOCATION_CH = 40;

function sourceFilesIn(directory: string): string[] {
  return readdirSync(directory, { recursive: true, encoding: "utf8" })
    .filter((entry) => /\.(vue|ts)$/.test(entry))
    .map((entry) => join(directory, entry));
}

const VUE_TEMPLATES = sourceFilesIn(THEME_DIRECTORY)
  .filter((file) => file.endsWith(".vue"))
  .map((file) => ({ file, source: readFileSync(file, "utf8") }));

function classesMatching(pattern: RegExp): string[] {
  return VUE_TEMPLATES.flatMap(({ source }) => source.match(pattern) ?? []);
}

const STYLESHEET = buildThemeStylesheet({
  light: { settings: [] },
  dark: { settings: [] },
});

// A hashed CSP cannot cover inline style attributes, and Vue renders :style
// and v-show into one at build time.
describe("theme templates", () => {
  it.each(VUE_TEMPLATES.map(({ file, source }) => [file, source]))(
    "%s has no inline style binding",
    (_file, source) => {
      expect(source).not.toMatch(/\sstyle="/);
      expect(source).not.toMatch(/:style=/);
      expect(source).not.toMatch(/\sv-show=/);
    },
  );

  it("only names hex-* classes the generated stylesheet defines", () => {
    const used = classesMatching(/hex-(?:bg|text|border|glow)-[0-9a-f]{6}/g);

    expect(used.length).toBeGreaterThan(0);
    const missing = used.filter((name) => !STYLESHEET.includes(`.${name} `));
    expect(missing).toEqual([]);
  });

  it("only names td-* and text-fluid-* classes that style.css defines", () => {
    const used = classesMatching(/\b(?:td-\d+|text-fluid-[a-z-]+)\b/g);

    expect(used.length).toBeGreaterThan(0);
    const missing = used.filter(
      (name) =>
        !STYLE_CSS.includes(`.${name} {`) &&
        !STYLE_CSS.includes(`@utility ${name} {`),
    );
    expect(missing).toEqual([]);
  });
});

describe("footer location width", () => {
  it("stays within the generated min-w-ch-* classes", () => {
    const longest = Math.max(
      ...PAST_LOCATIONS.map(({ city, state }) => `${city}, ${state}`.length),
    );

    expect(longest).toBeLessThanOrEqual(MAX_FOOTER_LOCATION_CH);
  });
});
