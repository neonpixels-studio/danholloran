import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("fs", () => {
  const readdirSync = vi.fn();
  const readFileSync = vi.fn();
  return { default: { readdirSync, readFileSync }, readdirSync, readFileSync };
});

vi.mock("gray-matter", () => {
  const matter = vi.fn();
  return { default: matter };
});

import { readdirSync, readFileSync } from "fs";
import matter from "gray-matter";
import { getLatestPostImage } from "../../theme/utils/posts";

const mockReaddirSync = vi.mocked(readdirSync);
const mockReadFileSync = vi.mocked(readFileSync);
const mockMatter = vi.mocked(matter);

beforeEach(() => {
  vi.clearAllMocks();
});

describe("getLatestPostImage", () => {
  it("returns undefined when no posts exist", () => {
    mockReaddirSync.mockReturnValue([] as any);
    expect(getLatestPostImage()).toBeUndefined();
  });

  it("returns the image from the most recent non-draft post", () => {
    mockReaddirSync.mockReturnValue(["older.md", "newer.md"] as any);
    mockReadFileSync.mockReturnValue("" as any);
    mockMatter
      .mockReturnValueOnce({
        data: { date: "2024-01-01", image: "/old.png", draft: false },
      } as any)
      .mockReturnValueOnce({
        data: { date: "2024-06-01", image: "/new.png", draft: false },
      } as any);

    expect(getLatestPostImage()).toBe("/new.png");
  });

  it("skips draft posts", () => {
    mockReaddirSync.mockReturnValue(["draft.md", "published.md"] as any);
    mockReadFileSync.mockReturnValue("" as any);
    mockMatter
      .mockReturnValueOnce({
        data: { date: "2024-06-01", image: "/draft.png", draft: true },
      } as any)
      .mockReturnValueOnce({
        data: { date: "2024-01-01", image: "/published.png", draft: false },
      } as any);

    expect(getLatestPostImage()).toBe("/published.png");
  });

  it("skips posts without a date", () => {
    mockReaddirSync.mockReturnValue(["no-date.md", "with-date.md"] as any);
    mockReadFileSync.mockReturnValue("" as any);
    mockMatter
      .mockReturnValueOnce({
        data: { image: "/no-date.png" },
      } as any)
      .mockReturnValueOnce({
        data: { date: "2024-01-01", image: "/with-date.png" },
      } as any);

    expect(getLatestPostImage()).toBe("/with-date.png");
  });

  it("skips posts without an image", () => {
    mockReaddirSync.mockReturnValue(["no-image.md", "with-image.md"] as any);
    mockReadFileSync.mockReturnValue("" as any);
    mockMatter
      .mockReturnValueOnce({
        data: { date: "2024-06-01" },
      } as any)
      .mockReturnValueOnce({
        data: { date: "2024-01-01", image: "/with-image.png" },
      } as any);

    expect(getLatestPostImage()).toBe("/with-image.png");
  });

  it("ignores non-.md files", () => {
    mockReaddirSync.mockReturnValue(["README.txt", "post.md"] as any);
    mockReadFileSync.mockReturnValue("" as any);
    mockMatter.mockReturnValueOnce({
      data: { date: "2024-01-01", image: "/post.png" },
    } as any);

    expect(getLatestPostImage()).toBe("/post.png");
    expect(mockMatter).toHaveBeenCalledTimes(1);
  });
});
