import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("fs", () => {
  const existsSync = vi.fn();
  const readFileSync = vi.fn();
  const readdirSync = vi.fn();
  return {
    default: { existsSync, readFileSync, readdirSync },
    existsSync,
    readFileSync,
    readdirSync,
  };
});

// Only parseFrontmatter needs stubbing (it's the fs/yaml boundary); pull the
// real coerceFrontmatterString through importOriginal so this suite exercises
// the actual coercion policy instead of a hand-copy that could drift from it.
vi.mock("../../theme/utils/frontmatter", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../../theme/utils/frontmatter")>()),
  parseFrontmatter: vi.fn(),
}));

import { existsSync, readFileSync, readdirSync } from "fs";
import { parseFrontmatter } from "../../theme/utils/frontmatter";
import { transformPageData } from "../../theme/utils/pageTransform";
import { SITE_URL } from "../../theme/utils/constants";

const mockExistsSync = vi.mocked(existsSync);
const mockReadFileSync = vi.mocked(readFileSync);
const mockReaddirSync = vi.mocked(readdirSync);
const mockParseFrontmatter = vi.mocked(parseFrontmatter);

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

// Runs a post transform for a fixed slug against the given frontmatter and
// returns the resulting pageData, so per-post cases stay a single line.
function transformPostWithFrontmatter(data: Record<string, unknown>) {
  mockExistsSync.mockReturnValue(true);
  mockReadFileSync.mockReturnValue("" as any);
  mockParseFrontmatter.mockReturnValue({ data, content: "" });
  const pageData = makePageData({
    filePath: "posts/[slug].md",
    params: { slug: "my-post" },
  });
  transformPageData(pageData);
  return pageData;
}

