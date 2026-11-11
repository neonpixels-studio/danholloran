import { describe, it, expect } from "vitest";
import {
  TOC_MIN_SECTIONS,
  tocSections,
  type PostHeader,
} from "@utils/postHeaders";

function headers(level: number, count: number): PostHeader[] {
  return Array.from({ length: count }, (_, index) => ({
    level,
    title: `Section ${index}`,
    link: `#section-${index}`,
  }));
}

describe("tocSections", () => {
  it("returns the h2s at the threshold", () => {
    expect(tocSections(headers(2, TOC_MIN_SECTIONS))).toHaveLength(
      TOC_MIN_SECTIONS,
    );
  });

  it("returns nothing below the threshold", () => {
    expect(tocSections(headers(2, TOC_MIN_SECTIONS - 1))).toEqual([]);
  });

  it("ignores h3s when counting and listing", () => {
    const mixed = [...headers(2, TOC_MIN_SECTIONS - 1), ...headers(3, 5)];
    expect(tocSections(mixed)).toEqual([]);
    const enough = [...headers(2, TOC_MIN_SECTIONS), ...headers(3, 2)];
    expect(tocSections(enough).every((header) => header.level === 2)).toBe(
      true,
    );
  });

  it("handles missing headers", () => {
    expect(tocSections()).toEqual([]);
  });
});
