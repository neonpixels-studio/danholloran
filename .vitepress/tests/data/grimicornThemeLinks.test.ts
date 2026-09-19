import { describe, it, expect } from "vitest";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { basename, extname, relative, resolve, sep } from "node:path";
import { TOOLS, PALETTE_HREF, ZIP_HREF } from "@data/grimicornTheme";
import {
  NEON_TOOLS,
  NEON_PALETTE_HREF,
  NEON_ZIP_HREF,
} from "@data/grimicornNeonTheme";
import type { GrimicornTool, GrimicornToolFile } from "@typedefs";

/**
 * Every href in these theme data modules is a hand-written path into
 * public/, served as a static download. A typo'd or renamed file would
 * otherwise only surface as a 404 in production — this walks every href
 * and asserts the file actually exists (as a real, non-empty file, with
 * the exact case on disk) under public/.
 *
 * Paths resolve from `process.cwd()` (the repo root vitest runs in),
 * matching the convention in config/buildDependencies.test.ts.
 */
const PUBLIC_DIR = resolve(process.cwd(), "public");

/**
 * Resolves a root-relative href (e.g. "/grimicorn-themes/vscode/foo.json")
 * to its path under public/. Returns null for anything that isn't a
 * root-relative path confined to public/ (e.g. traversal like
 * "/../package.json") so callers can treat it as an ordinary failure
 * instead of an exception aborting the rest of the check.
 */
function publicPathFor(href: string): string | null {
  const fullPath = resolve(PUBLIC_DIR, `.${href}`);
  const isRootRelative = href.startsWith("/");
  const isInsidePublicDir = fullPath.startsWith(`${PUBLIC_DIR}${sep}`);
  if (!isRootRelative || !isInsidePublicDir) {
    return null;
  }
  return fullPath;
}

/**
 * `existsSync` matches case-insensitively on macOS's default APFS, so a
 * wrong-case href (e.g. "Grimicorn-Dark.itermcolors" for a real
 * "grimicorn-dark.itermcolors") would pass locally and 404 on a
 * case-sensitive host like Netlify. This walks every path segment against
 * the real directory listing to confirm the exact case on disk.
 */
function existsWithExactCase(fullPath: string): boolean {
  const segments = relative(PUBLIC_DIR, fullPath).split(sep);
  return segments.every((segment, index) => {
    const parentDir = resolve(PUBLIC_DIR, ...segments.slice(0, index));
    return readdirSync(parentDir).includes(segment);
  });
}

/**
 * `existsSync` alone isn't enough: it accepts directories and zero-byte
 * files too, and matches the wrong case on a case-insensitive filesystem.
 * Returns a human-readable reason so a failing assertion says which of
 * those it hit, instead of just naming the href.
 */
function downloadFileProblem(href: string): string | null {
  const fullPath = publicPathFor(href);
  if (!fullPath) {
    return `${href}: not a root-relative path under public/`;
  }
  if (!existsSync(fullPath)) {
    return `${href}: no such file`;
  }
  if (!existsWithExactCase(fullPath)) {
    return `${href}: exists but with different case on disk`;
  }
  const stats = statSync(fullPath);
  if (!stats.isFile()) {
    return `${href}: not a file`;
  }
  if (stats.size === 0) {
    return `${href}: empty file`;
  }
  return null;
}

function toolFiles(tools: GrimicornTool[]): GrimicornToolFile[] {
  return tools.flatMap((tool) => tool.files);
}

/** extname() returns "" for a dotfile basename (e.g. ".Xresources"); fall
 * back to the basename itself so two extensionless names still have to
 * agree, without punishing a legitimately extensionless port file. */
function extensionOrBasename(path: string): string {
  const ext = extname(path);
  return (ext || basename(path)).toLowerCase();
}

/**
 * A zip is a valid non-empty file even when it's stale — bundling a new
 * tool file into public/ but forgetting to rebuild the "download all" zip
 * ships a bundle silently missing that file. Zip entry names are stored
 * as plain text in the local file headers, so a byte scan is enough to
 * confirm every tool file's basename is present without a zip-reading
 * dependency.
 */
function unbundledFileNames(tools: GrimicornTool[], zipHref: string): string[] {
  const zipPath = publicPathFor(zipHref);
  if (!zipPath || !existsSync(zipPath)) {
    return [];
  }
  const archiveText = readFileSync(zipPath).toString("latin1");
  const fileNames = toolFiles(tools).map((file) => basename(file.href));
  return fileNames.filter((fileName) => !archiveText.includes(fileName));
}

describe.each([
  {
    themeName: "grimicorn",
    tools: TOOLS,
    paletteHref: PALETTE_HREF,
    zipHref: ZIP_HREF,
    filesBase: "/grimicorn-themes/",
  },
  {
    themeName: "grimicorn-neon",
    tools: NEON_TOOLS,
    paletteHref: NEON_PALETTE_HREF,
    zipHref: NEON_ZIP_HREF,
    filesBase: "/grimicorn-neon-themes/",
  },
])(
  "$themeName theme download links",
  ({ tools, paletteHref, zipHref, filesBase }) => {
    it("declares at least one download file for every tool", () => {
      const toolsWithoutFiles = tools.filter((tool) => tool.files.length === 0);

      expect(toolsWithoutFiles.map((tool) => tool.name)).toEqual([]);
    });

    it("resolves every tool file href to a real file under public/", () => {
      const files = toolFiles(tools);
      expect(files.length).toBeGreaterThan(0);

      const problems = files
        .map((file) => downloadFileProblem(file.href))
        .filter((problem): problem is string => problem !== null);

      expect(problems).toEqual([]);
    });

    it("never points two files at the same href", () => {
      const hrefs = toolFiles(tools).map((file) => file.href);
      const duplicates = hrefs.filter(
        (href, index) => hrefs.indexOf(href) !== index,
      );

      expect(duplicates).toEqual([]);
    });

    it("keeps every href under this theme's own files directory", () => {
      const baseDir = resolve(PUBLIC_DIR, `.${filesBase}`);
      const hrefs = [
        ...toolFiles(tools).map((file) => file.href),
        paletteHref,
        zipHref,
      ];
      const wrongBase = hrefs.filter((href) => {
        const fullPath = publicPathFor(href);
        return !fullPath || !fullPath.startsWith(`${baseDir}${sep}`);
      });

      expect(wrongBase).toEqual([]);
    });

    it("gives every file a download name matching its href's extension", () => {
      const mismatched = toolFiles(tools)
        .filter(
          (file) =>
            extensionOrBasename(file.href) !==
            extensionOrBasename(file.download),
        )
        .map((file) => `${file.download} vs ${file.href}`);

      expect(mismatched).toEqual([]);
    });

    it("resolves the palette and zip bundle hrefs to real files under public/", () => {
      const problems = [paletteHref, zipHref]
        .map((href) => downloadFileProblem(href))
        .filter((problem): problem is string => problem !== null);

      expect(problems).toEqual([]);
    });

    it("bundles every tool file into the zip", () => {
      expect(unbundledFileNames(tools, zipHref)).toEqual([]);
    });
  },
);