function getJsonLd(pageData: any) {
  const scriptTag = (pageData.frontmatter.head ?? []).find(
    (tag: any[]) =>
      tag[0] === "script" && tag[1]?.type === "application/ld+json",
  );
  return JSON.parse(scriptTag[2]);
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

  it("names the Person entity after the on-page brand with a legal alternateName", () => {
    const pageData = makePageData({ filePath: "index.md" });
    transformPageData(pageData);

    const personJson = (pageData.frontmatter.head ?? []).find(
      (tag: any[]) =>
        tag[0] === "script" &&
        tag[1]?.type === "application/ld+json" &&
        tag[2]?.includes('"@type":"Person"'),
    );
    const parsed = JSON.parse((personJson as any[])[2]);
    expect(parsed.name).toBe("Dan Holloran");
    expect(parsed.alternateName).toBe("Danny Holloran");
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

  it("includes a JSON-LD ProfilePage script tag with a Person mainEntity", () => {
    const pageData = makePageData({ filePath: "resume.md" });
    transformPageData(pageData);

    const scriptTag = (pageData.frontmatter.head ?? []).find(
      (tag: any[]) =>
        tag[0] === "script" &&
        tag[1]?.type === "application/ld+json" &&
        tag[2]?.includes("ProfilePage"),
    );
    expect(scriptTag).toBeDefined();

    const ld = JSON.parse(scriptTag[2]);
    expect(ld["@type"]).toBe("ProfilePage");
    expect(ld.url).toBe(`${SITE_URL}/resume`);
    expect(ld.mainEntity["@type"]).toBe("Person");
  });
});

describe("transformPageData – themes/grimicorn.md", () => {
  it("sets a Grimicorn title, description, and head tags", () => {
    const pageData = makePageData({ filePath: "themes/grimicorn.md" });
    transformPageData(pageData);

    expect(pageData.title).toContain("Grimicorn");
    expect(pageData.description.length).toBeGreaterThan(0);
    expect(pageData.frontmatter.title).toBe(pageData.title);
    expect(pageData.frontmatter.head).toBeDefined();
  });

  it("includes canonical link to /themes/grimicorn", () => {
    const pageData = makePageData({ filePath: "themes/grimicorn.md" });
    transformPageData(pageData);

    expect(
      findHead(pageData, "link", "href", `${SITE_URL}/themes/grimicorn`),
    ).toBeDefined();
  });

  it("sets the mascot as the og:image", () => {
    const pageData = makePageData({ filePath: "themes/grimicorn.md" });
    transformPageData(pageData);

    expect(
      findHead(
        pageData,
        "meta",
        "content",
        `${SITE_URL}/images/grimicorn-mascot.png`,
      ),
    ).toBeDefined();
  });

  it("includes a JSON-LD SoftwareApplication script tag with a free offer", () => {
    const pageData = makePageData({ filePath: "themes/grimicorn.md" });
    transformPageData(pageData);

    const scriptTag = (pageData.frontmatter.head ?? []).find(
      (tag: any[]) =>
        tag[0] === "script" &&
        tag[1]?.type === "application/ld+json" &&
        tag[2]?.includes("SoftwareApplication"),
    );
    expect(scriptTag).toBeDefined();

    const ld = JSON.parse(scriptTag[2]);
    expect(ld["@type"]).toBe("SoftwareApplication");
    expect(ld.name).toBe("Grimicorn");
    expect(ld.url).toBe(`${SITE_URL}/themes/grimicorn`);
    expect(ld.offers.price).toBe("0");
    expect(ld.author["@type"]).toBe("Person");
  });
});

describe("transformPageData – themes/grimicorn-neon.md", () => {
  it("sets a Grimicorn Neon title, description, and head tags", () => {
    const pageData = makePageData({ filePath: "themes/grimicorn-neon.md" });
    transformPageData(pageData);

    expect(pageData.title).toContain("Grimicorn Neon");
    expect(pageData.description.length).toBeGreaterThan(0);
    expect(pageData.frontmatter.title).toBe(pageData.title);
    expect(pageData.frontmatter.head).toBeDefined();
  });

  it("includes canonical link to /themes/grimicorn-neon", () => {
    const pageData = makePageData({ filePath: "themes/grimicorn-neon.md" });
    transformPageData(pageData);

    expect(
      findHead(pageData, "link", "href", `${SITE_URL}/themes/grimicorn-neon`),
    ).toBeDefined();
  });

  it("includes a JSON-LD SoftwareApplication script tag with a free offer", () => {
    const pageData = makePageData({ filePath: "themes/grimicorn-neon.md" });
    transformPageData(pageData);

    const scriptTag = (pageData.frontmatter.head ?? []).find(
      (tag: any[]) =>
        tag[0] === "script" &&
        tag[1]?.type === "application/ld+json" &&
        tag[2]?.includes("SoftwareApplication"),
    );
    expect(scriptTag).toBeDefined();

    const ld = JSON.parse(scriptTag[2]);
    expect(ld["@type"]).toBe("SoftwareApplication");
    expect(ld.name).toBe("Grimicorn Neon");
    expect(ld.url).toBe(`${SITE_URL}/themes/grimicorn-neon`);
    expect(ld.offers.price).toBe("0");
  });
});

describe("transformPageData – posts/index.md", () => {
  beforeEach(() => {
    mockReaddirSync.mockReturnValue([] as any);
  });

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
      findHead(pageData, "link", "href", `${SITE_URL}/posts/`),
    ).toBeDefined();
  });

  it("uses default-social.png as og:image when no image is in frontmatter", () => {
    const pageData = makePageData({
      filePath: "posts/index.md",
      frontmatter: { title: "Blog", description: "All posts" },
    });
    transformPageData(pageData);

    expect(
      findHead(
        pageData,
        "meta",
        "content",
        `${SITE_URL}/images/default-social.png`,
      ),
    ).toBeDefined();
  });

  it("uses frontmatter image over the default when provided", () => {
    const pageData = makePageData({
      filePath: "posts/index.md",
      frontmatter: {
        title: "Blog",
        description: "All posts",
        image: "/images/custom.png",
      },
    });
    transformPageData(pageData);

    expect(
      findHead(pageData, "meta", "content", `${SITE_URL}/images/custom.png`),
    ).toBeDefined();
    expect(
      findHead(
        pageData,
        "meta",
        "content",
        `${SITE_URL}/images/default-social.png`,
      ),
    ).toBeUndefined();
  });

  it("includes a JSON-LD Blog script tag with blogPost items", () => {
    mockReaddirSync.mockReturnValue(["post-a.md", "post-b.md"] as any);
    mockReadFileSync.mockReturnValue("" as any);
    mockParseFrontmatter
      .mockReturnValueOnce({
        data: {
          title: "Post A",
          description: "Desc A",
          date: "2024-03-01",
          draft: false,
          image: "/images/a.jpg",
        },
        content: "",
      })
      .mockReturnValueOnce({
        data: {
          title: "Post B",
          description: "Desc B",
          date: "2024-02-01",
          draft: false,
        },
        content: "",
      });

    const pageData = makePageData({
      filePath: "posts/index.md",
      frontmatter: { title: "Blog", description: "All posts" },
    });
    transformPageData(pageData);

    const scriptTag = (pageData.frontmatter.head ?? []).find(
      (tag: any[]) =>
        tag[0] === "script" &&
        tag[1]?.type === "application/ld+json" &&
        tag[2]?.includes("Blog"),
    );
    expect(scriptTag).toBeDefined();

    const ld = JSON.parse(scriptTag[2]);
    expect(ld["@type"]).toBe("Blog");
    expect(ld.url).toBe(`${SITE_URL}/posts/`);
    expect(ld.author["@type"]).toBe("Person");

    expect(Array.isArray(ld.blogPost)).toBe(true);
    expect(ld.blogPost).toHaveLength(2);
    expect(ld.blogPost[0]["@type"]).toBe("BlogPosting");
    expect(ld.blogPost[0].url).toBe(`${SITE_URL}/posts/post-a`);
    expect(ld.blogPost[0].headline).toBe("Post A");
    expect(ld.blogPost[0].image).toBe(`${SITE_URL}/images/a.jpg`);
    expect(ld.blogPost[1].image).toBeUndefined();
  });

  it("caps the blogPost list at the 10 newest published posts and excludes drafts", () => {
    const files = Array.from({ length: 12 }, (_, index) => `post-${index}.md`);
    mockReaddirSync.mockReturnValue(files as any);
    mockReadFileSync.mockReturnValue("" as any);
    files.forEach((_, index) => {
      // Later index = newer date, so post-11 is newest. Mark the newest as a
      // draft: if draft filtering broke, it would surface at the top of the
      // list, so the cap alone cannot hide the failure.
      const month = String(index + 1).padStart(2, "0");
      mockParseFrontmatter.mockReturnValueOnce({
        data: {
          title: `Post ${index}`,
          date: `2024-${month}-01`,
          draft: index === 11,
        },
        content: "",
      });
    });

    const pageData = makePageData({
      filePath: "posts/index.md",
      frontmatter: { title: "Blog", description: "All posts" },
    });
    transformPageData(pageData);

    const scriptTag = (pageData.frontmatter.head ?? []).find(
      (tag: any[]) =>
        tag[0] === "script" &&
        tag[1]?.type === "application/ld+json" &&
        tag[2]?.includes("Blog"),
    );
    const ld = JSON.parse(scriptTag[2]);

    // 11 published posts (post-11 is a draft), newest-first, capped at 10:
    // post-10 leads, post-11 is absent, and the oldest (post-0) is cut by the cap.
    expect(ld.blogPost).toHaveLength(10);
    expect(ld.blogPost[0].headline).toBe("Post 10");
    expect(
      ld.blogPost.some(
        (post: { headline: string }) => post.headline === "Post 11",
      ),
    ).toBe(false);
  });
});

