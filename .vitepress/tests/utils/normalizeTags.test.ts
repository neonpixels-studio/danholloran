import { describe, it, expect } from "vitest";
import { normalizeTags } from "../../theme/utils/normalizeTags";

describe("normalizeTags", () => {
  it("passes an array through unchanged", () => {
    const tags = ["javascript", "travel"];
    expect(normalizeTags(tags)).toBe(tags);
  });

  it("returns an empty array for an empty array", () => {
    expect(normalizeTags([])).toEqual([]);
  });

  it("returns an empty array for undefined", () => {
    expect(normalizeTags(undefined)).toEqual([]);
  });

  it("returns an empty array for null", () => {
    expect(normalizeTags(null)).toEqual([]);
  });

  it("returns an empty array for a scalar string", () => {
    expect(normalizeTags("javascript")).toEqual([]);
  });

  it("returns an empty array for a number", () => {
    expect(normalizeTags(2025)).toEqual([]);
  });

  it("returns an empty array for an object", () => {
    expect(normalizeTags({ tag: "javascript" })).toEqual([]);
  });

  it("preserves non-string elements (shape only, not element types)", () => {
    // A numeric YAML tag survives; callers that need string-only tags filter
    // themselves. This pins that normalizeTags is a container-shape guard, not
    // an element sanitizer.
    expect(normalizeTags(["javascript", 3, null])).toEqual([
      "javascript",
      3,
      null,
    ]);
  });
});
