import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, it, expect } from "vitest";

const CONFIG_PATH = resolve(process.cwd(), ".vitepress/config.ts");

function readConfigSource(): string {
  return readFileSync(CONFIG_PATH, "utf8");
}

describe("VitePress appearance config", () => {
  // Regression test for #399 (flash of incorrect theme on load/navigation).
  // `appearance: true` is what makes VitePress inject a synchronous, blocking
  // `#check-dark-mode` <script> into <head> — ahead of every stylesheet and
  // app script — that sets the `dark` class before first paint using the
  // same localStorage key useAppearance.ts's STORAGE_KEY is pinned to. This
  // is a source scan rather than a resolved-config check because VitePress
  // only exposes `appearance` via its internal `resolveSiteData`, not as a
  // value importable from config.ts.
  it("explicitly enables VitePress's blocking dark-mode script", () => {
    expect(readConfigSource()).toMatch(/appearance:\s*true/);
  });
});
