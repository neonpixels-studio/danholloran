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

vi.mock("../../theme/utils/frontmatter", () => ({
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
