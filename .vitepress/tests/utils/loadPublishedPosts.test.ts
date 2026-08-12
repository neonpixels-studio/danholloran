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
import {
  loadPublishedPosts,
  hasUsableDate,
} from "../../theme/utils/loadPublishedPosts";
import { mockPostFiles } from "../helpers/mockPostFiles";

const mockReaddirSync = vi.mocked(readdirSync);
const mockReadFileSync = vi.mocked(readFileSync);
const mockParseFrontmatter = vi.mocked(parseFrontmatter);

function slugs(posts: { slug: string }[]): string[] {
  return posts.map((post) => post.slug);
}

beforeEach(() => {
  vi.resetAllMocks();
  mockReadFileSync.mockReturnValue("" as any);
});

describe("loadPublishedPosts", () => {
  it("returns an empty array when there are no posts", () => {
    mockReaddirSync.mockReturnValue([] as any);
    expect(loadPublishedPosts()).toEqual([]);
  });

  it("excludes index.md and non-markdown files", () => {
    mockReaddirSync.mockReturnValue([
      "index.md",
      "real-post.md",
      "notes.txt",
    ] as any);
    mockParseFrontmatter.mockReturnValueOnce({
      data: { title: "Real", date: "2024-01-01" },
      content: "",
    });

    const posts = loadPublishedPosts();

    expect(slugs(posts)).toEqual(["real-post"]);
    expect(mockParseFrontmatter).toHaveBeenCalledTimes(1);
    expect(mockReadFileSync).toHaveBeenCalledWith(
      expect.stringContaining("real-post.md"),
      "utf-8",
    );
  });

  it("attaches the slug and raw body to each post", () => {
    mockReaddirSync.mockReturnValue(["hello.md"] as any);
    mockParseFrontmatter.mockReturnValueOnce({
      data: { title: "Hello", date: "2024-01-01" },
      content: "# Body",
    });

    const [post] = loadPublishedPosts();

    expect(post.slug).toBe("hello");
    expect(post.body).toBe("# Body");
    expect(post.title).toBe("Hello");
  });

  it("filters out draft posts", () => {
    mockPostFiles(
      ["draft.md", "published.md"],
      [
        { title: "Draft", date: "2024-06-01", draft: true },
        { title: "Published", date: "2024-01-01", draft: false },
      ],
    );

    expect(slugs(loadPublishedPosts())).toEqual(["published"]);
  });

  it("sorts posts newest first", () => {
    mockPostFiles(
      ["oldest.md", "newest.md", "middle.md"],
      [
        { title: "Oldest", date: "2023-01-01" },
        { title: "Newest", date: "2024-06-01" },
        { title: "Middle", date: "2024-01-01" },
      ],
    );

    expect(slugs(loadPublishedPosts())).toEqual(["newest", "middle", "oldest"]);
  });

  it("preserves input order for posts with identical dates (stable sort)", () => {
    mockPostFiles(
      ["first.md", "second.md"],
      [
        { title: "First", date: "2024-01-01" },
        { title: "Second", date: "2024-01-01" },
      ],
    );

    expect(slugs(loadPublishedPosts())).toEqual(["first", "second"]);
  });

  it("keeps undated posts and sorts them to the end without warning", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    mockPostFiles(
      ["undated.md", "dated.md"],
      [{ title: "Undated" }, { title: "Dated", date: "2024-01-01" }],
    );

    expect(slugs(loadPublishedPosts())).toEqual(["dated", "undated"]);
    expect(warnSpy).not.toHaveBeenCalled();

    warnSpy.mockRestore();
  });

  it("keeps posts with an unparseable date, sorts them to the end, and warns loudly", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    mockPostFiles(
      ["bad-date.md", "dated.md"],
      [
        { title: "Bad Date", date: "not-a-real-date" },
        { title: "Dated", date: "2024-01-01" },
      ],
    );

    expect(slugs(loadPublishedPosts())).toEqual(["dated", "bad-date"]);
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining("bad-date"));

    warnSpy.mockRestore();
  });

  it("does not warn about a draft post's malformed date", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    mockPostFiles(
      ["draft-bad.md"],
      [{ title: "Draft Bad", date: "not-a-real-date", draft: true }],
    );

    loadPublishedPosts();

    expect(warnSpy).not.toHaveBeenCalled();

    warnSpy.mockRestore();
  });
});

describe("hasUsableDate", () => {
  it("is true for a post with a parseable date", () => {
    mockPostFiles(["dated.md"], [{ title: "Dated", date: "2024-01-01" }]);
    const [post] = loadPublishedPosts();
    expect(hasUsableDate(post)).toBe(true);
  });

  it("is false for an undated post", () => {
    mockPostFiles(["undated.md"], [{ title: "Undated" }]);
    const [post] = loadPublishedPosts();
    expect(hasUsableDate(post)).toBe(false);
  });

  it("is false for a post with an unparseable date", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    mockPostFiles(["bad.md"], [{ title: "Bad", date: "not-a-real-date" }]);
    const [post] = loadPublishedPosts();
    expect(hasUsableDate(post)).toBe(false);
    warnSpy.mockRestore();
  });
});
