import { describe, it, expect } from "vitest";
import {
  hashString,
  pickDeterministicIndex,
  pickDeterministicImage,
} from "../../theme/utils/deterministicPick";

const images = ["a.jpg", "b.jpg", "c.jpg"];

describe("hashString", () => {
  it("returns the same hash for the same seed", () => {
    expect(hashString("post-42")).toBe(hashString("post-42"));
  });

  it("returns an unsigned 32-bit integer", () => {
    const hash = hashString("https://instagram.com/p/abc123");
    expect(Number.isInteger(hash)).toBe(true);
    expect(hash).toBeGreaterThanOrEqual(0);
    expect(hash).toBeLessThanOrEqual(0xffffffff);
  });

  it("produces different hashes for different seeds", () => {
    expect(hashString("post-1")).not.toBe(hashString("post-2"));
  });

  it("returns the FNV-1a offset basis for an empty seed", () => {
    expect(hashString("")).toBe(0x811c9dc5);
  });

  it("matches the known FNV-1a (UTF-16) vector so the algorithm can't drift", () => {
    // Cross-run stability is the feature; pin a golden value so any change to
    // the hash (which would reshuffle every published tile) fails loudly.
    expect(hashString("post-42")).toBe(0x18684e04);
  });
});

describe("pickDeterministicIndex", () => {
  it("returns the same index for the same seed and length", () => {
    expect(pickDeterministicIndex("post-42", images.length)).toBe(
      pickDeterministicIndex("post-42", images.length),
    );
  });

  it("returns an in-bounds index", () => {
    for (let seed = 0; seed < 50; seed++) {
      const index = pickDeterministicIndex(`seed-${seed}`, images.length);
      expect(index).toBeGreaterThanOrEqual(0);
      expect(index).toBeLessThan(images.length);
    }
  });

  it("distributes across every index over many seeds", () => {
    const seen = new Set<number>();
    for (let seed = 0; seed < 50; seed++) {
      seen.add(pickDeterministicIndex(`seed-${seed}`, images.length));
    }
    expect(seen.size).toBe(images.length);
  });

  it("throws for a non-positive or non-integer length rather than fabricating an index", () => {
    expect(() => pickDeterministicIndex("post-42", 0)).toThrow(RangeError);
    expect(() => pickDeterministicIndex("post-42", -3)).toThrow(RangeError);
    expect(() => pickDeterministicIndex("post-42", NaN)).toThrow(RangeError);
    expect(() => pickDeterministicIndex("post-42", 2.5)).toThrow(RangeError);
  });
});

describe("pickDeterministicImage", () => {
  it("returns the same image for the same seed", () => {
    expect(pickDeterministicImage("post-42", images)).toBe(
      pickDeterministicImage("post-42", images),
    );
  });

  it("returns an image from the provided list", () => {
    expect(images).toContain(pickDeterministicImage("post-42", images));
  });

  it("distributes different seeds across different images", () => {
    const seen = new Set<string | undefined>();
    for (let seed = 0; seed < 50; seed++) {
      seen.add(pickDeterministicImage(`seed-${seed}`, images));
    }
    expect(seen.size).toBe(images.length);
  });

  it("falls back to the first image when the seed is missing", () => {
    expect(pickDeterministicImage(undefined, images)).toBe(images[0]);
    expect(pickDeterministicImage("", images)).toBe(images[0]);
  });

  it("returns undefined for an empty or missing image list", () => {
    expect(pickDeterministicImage("post-42", [])).toBeUndefined();
    expect(pickDeterministicImage("post-42", undefined)).toBeUndefined();
  });
});
