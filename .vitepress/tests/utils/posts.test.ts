import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("fs", () => {
  const readdirSync = vi.fn();
  const readFileSync = vi.fn();
  return { default: { readdirSync, readFileSync }, readdirSync, readFileSync };
});

vi.mock("../../theme/utils/frontmatter", () => ({
  parseFrontmatter: vi.fn(),
}));

import { readdirSync, readFileSync } from "fs";
import { getLatestPostImage } from "../../theme/utils/posts";
import { mockPostFiles } from "../helpers/mockPostFiles";

const mockReaddirSync = vi.mocked(readdirSync);
const mockReadFileSync = vi.mocked(readFileSync);

beforeEach(() => {
  vi.resetAllMocks();
  mockReadFileSync.mockReturnValue("" as any);
});

describe("getLatestPostImage", () => {
  it("returns undefined when no posts exist", () => {
    mockReaddirSync.mockReturnValue([] as any);
    expect(getLatestPostImage()).toBeUndefined();
  });

  it("returns the image from the most recent non-draft post", () => {
    mockPostFiles(
      ["older.md", "newer.md"],
      [
        { date: "2024-01-01", image: "/old.png", draft: false },
        { date: "2024-06-01", image: "/new.png", draft: false },
      ],
    );

    expect(getLatestPostImage()).toBe("/new.png");
  });

  it("skips draft posts", () => {
    mockPostFiles(
      ["draft.md", "published.md"],
      [
        { date: "2024-06-01", image: "/draft.png", draft: true },
        { date: "2024-01-01", image: "/published.png", draft: false },
      ],
    );

    expect(getLatestPostImage()).toBe("/published.png");
  });

  it("skips posts without a date", () => {
    mockPostFiles(
      ["no-date.md", "with-date.md"],
      [
        { image: "/no-date.png" },
        { date: "2024-01-01", image: "/with-date.png" },
      ],
    );

    expect(getLatestPostImage()).toBe("/with-date.png");
  });

  it("skips posts with an unparseable date", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    mockPostFiles(
      ["bad-date.md", "with-date.md"],
      [
        { date: "not-a-real-date", image: "/bad-date.png" },
        { date: "2024-01-01", image: "/with-date.png" },
      ],
    );

    expect(getLatestPostImage()).toBe("/with-date.png");

    warnSpy.mockRestore();
  });

  it("skips posts without an image", () => {
    mockPostFiles(
      ["no-image.md", "with-image.md"],
      [
        { date: "2024-06-01" },
        { date: "2024-01-01", image: "/with-image.png" },
      ],
    );

    expect(getLatestPostImage()).toBe("/with-image.png");
  });

  it("ignores index.md and non-.md files", () => {
    mockPostFiles(
      ["index.md", "README.txt", "post.md"],
      [{ date: "2024-01-01", image: "/post.png" }],
    );

    expect(getLatestPostImage()).toBe("/post.png");
  });
});
