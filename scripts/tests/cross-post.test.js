import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import fs from "fs";
import {
  prepareContent,
  readPost,
  shouldCrossPost,
  postToDevTo,
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

// ─── shouldCrossPost ─────────────────────────────────────────────────────────

describe("shouldCrossPost", () => {
  it("returns true when topic is 'development' and draft is false", () => {
    expect(shouldCrossPost({ topic: "development", draft: false })).toBe(true);
  });

  it("returns false when topic is something else", () => {
    expect(shouldCrossPost({ topic: "travel", draft: false })).toBe(false);
  });

  it("returns false when topic is missing", () => {
    expect(shouldCrossPost({ draft: false })).toBe(false);
  });

  it("returns false when draft is true", () => {
    expect(shouldCrossPost({ topic: "development", draft: true })).toBe(false);
  });

  it("returns false when draft is missing", () => {
    expect(shouldCrossPost({ topic: "development" })).toBe(false);
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

  it("retries once after a 429 and succeeds", async () => {
    vi.stubEnv("DEVTO_API_KEY", "test-key");
    vi.useFakeTimers();

    const mockFetch = vi
      .fn()
      .mockResolvedValueOnce({
        ok: false,
        status: 429,
        json: async () => ({
          error: "Rate limit reached, try again in 10 seconds",
          status: 429,
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ url: "https://dev.to/user/article-123" }),
      });
    vi.stubGlobal("fetch", mockFetch);

    const promise = postToDevTo({
      frontmatter: { title: "T", tags: [] },
      content: "",
      slug: "s",
    });

    await vi.runAllTimersAsync();
    const url = await promise;

    expect(url).toBe("https://dev.to/user/article-123");
    expect(mockFetch).toHaveBeenCalledTimes(2);
    vi.useRealTimers();
  });

  it("parses the wait time from the 429 response body", async () => {
    vi.stubEnv("DEVTO_API_KEY", "test-key");
    vi.useFakeTimers();

    const mockFetch = vi
      .fn()
      .mockResolvedValueOnce({
        ok: false,
        status: 429,
        json: async () => ({
          error: "Rate limit reached, try again in 300 seconds",
          status: 429,
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ url: "https://dev.to/x" }),
      });
    vi.stubGlobal("fetch", mockFetch);

    const promise = postToDevTo({
      frontmatter: { title: "T", tags: [] },
      content: "",
      slug: "s",
    });

    await vi.advanceTimersByTimeAsync(300_000);
    await promise;

    expect(mockFetch).toHaveBeenCalledTimes(2);
    vi.useRealTimers();
  });

  it("throws if the retry after a 429 also fails", async () => {
    vi.stubEnv("DEVTO_API_KEY", "test-key");
    vi.useFakeTimers();

    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValueOnce({
          ok: false,
          status: 429,
          json: async () => ({
            error: "Rate limit reached, try again in 10 seconds",
          }),
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 422,
          text: async () => "Still failing",
        }),
    );

    const promise = postToDevTo({
      frontmatter: { title: "T", tags: [] },
      content: "",
      slug: "s",
    });

    // Attach the rejection handler before advancing timers to avoid unhandled rejection
    const assertion = expect(promise).rejects.toThrow("Dev.to error 422");
    await vi.runAllTimersAsync();
    await assertion;
    vi.useRealTimers();
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
