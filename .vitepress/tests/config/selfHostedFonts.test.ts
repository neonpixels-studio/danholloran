import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, it, expect } from "vitest";
import {
  PRELOADED_FONT_FILES,
  buildFontPreloadHeadEntries,
} from "../../theme/utils/fonts";

const ROOT = process.cwd();
const CONFIG_PATH = resolve(ROOT, ".vitepress/config.ts");
const STYLE_PATH = resolve(ROOT, ".vitepress/theme/style.css");
const HEADERS_PATH = resolve(ROOT, "public/_headers");
const FONTS_DIRECTORY = resolve(ROOT, "public/fonts");
const GOOGLE_FONT_ORIGINS = ["fonts.googleapis.com", "fonts.gstatic.com"];
const FONT_URL_RE = /url\("\/fonts\/([^"]+\.woff2)"\)/g;

function readSource(path: string): string {
  return readFileSync(path, "utf8");
}

function declaredFontFiles(): string[] {
  return [...readSource(STYLE_PATH).matchAll(FONT_URL_RE)].map(
    (match) => match[1],
  );
}

describe("self-hosted fonts", () => {
  it.each([
    ["config.ts", CONFIG_PATH],
    ["style.css", STYLE_PATH],
    ["_headers", HEADERS_PATH],
  ])("%s does not reference Google Fonts origins", (_name, path) => {
    const contents = readSource(path);
    GOOGLE_FONT_ORIGINS.forEach((origin) => {
      expect(contents).not.toContain(origin);
    });
  });

  it("declares a woff2 @font-face for every face with font-display: swap", () => {
    const files = declaredFontFiles();
    expect(files).toHaveLength(4);
    expect(readSource(STYLE_PATH).match(/font-display: swap/g)).toHaveLength(4);
  });

  it("ships every declared font file plus both OFL license texts", () => {
    declaredFontFiles().forEach((fileName) => {
      expect(existsSync(resolve(FONTS_DIRECTORY, fileName))).toBe(true);
    });
    expect(existsSync(resolve(FONTS_DIRECTORY, "OFL-Inter.txt"))).toBe(true);
    expect(existsSync(resolve(FONTS_DIRECTORY, "OFL-JetBrainsMono.txt"))).toBe(
      true,
    );
  });

  it("serves /fonts/* with a long-lived immutable cache rule", () => {
    const headers = readSource(HEADERS_PATH);
    const block = headers
      .split("\n\n")
      .find((part) => part.startsWith("/fonts/*"));
    expect(block).toContain("max-age=31536000");
    expect(block).toContain("immutable");
  });

  it("preloads only files that are declared and shipped", () => {
    const declared = declaredFontFiles();
    PRELOADED_FONT_FILES.forEach((fileName) => {
      expect(declared).toContain(fileName);
    });
  });

  it("emits crossorigin font preload links", () => {
    const entries = buildFontPreloadHeadEntries();
    expect(entries).toHaveLength(PRELOADED_FONT_FILES.length);
    entries.forEach(([tag, attributes]) => {
      expect(tag).toBe("link");
      expect(attributes).toMatchObject({
        rel: "preload",
        as: "font",
        type: "font/woff2",
        crossorigin: "",
      });
    });
  });
});
