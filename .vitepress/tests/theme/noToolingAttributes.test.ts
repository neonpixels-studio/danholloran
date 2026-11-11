import { readFileSync, readdirSync } from "node:fs";
import { join, resolve } from "node:path";
import { describe, it, expect } from "vitest";

const THEME_DIR = resolve(process.cwd(), ".vitepress/theme");
const POST_VIEW_PATH = join(THEME_DIR, "views/PostView.vue");
const SOURCE_EXTENSIONS = /\.(vue|ts|js|css|md|html)$/;
const TOOLING_ATTRIBUTE = /data-om-id\s*=/;

function listSourceFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) {
      return listSourceFiles(path);
    }
    return entry.isFile() && SOURCE_EXTENSIONS.test(entry.name) ? [path] : [];
  });
}

describe("theme source", () => {
  it("contains no data-om-id editing-tool attributes", () => {
    const files = listSourceFiles(THEME_DIR);
    expect(files).toContain(POST_VIEW_PATH);

    const offenders = files.filter((path) =>
      TOOLING_ATTRIBUTE.test(readFileSync(path, "utf8")),
    );

    expect(offenders).toEqual([]);
  });

  it("detects the attribute when present", () => {
    expect(TOOLING_ATTRIBUTE.test('<p data-om-id="fef10f19:1">')).toBe(true);
  });
});
