import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

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

vi.mock("child_process", () => {
  const execFileSync = vi.fn();
  return { default: { execFileSync }, execFileSync };
});

import { existsSync, readFileSync, statSync, readdirSync } from "fs";
import { execFileSync } from "child_process";
import { transformSitemapItems } from "../../theme/utils/sitemap";
import { resetGitDatesUsableCache } from "../../theme/utils/gitLastModified";
import { mockPostFiles } from "../helpers/mockPostFiles";

const mockExistsSync = vi.mocked(existsSync);
const mockReadFileSync = vi.mocked(readFileSync);
const mockStatSync = vi.mocked(statSync);
const mockReaddirSync = vi.mocked(readdirSync);
const mockExecFileSync = vi.mocked(execFileSync);

// The post-source directory holds the real files that back `/posts/<slug>`,
// so a path-aware existsSync/statSync pins which file supplies an mtime.
const POSTS_CONTENT_DIR = ".vitepress/content/posts";

function contentPath(slug: string): string {
  return `${POSTS_CONTENT_DIR}/${slug}.md`;
}

beforeEach(() => {
  vi.resetAllMocks();
  resetGitDatesUsableCache();
  mockReaddirSync.mockReturnValue([] as any);
  mockReadFileSync.mockReturnValue("" as any);
  // Default to "untracked" so file-backed pages fall through to their mtime;
  // git-date tests override this per case.
  mockExecFileSync.mockReturnValue("" as any);
});

