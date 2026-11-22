import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

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
  isPublished,
  loadPublishedPosts,
  loadUnpublishedPostSlugs,
  hasUsableDate,
} from "../../theme/utils/loadPublishedPosts";
import { mockPostFiles } from "../helpers/mockPostFiles";

const mockReaddirSync = vi.mocked(readdirSync);
const mockReadFileSync = vi.mocked(readFileSync);
const mockParseFrontmatter = vi.mocked(parseFrontmatter);

function slugs(posts: { slug: string }[]): string[] {
  return posts.map((post) => post.slug);
}

// Far enough out that the real build time can never pass it.
const FAR_FUTURE_DATE = "2999-01-01T00:00:00.000-08:00";

beforeEach(() => {
  vi.resetAllMocks();
  mockReadFileSync.mockReturnValue("" as any);
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("isPublished", () => {
  const now = new Date("2026-11-22T12:00:00Z");

  it("publishes a non-draft post dated in the past", () => {
    expect(
      isPublished(
        { draft: false, date: "2026-11-01T09:00:00-08:00" },
        "p",
        now,
      ),
    ).toBe(true);
  });

  it("holds back a non-draft post dated in the future", () => {
    expect(
      isPublished(
        { draft: false, date: "2026-11-23T09:00:00-08:00" },
        "p",
        now,
      ),
    ).toBe(false);
  });

  it("publishes a date-only post exactly at midnight Pacific, not before", () => {
    const post = { draft: false, date: "2026-12-01" };
    expect(isPublished(post, "p", new Date("2026-12-01T07:59:59.999Z"))).toBe(
      false,
    );
    expect(isPublished(post, "p", new Date("2026-12-01T08:00:00.000Z"))).toBe(
      true,
    );
  });

  it("compares a non-Pacific offset as its absolute instant", () => {
    // 09:00 in Tokyo is midnight UTC, eight hours before Pacific midnight.
    const post = { draft: false, date: "2026-12-01T09:00:00+09:00" };
    expect(isPublished(post, "p", new Date("2026-11-30T23:59:59Z"))).toBe(
      false,
    );
    expect(isPublished(post, "p", new Date("2026-12-01T00:00:00Z"))).toBe(true);
  });

  it("keeps a draft unpublished even when its date has passed", () => {
    expect(
      isPublished({ draft: true, date: "2020-01-01T00:00:00Z" }, "p", now),
    ).toBe(false);
  });

  it("publishes a post with no date, as it did before scheduling existed", () => {
    expect(isPublished({ draft: false }, "p", now)).toBe(true);
  });

  it("publishes a post with an unparseable date, as it did before scheduling existed", () => {
    expect(isPublished({ draft: false, date: "not-a-date" }, "p", now)).toBe(
      true,
    );
  });

  it("publishes a future post when no cutoff applies (non-production)", () => {
    expect(
      isPublished({ draft: false, date: FAR_FUTURE_DATE }, "p", null),
    ).toBe(true);
  });

  it("holds back a future post by default only on a production build", () => {
    const post = { draft: false, date: FAR_FUTURE_DATE };
    vi.stubEnv("CONTEXT", "deploy-preview");
    expect(isPublished(post, "p")).toBe(true);
    vi.stubEnv("CONTEXT", "production");
    expect(isPublished(post, "p")).toBe(false);
  });
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

  it("drops a scheduled post on a production build", () => {
    vi.stubEnv("CONTEXT", "production");
    mockPostFiles(
      ["scheduled.md", "published.md"],
      [
        { title: "Scheduled", date: FAR_FUTURE_DATE, draft: false },
        { title: "Published", date: "2024-01-01", draft: false },
      ],
    );

    expect(slugs(loadPublishedPosts())).toEqual(["published"]);
  });

  it("keeps a scheduled post outside production", () => {
    vi.stubEnv("CONTEXT", "deploy-preview");
    mockPostFiles(
      ["scheduled.md", "published.md"],
      [
        { title: "Scheduled", date: FAR_FUTURE_DATE, draft: false },
        { title: "Published", date: "2024-01-01", draft: false },
      ],
    );

    expect(slugs(loadPublishedPosts())).toEqual(["scheduled", "published"]);
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

describe("loadUnpublishedPostSlugs", () => {
  it("lists drafts and, on a production build, scheduled posts", () => {
    vi.stubEnv("CONTEXT", "production");
    mockPostFiles(
      ["index.md", "draft.md", "scheduled.md", "published.md"],
      [
        { title: "Draft", date: "2024-06-01", draft: true },
        { title: "Scheduled", date: FAR_FUTURE_DATE, draft: false },
        { title: "Published", date: "2024-01-01", draft: false },
      ],
    );

    expect(loadUnpublishedPostSlugs()).toEqual(["draft", "scheduled"]);
  });

  it("lists only drafts outside production", () => {
    vi.stubEnv("CONTEXT", "deploy-preview");
    mockPostFiles(
      ["draft.md", "scheduled.md"],
      [
        { title: "Draft", date: "2024-06-01", draft: true },
        { title: "Scheduled", date: FAR_FUTURE_DATE, draft: false },
      ],
    );

    expect(loadUnpublishedPostSlugs()).toEqual(["draft"]);
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
