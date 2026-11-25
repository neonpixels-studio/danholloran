import { readFileSync, readdirSync } from "fs";
import { join } from "path";
import { describe, it, expect } from "vitest";
import { findSourceMaps } from "../../theme/utils/sourceMaps";

const DIST_DIRECTORY = join(process.cwd(), ".vitepress/dist");
const ASSETS_DIRECTORY = join(DIST_DIRECTORY, "assets");

// Runs after `npm run build` (see `npm run test:dist`).
describe("built site source maps", () => {
  it("leaves no .map file in the published output", () => {
    expect(findSourceMaps(DIST_DIRECTORY)).toEqual([]);
  });

  it("references no source map from any script", () => {
    const scripts = readdirSync(ASSETS_DIRECTORY, { recursive: true })
      .filter((file): file is string => typeof file === "string")
      .filter((file) => file.endsWith(".js"));
    expect(scripts.some((file) => file.includes("chunks"))).toBe(true);
    scripts.forEach((script) => {
      const contents = readFileSync(join(ASSETS_DIRECTORY, script), "utf8");
      expect(contents).not.toContain("sourceMappingURL=");
    });
  });
});
