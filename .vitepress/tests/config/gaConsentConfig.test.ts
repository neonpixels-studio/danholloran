import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, it, expect } from "vitest";

const CONFIG_PATH = resolve(process.cwd(), ".vitepress/config.ts");

// GA must only ever be added by the consent composable. A static head entry
// would load it for every reader before any choice is made. Read as text
// because importing config.ts runs the whole site build setup.
describe("vitepress head config", () => {
  it("does not inline Google Analytics into every page", () => {
    const source = readFileSync(CONFIG_PATH, "utf8");

    expect(source).not.toContain("googletagmanager.com");
    expect(source).not.toContain("gtag(");
  });
});
