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
const FONTS_DIRECTORY = resolve(ROOT, ".vitepress/theme/fonts");
const LICENSE_DIRECTORY = resolve(ROOT, "public/fonts");
const GOOGLE_FONT_ORIGINS = ["fonts.googleapis.com", "fonts.gstatic.com"];
const FONT_URL_RE = /url\("\.\/fonts\/([^"]+\.woff2)"\)/g;

const BUILT_ASSETS = [
  "/assets/app.DDs2aK1x.js",
  "/assets/inter-latin-opsz-italic.BbqH_2Ar.woff2",
  "/assets/inter-latin-opsz-normal.BwkfbSeq.woff2",
  "/assets/jetbrains-mono-latin-wght-normal.B9CIFXIH.woff2",
];

function cacheBlock(headers: string, path: string): string | undefined {
  return headers
    .split("\n\n")
    .find((part) => part.split("\n").some((line) => line === path));
}

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
    expect(
      readSource(STYLE_PATH).match(/font-display: swap/g) ?? [],
    ).toHaveLength(4);
  });

  it("ships every declared font file plus both OFL license texts", () => {
    declaredFontFiles().forEach((fileName) => {
      expect(existsSync(resolve(FONTS_DIRECTORY, fileName))).toBe(true);
    });
    expect(existsSync(resolve(LICENSE_DIRECTORY, "OFL-Inter.txt"))).toBe(true);
    expect(
      existsSync(resolve(LICENSE_DIRECTORY, "OFL-JetBrainsMono.txt")),
    ).toBe(true);
  });

  it("references fonts relatively so Vite content-hashes them", () => {
    expect(readSource(STYLE_PATH)).not.toMatch(/url\("\/fonts\//);
    expect(declaredFontFiles()).toHaveLength(4);
  });

  it("caches hashed /assets/* as immutable and does not cache /fonts/* or /images/* as immutable", () => {
    const headers = readSource(HEADERS_PATH);
    expect(cacheBlock(headers, "/assets/*")).toContain("immutable");
    expect(cacheBlock(headers, "/assets/*")).toContain("max-age=31536000");
    expect(cacheBlock(headers, "/images/*")).not.toContain("immutable");
    expect(cacheBlock(headers, "/images/*")).toContain("must-revalidate");
    expect(cacheBlock(headers, "/fonts/*")).toBeUndefined();
  });

  it("preloads only files that are declared and shipped", () => {
    const declared = declaredFontFiles();
    PRELOADED_FONT_FILES.forEach((fileName) => {
      expect(declared).toContain(fileName);
      expect(existsSync(resolve(FONTS_DIRECTORY, fileName))).toBe(true);
    });
  });

  it("emits crossorigin preload links pointing at the hashed build output", () => {
    const entries = buildFontPreloadHeadEntries(BUILT_ASSETS);
    expect(entries.map(([, attributes]) => attributes.href)).toEqual([
      "/assets/inter-latin-opsz-normal.BwkfbSeq.woff2",
      "/assets/jetbrains-mono-latin-wght-normal.B9CIFXIH.woff2",
    ]);
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

  it("does not match a different font that shares a name prefix", () => {
    const entries = buildFontPreloadHeadEntries([
      ...BUILT_ASSETS,
      "/assets/inter-latin-opsz-normal-extra.ZZZ.woff2",
    ]);
    expect(entries[0][1].href).toBe(
      "/assets/inter-latin-opsz-normal.BwkfbSeq.woff2",
    );
  });

  it("throws when a preloaded font is missing from the build", () => {
    expect(() => buildFontPreloadHeadEntries([])).toThrow(
      /inter-latin-opsz-normal\.woff2 was not found/,
    );
  });
});
