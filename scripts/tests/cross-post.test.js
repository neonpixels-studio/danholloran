import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import fs from "fs";
import {
  prepareContent,
  readPost,
  postToDevTo,
  postToHashnode,
} from "../cross-post.mjs";

const SITE_URL = "https://danholloran.me";

beforeEach(() => {
  vi.spyOn(console, "log").mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
});

// ─── prepareContent ──────────────────────────────────────────────────────────

describe("prepareContent", () => {
  it("prepends a header with the canonical URL", () => {
    const result = prepareContent("Body text.", "my-post", "My Post");
    expect(result).toContain(
      `> *Originally published on [danholloran.me](${SITE_URL}/posts/my-post)*`,
    );
  });

  it("appends a footer with the canonical URL", () => {
    const result = prepareContent("Body text.", "my-post", "My Post");
    expect(result).toContain(
      `*This post was originally published on [danholloran.me](${SITE_URL}/posts/my-post).`,
    );
  });

  it("includes the original content between header and footer", () => {
    const result = prepareContent("Body text.", "slug", "Title");
    expect(result).toContain("Body text.");
  });

  it("resolves dot-relative image paths to absolute URLs", () => {
    const result = prepareContent(
      "![Alt](./images/photo.png)",
      "slug",
      "Title",
    );
    expect(result).toContain(`![Alt](${SITE_URL}/images/photo.png)`);
    expect(result).not.toContain("./images/photo.png");
  });

  it("resolves root-relative image paths to absolute URLs", () => {
    const result = prepareContent("![Alt](/images/photo.png)", "slug", "Title");
    expect(result).toContain(`![Alt](${SITE_URL}/images/photo.png)`);
  });

  it("leaves already-absolute image URLs unchanged", () => {
    const src = "https://cdn.example.com/image.png";
    const result = prepareContent(`![Alt](${src})`, "slug", "Title");
    expect(result).toContain(`![Alt](${src})`);
  });

  it("resolves multiple relative images in one pass", () => {
    const content = "![A](./a.png) and ![B](./b.png)";
    const result = prepareContent(content, "slug", "Title");
    expect(result).toContain(`![A](${SITE_URL}/a.png)`);
    expect(result).toContain(`![B](${SITE_URL}/b.png)`);
  });
});

// ─── readPost ────────────────────────────────────────────────────────────────

describe("readPost", () => {
  it("throws when the post file does not exist", () => {
    vi.spyOn(fs, "existsSync").mockReturnValue(false);
    expect(() => readPost("missing-slug")).toThrow("Post file not found");
  });

  it("returns frontmatter, content, and slug when file exists", () => {
    const raw = `---\ntitle: Hello World\ntags:\n  - js\n---\n\nBody content here.`;
    vi.spyOn(fs, "existsSync").mockReturnValue(true);
    vi.spyOn(fs, "readFileSync").mockReturnValue(raw);

    const result = readPost("hello-world");
    expect(result.slug).toBe("hello-world");
    expect(result.frontmatter.title).toBe("Hello World");
    expect(result.frontmatter.tags).toEqual(["js"]);
    expect(result.content.trim()).toBe("Body content here.");
  });
});

// ─── postToDevTo ─────────────────────────────────────────────────────────────

describe("postToDevTo", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it("throws when DEVTO_API_KEY is not set", async () => {
    vi.stubEnv("DEVTO_API_KEY", "");
    await expect(
      postToDevTo({
        frontmatter: { title: "T", tags: [] },
        content: "",
        slug: "s",
      }),
    ).rejects.toThrow("DEVTO_API_KEY not set");
  });

  it("POSTs to dev.to with correct headers and returns the article URL", async () => {
    vi.stubEnv("DEVTO_API_KEY", "test-key");
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ url: "https://dev.to/user/article-123" }),
    });
    vi.stubGlobal("fetch", mockFetch);

    const url = await postToDevTo({
      frontmatter: { title: "My Post", tags: ["js", "web"] },
      content: "Content here.",
      slug: "my-post",
    });

    expect(url).toBe("https://dev.to/user/article-123");
    expect(mockFetch).toHaveBeenCalledWith(
      "https://dev.to/api/articles",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({ "api-key": "test-key" }),
      }),
    );
  });

  it("throws on a non-ok HTTP response", async () => {
    vi.stubEnv("DEVTO_API_KEY", "test-key");
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 422,
        text: async () => "Unprocessable Entity",
      }),
    );

    await expect(
      postToDevTo({
        frontmatter: { title: "T", tags: [] },
        content: "",
        slug: "s",
      }),
    ).rejects.toThrow("Dev.to error 422");
  });

  it("maps tags: lowercased, non-alphanumeric removed, max 4", async () => {
    vi.stubEnv("DEVTO_API_KEY", "test-key");
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ url: "https://dev.to/x" }),
    });
    vi.stubGlobal("fetch", mockFetch);

    await postToDevTo({
      frontmatter: {
        title: "T",
        tags: ["Node.JS", "C++", "Web Dev", "CSS", "Extra"],
      },
      content: "",
      slug: "s",
    });

    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.article.tags).toEqual(["nodejs", "c", "webdev", "css"]);
    expect(body.article.tags.length).toBe(4);
  });
});

