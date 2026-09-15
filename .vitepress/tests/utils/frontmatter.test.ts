import { describe, it, expect } from "vitest";
import { coerceFrontmatterString } from "../../theme/utils/frontmatter";

describe("coerceFrontmatterString", () => {
  it("passes a string through unchanged", () => {
    expect(coerceFrontmatterString("Example Post")).toBe("Example Post");
  });

  it("stringifies a number", () => {
    expect(coerceFrontmatterString(2025)).toBe("2025");
  });

  it("stringifies a boolean", () => {
    expect(coerceFrontmatterString(true)).toBe("true");
  });

  it("stringifies a Date", () => {
    // yaml parses YAML 1.1 timestamps into real Date objects, not strings.
    const date = new Date("2025-01-01T00:00:00.000Z");
    expect(coerceFrontmatterString(date)).toBe(date.toString());
  });

  it("returns an empty string for undefined", () => {
    expect(coerceFrontmatterString(undefined)).toBe("");
  });

  it("returns an empty string for a bare null", () => {
    expect(coerceFrontmatterString(null)).toBe("");
  });

  it("returns an empty string for a mapping instead of '[object Object]'", () => {
    expect(coerceFrontmatterString({ en: "Example Post" })).toBe("");
  });

  it("returns an empty string for a sequence instead of a joined string", () => {
    expect(coerceFrontmatterString(["a", "b"])).toBe("");
  });
});