afterEach(() => {
  vi.restoreAllMocks();
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

  it("omits lastmod instead of stamping build time when no file is found", () => {
    mockExistsSync.mockReturnValue(false);

    const result = transformSitemapItems([
      { url: "mystery-page", lastmod: new Date("2020-01-01").getTime() },
    ]);

    expect(result[0].url).toBe("mystery-page");
    expect(result[0]).not.toHaveProperty("lastmod");
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

  it("stamps the homepage with the newest post date when it is newer than the source date", () => {
    const newest = "2026-09-25";
    const staleMtime = new Date("2026-05-14");
    mockPostFiles(["newer.md"], [{ date: newest }]);
    mockExistsSync.mockImplementation(
      (path: any) => typeof path === "string" && path.endsWith("index.md"),
    );
    mockStatSync.mockReturnValue({ mtime: staleMtime } as any);

    const result = transformSitemapItems([{ url: "" }]);
    expect(result[0].url).toBe("");
    expect(result[0].lastmod).toEqual(new Date(newest));
  });

  it("stamps the /posts/ index with the newest post date when it is newer than the source date", () => {
    const newest = "2026-09-25";
    const staleMtime = new Date("2026-05-14");
    mockPostFiles(["newer.md"], [{ date: newest }]);
    mockExistsSync.mockImplementation(
      (path: any) => typeof path === "string" && path.endsWith("index.md"),
    );
    mockStatSync.mockReturnValue({ mtime: staleMtime } as any);

    const result = transformSitemapItems([{ url: "posts/" }]);
    expect(result[0].url).toBe("posts/");
    expect(result[0].lastmod).toEqual(new Date(newest));
  });

  it("keeps the listing page source date when it is newer than the newest post", () => {
    const freshMtime = new Date("2026-10-01");
    mockPostFiles(["older.md"], [{ date: "2026-05-14" }]);
    mockExistsSync.mockImplementation(
      (path: any) => typeof path === "string" && path.endsWith("index.md"),
    );
    mockStatSync.mockReturnValue({ mtime: freshMtime } as any);

    const result = transformSitemapItems([{ url: "" }]);
    expect(result[0].lastmod).toEqual(freshMtime);
  });

  it("stamps the indexable topic hub with the newest published post date", () => {
    const newest = "2024-06-01";
    mockPostFiles(
      ["newer.md", "older.md"],
      [{ date: newest }, { date: "2020-01-01" }],
    );

    const result = transformSitemapItems([{ url: "posts/topic/travel" }]);
    expect(result).toHaveLength(1);
    expect(result[0].lastmod).toEqual(new Date(newest));
  });

  it("excludes noindexed archive URLs (pagination, tag pages) from the sitemap", () => {
    mockPostFiles(["newer.md"], [{ date: "2024-06-01" }]);

    const result = transformSitemapItems([
      { url: "posts/page/2" },
      { url: "posts/tag/javascript" },
      { url: "posts/tag/javascript/page/2" },
      { url: "posts/topic/travel/page/2" },
      { url: "posts/topic/travel" },
      { url: "posts/my-post" },
    ]);
    const urls = result.map((item) => item.url);
    expect(urls).toEqual(["posts/topic/travel", "posts/my-post"]);
  });

  it("prefers the git commit date over mtime for a tracked static page", () => {
    const commitDate = "2025-02-10T08:30:00.000Z";
    mockExistsSync.mockReturnValue(true);
    mockStatSync.mockReturnValue({ mtime: new Date("2024-01-01") } as any);
    mockExecFileSync.mockReturnValue(`${commitDate}\n` as any);

    const result = transformSitemapItems([{ url: "about" }]);
    expect(result[0].lastmod).toEqual(new Date(commitDate));
  });

  describe("shallow clone", () => {
    function mockShallowGit() {
      mockExecFileSync.mockImplementation(((_cmd: string, args: string[]) =>
        args[0] === "rev-parse"
          ? "true\n"
          : "2025-02-10T08:30:00.000Z\n") as any);
    }

    let warnSpy: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
      warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
      mockExistsSync.mockReturnValue(true);
      mockStatSync.mockReturnValue({ mtime: new Date("2024-01-01") } as any);
      mockShallowGit();
    });

    it("omits lastmod instead of using mtime (checkout time) for a source file", () => {
      const result = transformSitemapItems([{ url: "about" }]);
      expect(result[0].url).toBe("about");
      expect(result[0]).not.toHaveProperty("lastmod");
      expect(mockStatSync).not.toHaveBeenCalled();
      expect(warnSpy).toHaveBeenCalledOnce();
    });

    it("drops a lastmod already present on the incoming item", () => {
      const result = transformSitemapItems([
        { url: "about", lastmod: new Date("2020-01-01").getTime() },
      ]);
      expect(result[0]).not.toHaveProperty("lastmod");
    });

    it("omits lastmod for a directory-index route and keeps its trailing slash", () => {
      mockExistsSync.mockImplementation(
        (path: any) => !String(path).endsWith("about.md"),
      );

      const result = transformSitemapItems([{ url: "about" }]);
      expect(result[0].url).toBe("about/");
      expect(result[0]).not.toHaveProperty("lastmod");
    });

    it("omits lastmod for a post-listing page when no post has a usable date", () => {
      mockPostFiles([], []);

      const result = transformSitemapItems([{ url: "" }]);
      expect(result[0]).not.toHaveProperty("lastmod");
    });

    it("still stamps a post-listing page with the newest post date", () => {
      const newest = "2026-09-25";
      mockPostFiles(["newer.md"], [{ date: newest }]);

      const result = transformSitemapItems([{ url: "" }]);
      expect(result[0].lastmod).toEqual(new Date(newest));
    });
  });

  it("still uses mtime for an untracked file when git history is complete", () => {
    const mtime = new Date("2024-01-01");
    mockExistsSync.mockReturnValue(true);
    mockStatSync.mockReturnValue({ mtime } as any);
    mockExecFileSync.mockImplementation(((_cmd: string, args: string[]) =>
      args[0] === "rev-parse" ? "false\n" : "") as any);

    const result = transformSitemapItems([{ url: "about" }]);
    expect(result[0].lastmod).toEqual(mtime);
  });

  it("does not treat a post slug prefixed page-/tag- as an archive route", () => {
    const postDate = "2024-03-15";
    mockPostFiles(["page-load-times.md"], [{ date: postDate }]);

    const result = transformSitemapItems([{ url: "posts/page-load-times" }]);
    // Matched as a real post (its frontmatter date), not the archive branch.
    expect(result[0].lastmod).toEqual(new Date(postDate));
  });

  it("omits lastmod for an archive route when nothing is dated", () => {
    // No post carries a usable date (archiveLastmod is null) and no backing file
    // exists, so the route has no trustworthy date and must not get build time.
    mockPostFiles(["undated.md"], [{ title: "Undated" }]);
    mockExistsSync.mockReturnValue(false);

    const result = transformSitemapItems([{ url: "posts/topic/travel" }]);
    expect(result[0].url).toBe("posts/topic/travel");
    expect(result[0]).not.toHaveProperty("lastmod");
  });

  it("uses the git date for an undated post instead of mtime", () => {
    const commitDate = "2025-02-10T08:30:00.000Z";
    mockPostFiles(["my-post.md"], [{}]);
    mockExistsSync.mockImplementation((path: any) =>
      String(path).endsWith(contentPath("my-post")),
    );
    mockStatSync.mockReturnValue({ mtime: new Date("2024-05-01") } as any);
    mockExecFileSync.mockImplementation(((_cmd: string, args: string[]) =>
      args[0] === "rev-parse" ? "false\n" : `${commitDate}\n`) as any);

    const result = transformSitemapItems([{ url: "posts/my-post" }]);
    expect(result[0].lastmod).toEqual(new Date(commitDate));
    expect(mockExecFileSync).toHaveBeenCalledWith(
      "git",
      [
        "log",
        "-1",
        "--format=%cI",
        "--",
        expect.stringContaining(contentPath("my-post")),
      ],
      expect.anything(),
    );
  });

  it("omits lastmod for an undated post on a shallow clone instead of using checkout-time mtime", () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    mockPostFiles(["my-post.md"], [{}]);
    mockExistsSync.mockImplementation((path: any) =>
      String(path).endsWith(contentPath("my-post")),
    );
    mockStatSync.mockReturnValue({ mtime: new Date("2024-05-01") } as any);
    mockExecFileSync.mockImplementation(((_cmd: string, args: string[]) =>
      args[0] === "rev-parse"
        ? "true\n"
        : "2025-02-10T08:30:00.000Z\n") as any);

    const result = transformSitemapItems([
      { url: "posts/my-post", lastmod: new Date("2020-01-01").getTime() },
    ]);
    expect(result[0].url).toBe("posts/my-post");
    expect(result[0]).not.toHaveProperty("lastmod");
  });

  it("falls back to mtime for an untracked undated post when git history is complete", () => {
    const mtime = new Date("2024-05-01");
    mockPostFiles(["my-post.md"], [{}]);
    mockExistsSync.mockImplementation((path: any) =>
      String(path).endsWith(contentPath("my-post")),
    );
    mockStatSync.mockReturnValue({ mtime } as any);
    mockExecFileSync.mockImplementation(((_cmd: string, args: string[]) =>
      args[0] === "rev-parse" ? "false\n" : "") as any);

    const result = transformSitemapItems([{ url: "posts/my-post" }]);
    expect(result[0].lastmod).toEqual(mtime);
  });
});
