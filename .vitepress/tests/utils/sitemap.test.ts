import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("fs", () => {
  const existsSync = vi.fn();
  const readFileSync = vi.fn();
  const statSync = vi.fn();
  const readdirSync = vi.fn();
  return {
    default: { existsSync, readFileSync, statSync, readdirSync },
    existsSync,
    readFileSync,
    statSync,
    readdirSync,
  };
});

vi.mock("../../theme/utils/frontmatter", () => ({
  parseFrontmatter: vi.fn(),
}));

import { existsSync, readFileSync, statSync, readdirSync } from "fs";
import { transformSitemapItems } from "../../theme/utils/sitemap";
import { mockPostFiles } from "../helpers/mockPostFiles";

const mockExistsSync = vi.mocked(existsSync);
const mockReadFileSync = vi.mocked(readFileSync);
const mockStatSync = vi.mocked(statSync);
const mockReaddirSync = vi.mocked(readdirSync);

// The post-source directory holds the real files that back `/posts/<slug>`,
// so a path-aware existsSync/statSync pins which file supplies an mtime.
const POSTS_CONTENT_DIR = ".vitepress/content/posts";

function contentPath(slug: string): string {
  return `${POSTS_CONTENT_DIR}/${slug}.md`;
}

beforeEach(() => {
  vi.resetAllMocks();
  mockReaddirSync.mockReturnValue([] as any);
  mockReadFileSync.mockReturnValue("" as any);
});

describe("transformSitemapItems", () => {
  it("filters out the README item", () => {
    const result = transformSitemapItems([{ url: "README" }, { url: "about" }]);
    expect(result.some((i) => i.url === "README")).toBe(false);
    expect(result).toHaveLength(1);
  });

  it("uses frontmatter date as lastmod for post URLs", () => {
    const postDate = "2024-03-15";
    mockPostFiles(["my-post.md"], [{ date: postDate }]);

    const result = transformSitemapItems([{ url: "posts/my-post" }]);
    expect(result[0].lastmod).toEqual(new Date(postDate));
  });

  it("falls through to the source file mtime when a post has no date", () => {
    const mtime = new Date("2024-05-01");
    mockPostFiles(["my-post.md"], [{}]);
    mockExistsSync.mockImplementation((path: any) =>
      String(path).endsWith(contentPath("my-post")),
    );
    mockStatSync.mockReturnValue({ mtime } as any);

    const result = transformSitemapItems([{ url: "posts/my-post" }]);
    expect(result[0].lastmod).toEqual(mtime);
  });

  it("falls through to the source file mtime for a draft post rather than its frontmatter date", () => {
    const mtime = new Date("2024-05-01");
    mockPostFiles(["draft-post.md"], [{ date: "2024-03-15", draft: true }]);
    mockExistsSync.mockImplementation((path: any) =>
      String(path).endsWith(contentPath("draft-post")),
    );
    mockStatSync.mockReturnValue({ mtime } as any);

    const result = transformSitemapItems([{ url: "posts/draft-post" }]);
    expect(result[0].lastmod).toEqual(mtime);
  });

  it("warns and falls through to the source file mtime for an unparseable post date instead of throwing", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const mtime = new Date("2024-05-01");
    mockPostFiles(["bad-date.md"], [{ date: "not-a-real-date" }]);
    mockExistsSync.mockImplementation((path: any) =>
      String(path).endsWith(contentPath("bad-date")),
    );
    mockStatSync.mockReturnValue({ mtime } as any);

    let result: ReturnType<typeof transformSitemapItems> | undefined;
    expect(() => {
      result = transformSitemapItems([{ url: "posts/bad-date" }]);
    }).not.toThrow();
    expect(result![0].lastmod).toEqual(mtime);
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining("bad-date"));

    warnSpy.mockRestore();
  });

  it("uses file mtime for non-post URLs", () => {
    const mtime = new Date("2024-02-20");
    mockExistsSync.mockReturnValue(true);
    mockStatSync.mockReturnValue({ mtime } as any);

    const result = transformSitemapItems([{ url: "about" }]);
    expect(result[0].lastmod).toEqual(mtime);
  });

  it("falls back to a current date when no file is found", () => {
    mockExistsSync.mockReturnValue(false);

    const before = new Date();
    const result = transformSitemapItems([{ url: "mystery-page" }]);
    const after = new Date();

    expect(result[0].lastmod).toBeInstanceOf(Date);
    expect((result[0].lastmod as Date).getTime()).toBeGreaterThanOrEqual(
      before.getTime(),
    );
    expect((result[0].lastmod as Date).getTime()).toBeLessThanOrEqual(
      after.getTime(),
    );
  });

  it("handles trailing slashes by stripping them from the output URL", () => {
    const mtime = new Date("2024-01-01");
    mockExistsSync.mockReturnValue(true);
    mockStatSync.mockReturnValue({ mtime } as any);

    const result = transformSitemapItems([{ url: "about/" }]);
    expect(result[0].url).toBe("about");
    expect(result[0].lastmod).toEqual(mtime);
  });

  it("keeps the trailing slash for directory-index routes (posts/index.md)", () => {
    const mtime = new Date("2024-01-01");
    mockExistsSync.mockImplementation(
      (path: any) => typeof path === "string" && path.endsWith("index.md"),
    );
    mockStatSync.mockReturnValue({ mtime } as any);

    const result = transformSitemapItems([{ url: "posts/" }]);
    expect(result[0].url).toBe("posts/");
    expect(result[0].lastmod).toEqual(mtime);
  });

  it("handles root URL (empty string after strip)", () => {
    const mtime = new Date("2024-01-01");
    mockExistsSync.mockReturnValue(true);
    mockStatSync.mockReturnValue({ mtime } as any);

    const result = transformSitemapItems([{ url: "" }]);
    expect(result[0].lastmod).toEqual(mtime);
  });
});
