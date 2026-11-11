import { readFileSync, readdirSync } from "node:fs";
import { join, resolve } from "node:path";
import { describe, it, expect } from "vitest";

const THEME_DIR = resolve(process.cwd(), ".vitepress/theme");
const TOOLING_ATTRIBUTE = /data-om-id\s*=/;

function listFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    return entry.isDirectory() ? listFiles(path) : [path];
  });
}

describe("theme source", () => {
  it("contains no data-om-id editing-tool attributes", () => {
    const offenders = listFiles(THEME_DIR).filter((path) =>
      TOOLING_ATTRIBUTE.test(readFileSync(path, "utf8")),
    );

    expect(offenders).toEqual([]);
  });

  it("detects the attribute when present", () => {
    expect(TOOLING_ATTRIBUTE.test('<p data-om-id="fef10f19:1">')).toBe(true);
  });
});
