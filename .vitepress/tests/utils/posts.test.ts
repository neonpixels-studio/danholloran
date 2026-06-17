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
import { parseFrontmatter } from "../../theme/utils/frontmatter";
import { getLatestPostImage } from "../../theme/utils/posts";

const mockReaddirSync = vi.mocked(readdirSync);
const mockReadFileSync = vi.mocked(readFileSync);
const mockParseFrontmatter = vi.mocked(parseFrontmatter);

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
    mockParseFrontmatter
      .mockReturnValueOnce({
        data: { date: "2024-01-01", image: "/old.png", draft: false },
        content: "",
      })
      .mockReturnValueOnce({
        data: { date: "2024-06-01", image: "/new.png", draft: false },
        content: "",
      });

    expect(getLatestPostImage()).toBe("/new.png");
  });

  it("skips draft posts", () => {
    mockReaddirSync.mockReturnValue(["draft.md", "published.md"] as any);
    mockReadFileSync.mockReturnValue("" as any);
    mockParseFrontmatter
      .mockReturnValueOnce({
        data: { date: "2024-06-01", image: "/draft.png", draft: true },
        content: "",
      })
      .mockReturnValueOnce({
        data: { date: "2024-01-01", image: "/published.png", draft: false },
        content: "",
      });

    expect(getLatestPostImage()).toBe("/published.png");
  });

  it("skips posts without a date", () => {
    mockReaddirSync.mockReturnValue(["no-date.md", "with-date.md"] as any);
    mockReadFileSync.mockReturnValue("" as any);
    mockParseFrontmatter
      .mockReturnValueOnce({
        data: { image: "/no-date.png" },
        content: "",
      })
      .mockReturnValueOnce({
        data: { date: "2024-01-01", image: "/with-date.png" },
        content: "",
      });

    expect(getLatestPostImage()).toBe("/with-date.png");
  });

  it("skips posts without an image", () => {
    mockReaddirSync.mockReturnValue(["no-image.md", "with-image.md"] as any);
    mockReadFileSync.mockReturnValue("" as any);
    mockParseFrontmatter
      .mockReturnValueOnce({
        data: { date: "2024-06-01" },
        content: "",
      })
      .mockReturnValueOnce({
        data: { date: "2024-01-01", image: "/with-image.png" },
        content: "",
      });

    expect(getLatestPostImage()).toBe("/with-image.png");
  });

  it("ignores non-.md files", () => {
    mockReaddirSync.mockReturnValue(["README.txt", "post.md"] as any);
    mockReadFileSync.mockReturnValue("" as any);
    mockParseFrontmatter.mockReturnValueOnce({
      data: { date: "2024-01-01", image: "/post.png" },
      content: "",
    });

    expect(getLatestPostImage()).toBe("/post.png");
    expect(mockParseFrontmatter).toHaveBeenCalledTimes(1);
  });
});
