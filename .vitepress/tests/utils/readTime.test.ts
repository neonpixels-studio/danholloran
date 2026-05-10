import { describe, it, expect } from "vitest";
import { calculateReadTime } from "../../utils/readTime";

function makeWords(count: number): string {
  return Array.from({ length: count }, (_, i) => `word${i}`).join(" ");
}

describe("calculateReadTime", () => {
  it("returns 1 for an empty string", () => {
    expect(calculateReadTime("")).toBe(1);
  });

  it("returns 1 for a whitespace-only string", () => {
    expect(calculateReadTime("   \n\t  ")).toBe(1);
  });

  it("returns 1 for a single word", () => {
    expect(calculateReadTime("hello")).toBe(1);
  });

  it("returns 1 for fewer than 100 words", () => {
    expect(calculateReadTime(makeWords(50))).toBe(1);
  });

  it("returns 1 for 199 words", () => {
    expect(calculateReadTime(makeWords(199))).toBe(1);
  });

  it("returns 1 for exactly 200 words", () => {
    expect(calculateReadTime(makeWords(200))).toBe(1);
  });

  it("returns 2 for 300 words", () => {
    expect(calculateReadTime(makeWords(300))).toBe(2);
  });

  it("returns 2 for 400 words", () => {
    expect(calculateReadTime(makeWords(400))).toBe(2);
  });

  it("handles multiple consecutive whitespace types", () => {
    const content = "word1  \t  word2\n\nword3";
    expect(calculateReadTime(content)).toBe(1);
  });

  it("trims leading and trailing whitespace before counting", () => {
    const padded = "  " + makeWords(200) + "  ";
    expect(calculateReadTime(padded)).toBe(1);
  });
});