describe("transformPageData – posts/[slug].md", () => {
  it("sets title, description, and Article JSON-LD for a valid slug", () => {
    mockExistsSync.mockReturnValue(true);
    mockReadFileSync.mockReturnValue("" as any);
    mockParseFrontmatter.mockReturnValue({
      data: {
        title: "My Post",
        description: "Post description",
        date: "2024-03-01",
        image: "/images/post.png",
      },
      content: "",
    });

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

  it("stringifies a non-string title/description rather than dropping them", () => {
    // An unquoted YAML scalar that looks like a number/date/bool parses as
    // that type, not a string. Coerce it into something meaningful instead
    // of silently shipping empty SEO metadata for the page.
    const pageData = transformPostWithFrontmatter({
      title: 1984,
      description: false,
      date: "2024-03-01",
    });

    expect(pageData.title).toBe("1984");
    expect(pageData.description).toBe("false");
  });

  it("defaults title/description to an empty string when absent", () => {
    const pageData = transformPostWithFrontmatter({
      date: "2024-03-01",
    });

    expect(pageData.title).toBe("");
    expect(pageData.description).toBe("");
  });

  it("drops the brand-suffix titleTemplate on a long title", () => {
    const pageData = transformPostWithFrontmatter({
      title: "Index Funds vs Active Management: Reading the Scorecard Honestly",
      description: "D",
      date: "2024-03-01",
    });

    expect(pageData.titleTemplate).toBe(false);
  });

  it("keeps the brand-suffix titleTemplate on a short title", () => {
    const pageData = transformPostWithFrontmatter({
      title: "Zustand, briefly",
      description: "D",
      date: "2024-03-01",
    });

    expect(pageData.titleTemplate).toBeUndefined();
  });

  it("falls back to default-social.png for og:image, twitter:image, and Article JSON-LD when no frontmatter image", () => {
    const pageData = transformPostWithFrontmatter({
      title: "T",
      description: "D",
      date: "2024-03-01",
    });
    const defaultImageUrl = `${SITE_URL}/images/default-social.png`;

    expect(
      findHead(pageData, "meta", "property", "og:image")?.[1]?.content,
    ).toBe(defaultImageUrl);
    expect(
      findHead(pageData, "meta", "name", "twitter:image")?.[1]?.content,
    ).toBe(defaultImageUrl);
    expect(getJsonLd(pageData).image).toBe(defaultImageUrl);
  });

  it("uses the frontmatter image over the default when provided", () => {
    const pageData = transformPostWithFrontmatter({
      title: "T",
      description: "D",
      date: "2024-03-01",
      image: "/images/post.png",
    });
    const postImageUrl = `${SITE_URL}/images/post.png`;

    expect(
      findHead(pageData, "meta", "property", "og:image")?.[1]?.content,
    ).toBe(postImageUrl);
    expect(
      findHead(pageData, "meta", "name", "twitter:image")?.[1]?.content,
    ).toBe(postImageUrl);
    expect(
      findHead(
        pageData,
        "meta",
        "content",
        `${SITE_URL}/images/default-social.png`,
      ),
    ).toBeUndefined();
    expect(getJsonLd(pageData).image).toBe(postImageUrl);
  });

  it("self-canonicals when no canonical frontmatter is set", () => {
    const pageData = transformPostWithFrontmatter({
      title: "T",
      description: "D",
      date: "2024-03-01",
    });
    const selfUrl = `${SITE_URL}/posts/my-post`;

    expect(findHead(pageData, "link", "href", selfUrl)).toBeDefined();
    expect(findHead(pageData, "meta", "property", "og:url")?.[1]?.content).toBe(
      selfUrl,
    );
    expect(getJsonLd(pageData).url).toBe(selfUrl);
  });

  // Distinguishes the post being transformed ("my-post") from the canonical
  // target it looks up (loadPostFrontmatterBySlug reads the target's own
  // file directly, by full path) so each fake file can carry distinct
  // frontmatter — e.g. only one of them declares `canonical`, or the target
  // is a draft. Matches on the filename, not a substring, so slugs that are
  // substrings of one another (e.g. "post" vs "primary-post") can't collide.
  function mockPostFiles(
    filesBySlug: Record<string, Record<string, unknown>>,
  ): void {
    mockReadFileSync.mockImplementation((path) => path as any);
    mockParseFrontmatter.mockImplementation((raw) => {
      const matchedSlug = Object.keys(filesBySlug).find((slug) =>
        (raw as string).endsWith(`/${slug}.md`),
      );
      return { data: matchedSlug ? filesBySlug[matchedSlug] : {}, content: "" };
    });
  }

  it("points the canonical link at another post when canonical frontmatter is set, keeping og:url and JSON-LD self-referential", () => {
    mockExistsSync.mockReturnValue(true);
    mockPostFiles({
      "my-post": {
        title: "T",
        description: "D",
        date: "2024-03-01",
        canonical: "the-primary-post",
      },
      "the-primary-post": { title: "Primary", date: "2024-01-01" },
    });

    const pageData = makePageData({
      filePath: "posts/[slug].md",
      params: { slug: "my-post" },
    });
    transformPageData(pageData);

    const selfUrl = `${SITE_URL}/posts/my-post`;
    const canonicalUrl = `${SITE_URL}/posts/the-primary-post`;

    expect(findHead(pageData, "link", "href", canonicalUrl)).toBeDefined();
    expect(findHead(pageData, "link", "href", selfUrl)).toBeUndefined();
    expect(findHead(pageData, "meta", "property", "og:url")?.[1]?.content).toBe(
      selfUrl,
    );
    expect(getJsonLd(pageData).url).toBe(selfUrl);
  });

  it("throws naming both the declaring post and the missing target when canonical points at a slug with no published post at all", () => {
    // The current post's own file exists; the canonical target's does not —
    // existsSync must distinguish the two paths for the target lookup to
    // report "missing" rather than resolving the wrong file. Built manually
    // rather than via transformPostWithFrontmatter, which forces
    // mockExistsSync back to an unconditional true.
    mockExistsSync.mockImplementation(
      (path) => !(path as string).endsWith("/does-not-exist.md"),
    );
    mockReadFileSync.mockReturnValue("" as any);
    mockParseFrontmatter.mockReturnValue({
      data: {
        title: "T",
        description: "D",
        date: "2024-03-01",
        canonical: "does-not-exist",
      },
      content: "",
    });

    const pageData = makePageData({
      filePath: "posts/[slug].md",
      params: { slug: "my-post" },
    });

    expect(() => transformPageData(pageData)).toThrow(
      /post "my-post".*canonical "does-not-exist"/s,
    );
  });

  it("throws when canonical frontmatter has a non-string value instead of silently self-canonicaling", () => {
    expect(() =>
      transformPostWithFrontmatter({
        title: "T",
        description: "D",
        date: "2024-03-01",
        canonical: ["the-primary-post"],
      }),
    ).toThrow(/post "my-post".*non-string canonical/s);
  });

  it("throws on path-traversal characters in canonical instead of ever touching the filesystem with them", () => {
    expect(() =>
      transformPostWithFrontmatter({
        title: "T",
        description: "D",
        date: "2024-03-01",
        canonical: "../../../README",
      }),
    ).toThrow(/isn't a valid post slug/);
    // The slug-shape guard must reject the value before any existsSync check
    // reaches the filesystem with it — join() would otherwise silently
    // normalize the ".." segments onto a real file outside the posts dir.
    expect(mockExistsSync).not.toHaveBeenCalledWith(
      expect.stringContaining("README"),
    );
  });

  it('throws when canonical points at "index", which is never a real post even if a stray file exists', () => {
    expect(() =>
      transformPostWithFrontmatter({
        title: "T",
        description: "D",
        date: "2024-03-01",
        canonical: "index",
      }),
    ).toThrow(/post "my-post".*canonical "index"/s);
  });

  it("throws when canonical uses mixed case instead of resolving case-insensitively on some filesystems", () => {
    expect(() =>
      transformPostWithFrontmatter({
        title: "T",
        description: "D",
        date: "2024-03-01",
        canonical: "The-Primary-Post",
      }),
    ).toThrow(/isn't a valid post slug/);
  });

  it("self-canonicals rather than throwing when canonical frontmatter parses to null (a bare `canonical:` key)", () => {
    const pageData = transformPostWithFrontmatter({
      title: "T",
      description: "D",
      date: "2024-03-01",
      canonical: null,
    });
    const selfUrl = `${SITE_URL}/posts/my-post`;

    expect(findHead(pageData, "link", "href", selfUrl)).toBeDefined();
  });

  it("self-canonicals rather than throwing when canonical frontmatter names the post's own slug", () => {
    const pageData = transformPostWithFrontmatter({
      title: "T",
      description: "D",
      date: "2024-03-01",
      canonical: "my-post",
    });
    const selfUrl = `${SITE_URL}/posts/my-post`;

    expect(findHead(pageData, "link", "href", selfUrl)).toBeDefined();
  });

  it("throws a draft-specific message when canonical points at a slug that exists but is unpublished", () => {
    mockExistsSync.mockReturnValue(true);
    mockPostFiles({
      "my-post": {
        title: "T",
        description: "D",
        date: "2024-03-01",
        canonical: "the-primary-post",
      },
      "the-primary-post": { draft: true },
    });

    const pageData = makePageData({
      filePath: "posts/[slug].md",
      params: { slug: "my-post" },
    });

    expect(() => transformPageData(pageData)).toThrow(
      /post "my-post".*canonical "the-primary-post".*draft/is,
    );
  });

  it("throws when the canonical target itself declares a different canonical, rejecting chained canonicals", () => {
    mockExistsSync.mockReturnValue(true);
    mockPostFiles({
      "my-post": {
        title: "T",
        description: "D",
        date: "2024-03-01",
        canonical: "the-primary-post",
      },
      "the-primary-post": { canonical: "some-third-post" },
    });

    const pageData = makePageData({
      filePath: "posts/[slug].md",
      params: { slug: "my-post" },
    });

    expect(() => transformPageData(pageData)).toThrow(
      /post "my-post".*canonical "the-primary-post".*canonicals to "some-third-post"/s,
    );
  });

  it("does not treat a canonical target that canonicals to itself as a chain", () => {
    mockExistsSync.mockReturnValue(true);
    mockPostFiles({
      "my-post": {
        title: "T",
        description: "D",
        date: "2024-03-01",
        canonical: "the-primary-post",
      },
      "the-primary-post": { canonical: "the-primary-post" },
    });

    const pageData = makePageData({
      filePath: "posts/[slug].md",
      params: { slug: "my-post" },
    });
    transformPageData(pageData);

    expect(
      findHead(pageData, "link", "href", `${SITE_URL}/posts/the-primary-post`),
    ).toBeDefined();
  });

  it("ignores a blank canonical frontmatter value and self-canonicals", () => {
    const pageData = transformPostWithFrontmatter({
      title: "T",
      description: "D",
      date: "2024-03-01",
      canonical: "   ",
    });
    const selfUrl = `${SITE_URL}/posts/my-post`;

    expect(findHead(pageData, "link", "href", selfUrl)).toBeDefined();
  });

  it("sets dateModified to the post date when no dateModified is in frontmatter", () => {
    mockExistsSync.mockReturnValue(true);
    mockReadFileSync.mockReturnValue("" as any);
    mockParseFrontmatter.mockReturnValue({
      data: { title: "T", description: "D", date: "2024-03-01" },
      content: "",
    });

    const pageData = makePageData({
      filePath: "posts/[slug].md",
      params: { slug: "my-post" },
    });
    transformPageData(pageData);

    const scriptTag = (pageData.frontmatter.head ?? []).find(
      (tag: any[]) =>
        tag[0] === "script" && tag[1]?.type === "application/ld+json",
    );
    const ld = JSON.parse(scriptTag[2]);
    expect(ld.dateModified).toBe("2024-03-01");
  });

  it("uses a separate dateModified when provided in frontmatter", () => {
    mockExistsSync.mockReturnValue(true);
    mockReadFileSync.mockReturnValue("" as any);
    mockParseFrontmatter.mockReturnValue({
      data: {
        title: "T",
        description: "D",
        date: "2024-03-01",
        dateModified: "2024-06-15",
      },
      content: "",
    });

    const pageData = makePageData({
      filePath: "posts/[slug].md",
      params: { slug: "my-post" },
    });
    transformPageData(pageData);

    const scriptTag = (pageData.frontmatter.head ?? []).find(
      (tag: any[]) =>
        tag[0] === "script" && tag[1]?.type === "application/ld+json",
    );
    const ld = JSON.parse(scriptTag[2]);
    expect(ld.dateModified).toBe("2024-06-15");
  });

  it("maps topic to articleSection and tags to keywords in the Article JSON-LD", () => {
    const ld = getJsonLd(
      transformPostWithFrontmatter({
        title: "T",
        description: "D",
        date: "2024-03-01",
        topic: "development",
        tags: ["vue", "javascript"],
      }),
    );
    expect(ld.articleSection).toBe("development");
    expect(ld.keywords).toBe("vue, javascript");
  });

  it("sets articleSection but omits keywords when only a topic is present", () => {
    const ld = getJsonLd(
      transformPostWithFrontmatter({
        title: "T",
        description: "D",
        date: "2024-03-01",
        topic: "development",
      }),
    );
    expect(ld.articleSection).toBe("development");
    expect("keywords" in ld).toBe(false);
  });

  it("sets keywords but omits articleSection when only tags are present", () => {
    const ld = getJsonLd(
      transformPostWithFrontmatter({
        title: "T",
        description: "D",
        date: "2024-03-01",
        tags: ["vue", "javascript"],
      }),
    );
    expect(ld.keywords).toBe("vue, javascript");
    expect("articleSection" in ld).toBe(false);
  });

  it("omits articleSection and keywords when topic and tags are absent", () => {
    const ld = getJsonLd(
      transformPostWithFrontmatter({
        title: "T",
        description: "D",
        date: "2024-03-01",
      }),
    );
    expect("articleSection" in ld).toBe(false);
    expect("keywords" in ld).toBe(false);
  });

  it("omits keywords when tags contains only blank entries", () => {
    const ld = getJsonLd(
      transformPostWithFrontmatter({
        title: "T",
        description: "D",
        date: "2024-03-01",
        tags: ["", " "],
      }),
    );
    expect("keywords" in ld).toBe(false);
  });

  it("omits keywords when tags is an empty array", () => {
    const ld = getJsonLd(
      transformPostWithFrontmatter({
        title: "T",
        description: "D",
        date: "2024-03-01",
        tags: [],
      }),
    );
    expect("keywords" in ld).toBe(false);
  });

  it("omits articleSection when topic is only whitespace", () => {
    const ld = getJsonLd(
      transformPostWithFrontmatter({
        title: "T",
        description: "D",
        date: "2024-03-01",
        topic: "   ",
      }),
    );
    expect("articleSection" in ld).toBe(false);
  });

  it("coerces a lone scalar tag and trims surviving tags into keywords", () => {
    const ld = getJsonLd(
      transformPostWithFrontmatter({
        title: "T",
        description: "D",
        date: "2024-03-01",
        tags: " vue ",
      }),
    );
    expect(ld.keywords).toBe("vue");
  });

  it("stringifies non-string scalar tags rather than dropping them", () => {
    const ld = getJsonLd(
      transformPostWithFrontmatter({
        title: "T",
        description: "D",
        date: "2024-03-01",
        tags: [2025, "inp"],
      }),
    );
    expect(ld.keywords).toBe("2025, inp");
  });

  it("does not duplicate JSON-LD when called twice on the same pageData", () => {
    mockExistsSync.mockReturnValue(true);
    mockReadFileSync.mockReturnValue("" as any);
    mockParseFrontmatter.mockReturnValue({
      data: { title: "T", description: "D", date: "2024-03-01" },
      content: "",
    });

    const pageData = makePageData({
      filePath: "posts/[slug].md",
      params: { slug: "my-post" },
    });
    transformPageData(pageData);
    transformPageData(pageData);

    const scriptTags = (pageData.frontmatter.head ?? []).filter(
      (tag: any[]) =>
        tag[0] === "script" && tag[1]?.type === "application/ld+json",
    );
    expect(scriptTags).toHaveLength(1);
  });

  it("includes canonical link to the post URL", () => {
    mockExistsSync.mockReturnValue(true);
    mockReadFileSync.mockReturnValue("" as any);
    mockParseFrontmatter.mockReturnValue({
      data: { title: "T", description: "D", date: "2024-01-01" },
      content: "",
    });

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

  it("emits no title, SEO metadata, or JSON-LD for a draft post", () => {
    const pageData = transformPostWithFrontmatter({
      title: "Draft Post",
      description: "Should never be indexed",
      date: "2024-03-01",
      draft: true,
    });

    expect(pageData.title).toBe("");
    expect(pageData.description).toBe("");
    expect(pageData.frontmatter.title).toBeUndefined();
    expect(pageData.frontmatter.description).toBeUndefined();
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

describe("transformPageData – archive routes", () => {
  function transformArchivePage(
    filePath: string,
    params: Record<string, string>,
  ) {
    const pageData = makePageData({ filePath, params });
    transformPageData(pageData);
    return pageData;
  }

  function findRobotsNoindex(pageData: any) {
    return findHead(pageData, "meta", "content", "noindex,follow");
  }

  it("titles and self-canonicals an unfiltered page N", () => {
    const pageData = transformArchivePage("posts/page/[page].md", {
      page: "3",
    });

    expect(pageData.title).toBe("Writing — Page 3");
    expect(
      findHead(pageData, "link", "href", `${SITE_URL}/posts/page/3`),
    ).toBeDefined();
    expect(pageData.description).toContain("Page 3.");
    expect(findRobotsNoindex(pageData)).toBeDefined();
  });

  it("titles a topic page 1 without a page segment in its canonical", () => {
    const pageData = transformArchivePage("posts/topic/[topic].md", {
      topic: "development",
      topicLabel: "development",
      page: "1",
    });

    expect(pageData.title).toBe("Posts on development");
    expect(
      findHead(pageData, "link", "href", `${SITE_URL}/posts/topic/development`),
    ).toBeDefined();
  });

  it("keeps the topic hub page 1 indexable (no robots noindex)", () => {
    const pageData = transformArchivePage("posts/topic/[topic].md", {
      topic: "development",
      topicLabel: "development",
      page: "1",
    });

    expect(findRobotsNoindex(pageData)).toBeUndefined();
  });

  it("noindexes a paginated topic page beyond page 1", () => {
    const pageData = transformArchivePage(
      "posts/topic/[topic]/page/[page].md",
      {
        topic: "development",
        topicLabel: "development",
        page: "2",
      },
    );

    expect(findRobotsNoindex(pageData)).toBeDefined();
  });

  it("noindexes a tag hub page 1", () => {
    const pageData = transformArchivePage("posts/tag/[tag].md", {
      tag: "javascript",
      tagLabel: "javascript",
      page: "1",
    });

    expect(findRobotsNoindex(pageData)).toBeDefined();
  });

  it("titles, canonicals, and noindexes a paginated tag page", () => {
    const pageData = transformArchivePage("posts/tag/[tag]/page/[page].md", {
      tag: "javascript",
      tagLabel: "javascript",
      page: "2",
    });

    expect(pageData.title).toBe("Posts tagged #javascript — Page 2");
    expect(
      findHead(
        pageData,
        "link",
        "href",
        `${SITE_URL}/posts/tag/javascript/page/2`,
      ),
    ).toBeDefined();
    expect(findRobotsNoindex(pageData)).toBeDefined();
  });
});
