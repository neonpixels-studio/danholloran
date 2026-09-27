import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, it, expect } from "vitest";

const CONFIG_PATH = resolve(process.cwd(), ".vitepress/config.ts");
// Matches only a top-level `appearance: true,` property of the
// defineConfig({...}) object (2-space indent, per this repo's prettier
// config) so a comment or a nested object's same-named key can't fake a pass.
const TOP_LEVEL_APPEARANCE_TRUE_RE = /^ {2}appearance:\s*true,?\s*$/m;

function stripComments(source: string): string {
  return source.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "");
}

function readConfigSource(): string {
  return stripComments(readFileSync(CONFIG_PATH, "utf8"));
}

describe("VitePress appearance config", () => {
  // Regression test for #399 (flash of incorrect theme on load/navigation).
  // Full rationale next to STORAGE_KEY in useAppearance.ts; the behavioral
  // half of this contract (that `appearance: true` actually makes VitePress
  // emit a script keyed on STORAGE_KEY) is covered there via
  // resolveSiteData(). This test only pins that *this repo's config* opts in.
  it("explicitly enables VitePress's blocking dark-mode script", () => {
    expect(readConfigSource()).toMatch(TOP_LEVEL_APPEARANCE_TRUE_RE);
  });
});
