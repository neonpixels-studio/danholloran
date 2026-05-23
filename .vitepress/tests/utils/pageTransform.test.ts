import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("fs", () => {
  const existsSync = vi.fn();
  const readFileSync = vi.fn();
  return { default: { existsSync, readFileSync }, existsSync, readFileSync };
});

vi.mock("gray-matter", () => {
  const matter = vi.fn();
  return { default: matter };
});

import { existsSync, readFileSync } from "fs";
import matter from "gray-matter";
import { transformPageData } from "../../theme/utils/pageTransform";
import { SITE_URL } from "../../theme/utils/constants";

const mockExistsSync = vi.mocked(existsSync);
const mockReadFileSync = vi.mocked(readFileSync);
const mockMatter = vi.mocked(matter);

function makePageData(overrides: Record<string, unknown> = {}) {
  return {
    filePath: "",
    title: "",
    description: "",
    frontmatter: {},
    params: undefined,
    ...overrides,
  } as any;
}

function findHead(pageData: any, type: string, attr: string, value: string) {
  return (pageData.frontmatter.head ?? []).find(
    (tag: any[]) =>
      tag[0] === type &&
      Object.entries(tag[1] ?? {}).some(([k, v]) => k === attr && v === value),
  );
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("transformPageData – index.md", () => {
  it("sets title, description, and head tags", () => {
    const pageData = makePageData({ filePath: "index.md" });
    transformPageData(pageData);

    expect(typeof pageData.title).toBe("string");
    expect(pageData.title.length).toBeGreaterThan(0);
    expect(typeof pageData.description).toBe("string");
    expect(pageData.frontmatter.title).toBe(pageData.title);
    expect(pageData.frontmatter.head).toBeDefined();
  });

  it("includes canonical link to /", () => {
    const pageData = makePageData({ filePath: "index.md" });
    transformPageData(pageData);

    expect(findHead(pageData, "link", "href", `${SITE_URL}/`)).toBeDefined();
  });

  it("includes a JSON-LD Person script tag", () => {
    const pageData = makePageData({ filePath: "index.md" });
    transformPageData(pageData);

    const scriptTag = (pageData.frontmatter.head ?? []).find(
      (tag: any[]) =>
        tag[0] === "script" &&
        tag[1]?.type === "application/ld+json" &&
        tag[2]?.includes("Person"),
    );
    expect(scriptTag).toBeDefined();
  });
});

describe("transformPageData – resume.md", () => {
  it("sets title with Resume prefix and head tags", () => {
    const pageData = makePageData({ filePath: "resume.md" });
    transformPageData(pageData);

    expect(pageData.title).toContain("Resume");
    expect(pageData.frontmatter.head).toBeDefined();
  });

  it("includes canonical link to /resume", () => {
    const pageData = makePageData({ filePath: "resume.md" });
    transformPageData(pageData);

    expect(
      findHead(pageData, "link", "href", `${SITE_URL}/resume`),
    ).toBeDefined();
  });
});

describe("transformPageData – posts/index.md", () => {
  it("appends canonical and OG meta without overwriting existing head", () => {
    const existingTag = ["meta", { name: "existing" }];
    const pageData = makePageData({
      filePath: "posts/index.md",
      frontmatter: {
        title: "Blog",
        description: "All posts",
        head: [existingTag],
      },
    });
    transformPageData(pageData);

    expect(pageData.frontmatter.head).toContainEqual(existingTag);
    expect(
      findHead(pageData, "link", "href", `${SITE_URL}/posts`),
    ).toBeDefined();
  });
});

describe("transformPageData – posts/[slug].md", () => {
  it("sets title, description, and Article JSON-LD for a valid slug", () => {
    mockExistsSync.mockReturnValue(true);
    mockReadFileSync.mockReturnValue("" as any);
    mockMatter.mockReturnValue({
      data: {
        title: "My Post",
        description: "Post description",
        date: "2024-03-01",
        image: "/images/post.png",
      },
    } as any);

    const pageData = makePageData({
      filePath: "posts/[slug].md",
      params: { slug: "my-post" },
    });
    transformPageData(pageData);

    expect(pageData.title).toBe("My Post");
    expect(pageData.description).toBe("Post description");

    const scriptTag = (pageData.frontmatter.head ?? []).find(
      (tag: any[]) =>
        tag[0] === "script" &&
        tag[1]?.type === "application/ld+json" &&
        tag[2]?.includes("Article"),
    );
    expect(scriptTag).toBeDefined();
  });

  it("includes canonical link to the post URL", () => {
    mockExistsSync.mockReturnValue(true);
    mockReadFileSync.mockReturnValue("" as any);
    mockMatter.mockReturnValue({
      data: { title: "T", description: "D", date: "2024-01-01" },
    } as any);

    const pageData = makePageData({
      filePath: "posts/[slug].md",
      params: { slug: "my-post" },
    });
    transformPageData(pageData);

    expect(
      findHead(pageData, "link", "href", `${SITE_URL}/posts/my-post`),
    ).toBeDefined();
  });

  it("does nothing when the post file does not exist", () => {
    mockExistsSync.mockReturnValue(false);

    const pageData = makePageData({
      filePath: "posts/[slug].md",
      params: { slug: "missing" },
    });
    const before = { ...pageData };
    transformPageData(pageData);

    expect(pageData.title).toBe(before.title);
    expect(pageData.frontmatter.head).toBeUndefined();
  });

  it("does nothing when params has no slug", () => {
    const pageData = makePageData({
      filePath: "posts/[slug].md",
      params: {},
    });
    transformPageData(pageData);

    expect(pageData.frontmatter.head).toBeUndefined();
    expect(mockExistsSync).not.toHaveBeenCalled();
  });
});
