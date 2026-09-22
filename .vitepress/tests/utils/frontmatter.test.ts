import { describe, it, expect } from "vitest";
import {
  coerceFrontmatterString,
  normalizeFrontmatterTopic,
} from "../../theme/utils/frontmatter";

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

describe("normalizeFrontmatterTopic", () => {
  it("passes a trimmed string through unchanged", () => {
    expect(normalizeFrontmatterTopic("development")).toBe("development");
  });

  it("trims leading and trailing whitespace", () => {
    expect(normalizeFrontmatterTopic("  development  ")).toBe("development");
  });

  it("collapses a whitespace-only string to an empty string", () => {
    expect(normalizeFrontmatterTopic("   ")).toBe("");
  });

  it("returns an empty string for undefined", () => {
    expect(normalizeFrontmatterTopic(undefined)).toBe("");
  });

  it("returns an empty string for a bare null", () => {
    expect(normalizeFrontmatterTopic(null)).toBe("");
  });

  // Unlike coerceFrontmatterString, a non-string topic (almost always a
  // frontmatter typo) is dropped rather than coerced into a laundered label.
  it("drops a non-string topic instead of coercing it", () => {
    expect(normalizeFrontmatterTopic(2025)).toBe("");
  });
});