// ─── postToHashnode ──────────────────────────────────────────────────────────

describe("postToHashnode", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it("throws when HASHNODE_PAT is not set", async () => {
    vi.stubEnv("HASHNODE_PAT", "");
    vi.stubEnv("HASHNODE_PUBLICATION_ID", "pub-123");
    await expect(
      postToHashnode({
        frontmatter: { title: "T", tags: [] },
        content: "",
        slug: "s",
      }),
    ).rejects.toThrow("HASHNODE_PAT not set");
  });

  it("throws when HASHNODE_PUBLICATION_ID is not set", async () => {
    vi.stubEnv("HASHNODE_PAT", "pat-token");
    vi.stubEnv("HASHNODE_PUBLICATION_ID", "");
    await expect(
      postToHashnode({
        frontmatter: { title: "T", tags: [] },
        content: "",
        slug: "s",
      }),
    ).rejects.toThrow("HASHNODE_PUBLICATION_ID not set");
  });

  it("POSTs to gql.hashnode.com with Authorization header and returns post URL", async () => {
    vi.stubEnv("HASHNODE_PAT", "pat-token");
    vi.stubEnv("HASHNODE_PUBLICATION_ID", "pub-123");
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        data: {
          publishPost: { post: { url: "https://hashnode.com/post/abc" } },
        },
        errors: null,
      }),
    });
    vi.stubGlobal("fetch", mockFetch);

    const url = await postToHashnode({
      frontmatter: { title: "My Post", tags: ["js"] },
      content: "Content.",
      slug: "my-post",
    });

    expect(url).toBe("https://hashnode.com/post/abc");
    expect(mockFetch).toHaveBeenCalledWith(
      "https://gql.hashnode.com/",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({ Authorization: "pat-token" }),
      }),
    );
  });

  it("throws on a non-ok HTTP response", async () => {
    vi.stubEnv("HASHNODE_PAT", "pat-token");
    vi.stubEnv("HASHNODE_PUBLICATION_ID", "pub-123");
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        text: async () => "Internal Server Error",
      }),
    );

    await expect(
      postToHashnode({
        frontmatter: { title: "T", tags: [] },
        content: "",
        slug: "s",
      }),
    ).rejects.toThrow("Hashnode error 500");
  });

  it("throws when the GraphQL response contains errors", async () => {
    vi.stubEnv("HASHNODE_PAT", "pat-token");
    vi.stubEnv("HASHNODE_PUBLICATION_ID", "pub-123");
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          data: null,
          errors: [{ message: "Not authorized" }],
        }),
      }),
    );

    await expect(
      postToHashnode({
        frontmatter: { title: "T", tags: [] },
        content: "",
        slug: "s",
      }),
    ).rejects.toThrow("Hashnode GraphQL errors");
  });

  it("maps tags to name + slug objects, max 5", async () => {
    vi.stubEnv("HASHNODE_PAT", "pat-token");
    vi.stubEnv("HASHNODE_PUBLICATION_ID", "pub-123");
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        data: { publishPost: { post: { url: "https://hashnode.com/post/x" } } },
        errors: null,
      }),
    });
    vi.stubGlobal("fetch", mockFetch);

    await postToHashnode({
      frontmatter: {
        title: "T",
        tags: ["JavaScript", "Node JS", "CSS", "HTML", "Web", "Extra"],
      },
      content: "",
      slug: "s",
    });

    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    const tags = body.variables.input.tags;
    expect(tags.length).toBe(5);
    expect(tags[0]).toEqual({ name: "JavaScript", slug: "javascript" });
    expect(tags[1]).toEqual({ name: "Node JS", slug: "node-js" });
  });
});
