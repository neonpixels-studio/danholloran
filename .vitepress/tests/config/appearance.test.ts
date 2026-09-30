import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, it, expect } from "vitest";
import { resolveSiteData } from "vitepress";
import { STORAGE_KEY } from "../../theme/composables/useAppearance";

const CONFIG_PATH = resolve(process.cwd(), ".vitepress/config.ts");
const DEFINE_CONFIG_CALL = "defineConfig(";
const APPEARANCE_KEY_RE = /^\s*appearance\s*:/gm;
// Matches only a top-level `appearance: true,` property (2-space indent, per
// this repo's prettier config). The indent alone already rejects a commented-
// out `// appearance: true,` line, since `//` sits where `appearance:` must
// start; slicing the source to start at defineConfig(...) below additionally
// rejects a same-named key on some unrelated object above it in the file.
const TOP_LEVEL_APPEARANCE_TRUE_RE = /^ {2}appearance:\s*true,?\s*$/m;

// Not imported directly: config.ts asserts committed post-build image
// variants are current as a module-load side effect (see
// assertImageVariantsUpToDate() in config.ts), which would couple this
// dark-mode test to unrelated image freshness. Reading it as text, like
// tests/config/headers.test.ts does for public/_headers, avoids that.
function readSourceFromDefineConfig(): string {
  const source = readFileSync(CONFIG_PATH, "utf8");
  const callIndex = source.indexOf(DEFINE_CONFIG_CALL);
  if (callIndex === -1) {
    throw new Error(`${DEFINE_CONFIG_CALL} not found in ${CONFIG_PATH}`);
  }
  return source.slice(callIndex);
}

describe("VitePress appearance config", () => {
  // Regression test for #399 (flash of incorrect theme on load/navigation).
  it("explicitly enables VitePress's blocking dark-mode script", () => {
    const configSource = readSourceFromDefineConfig();

    expect(configSource).toMatch(TOP_LEVEL_APPEARANCE_TRUE_RE);
    // Guards against a later duplicate `appearance:` key overriding this one
    // (object literals keep only the last occurrence) while still matching
    // the regex above against the first.
    expect(configSource.match(APPEARANCE_KEY_RE)).toHaveLength(1);
  });

  // Behavioral half of the same contract: asks VitePress's own public
  // resolveSiteData() what `appearance: true` actually generates, then
  // asserts the emitted `#check-dark-mode` <head> script reads STORAGE_KEY.
  // If a VitePress upgrade ever renames its internal appearance key, this
  // fails instead of silently reintroducing the flash.
  it("generates a pre-paint script keyed on useAppearance's STORAGE_KEY", async () => {
    const siteData = await resolveSiteData("/virtual-root", {
      appearance: true,
      head: [],
    });
    const darkModeScript = siteData.head.find(
      ([tag, attrs]) => tag === "script" && attrs?.id === "check-dark-mode",
    );

    // Asserted separately from the STORAGE_KEY check below: if VitePress ever
    // stops emitting this script, failing here says so directly instead of
    // reporting a confusing "undefined does not contain STORAGE_KEY".
    expect(darkModeScript).toBeDefined();
    expect(darkModeScript?.[2]).toContain(STORAGE_KEY);
  });
});
