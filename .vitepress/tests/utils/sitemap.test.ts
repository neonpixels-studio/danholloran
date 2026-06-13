import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("fs", () => {
  const existsSync = vi.fn();
  const readFileSync = vi.fn();
  const statSync = vi.fn();
  return {
    default: { existsSync, readFileSync, statSync },
    existsSync,
    readFileSync,
    statSync,
  };
});

vi.mock("gray-matter", () => {
  const matter = vi.fn();
  return { default: matter };
});

import { existsSync, readFileSync, statSync } from "fs";
import matter from "gray-matter";
import { transformSitemapItems } from "../../theme/utils/sitemap";

const mockExistsSync = vi.mocked(existsSync);
const mockReadFileSync = vi.mocked(readFileSync);
const mockStatSync = vi.mocked(statSync);
const mockMatter = vi.mocked(matter);

beforeEach(() => {
  vi.clearAllMocks();
});

describe("transformSitemapItems", () => {
  it("filters out the README item", () => {
    const result = transformSitemapItems([{ url: "README" }, { url: "about" }]);
    expect(result.some((i) => i.url === "README")).toBe(false);
    expect(result).toHaveLength(1);
  });

  it("uses frontmatter date as lastmod for post URLs", () => {
    const postDate = "2024-03-15";
    mockExistsSync.mockReturnValue(true);
    mockReadFileSync.mockReturnValue("" as any);
    mockMatter.mockReturnValue({ data: { date: postDate } } as any);

    const result = transformSitemapItems([{ url: "posts/my-post" }]);
    expect(result[0].lastmod).toEqual(new Date(postDate));
  });

  it("falls through to file mtime when post file has no date", () => {
    const mtime = new Date("2024-05-01");
    mockExistsSync.mockReturnValue(true);
    mockReadFileSync.mockReturnValue("" as any);
    mockMatter.mockReturnValue({ data: {} } as any);
    mockStatSync.mockReturnValue({ mtime } as any);

    const result = transformSitemapItems([{ url: "posts/my-post" }]);
    expect(result[0].lastmod).toEqual(mtime);
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

  it("handles root URL (empty string after strip)", () => {
    const mtime = new Date("2024-01-01");
    mockExistsSync.mockReturnValue(true);
    mockStatSync.mockReturnValue({ mtime } as any);

    const result = transformSitemapItems([{ url: "" }]);
    expect(result[0].lastmod).toEqual(mtime);
  });
});
