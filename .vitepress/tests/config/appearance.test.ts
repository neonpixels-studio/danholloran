import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, it, expect } from "vitest";

const CONFIG_PATH = resolve(process.cwd(), ".vitepress/config.ts");
const DEFINE_CONFIG_CALL = "defineConfig(";
// Matches only a top-level `appearance: true,` property (2-space indent, per
// this repo's prettier config). The indent alone already rejects a commented-
// out `// appearance: true,` line, since `//` sits where `appearance:` must
// start; slicing the source to start at defineConfig(...) below additionally
// rejects a same-named key on some unrelated object above it in the file.
const TOP_LEVEL_APPEARANCE_TRUE_RE = /^ {2}appearance:\s*true,?\s*$/m;

function readDefineConfigBody(): string {
  const source = readFileSync(CONFIG_PATH, "utf8");
  const callIndex = source.indexOf(DEFINE_CONFIG_CALL);
  if (callIndex === -1) {
    throw new Error(`${DEFINE_CONFIG_CALL} not found in ${CONFIG_PATH}`);
  }
  return source.slice(callIndex);
}

describe("VitePress appearance config", () => {
  // Regression test for #399 (flash of incorrect theme on load/navigation).
  // Full rationale next to STORAGE_KEY in useAppearance.ts; the behavioral
  // half of this contract (that `appearance: true` actually makes VitePress
  // emit a script keyed on STORAGE_KEY) is covered there via
  // resolveSiteData(). This test only pins that *this repo's config* opts in.
  it("explicitly enables VitePress's blocking dark-mode script", () => {
    expect(readDefineConfigBody()).toMatch(TOP_LEVEL_APPEARANCE_TRUE_RE);
  });
});
