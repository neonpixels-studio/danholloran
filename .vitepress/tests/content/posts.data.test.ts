import { describe, it, expect, vi, beforeAll } from "vitest";

// createContentLoader is provided by vitepress at build time; capture the
// config object the loader module hands it so `transform` can be exercised
// directly, the same way the real loader would call it.
let capturedPattern: string;
let capturedConfig: {
  includeSrc?: boolean;
  render?: boolean;
  excerpt?: boolean;
  transform: (_data: unknown[]) => unknown[];
};

vi.mock("vitepress", () => ({
  createContentLoader: (pattern: string, config: typeof capturedConfig) => {
    capturedPattern = pattern;
    capturedConfig = config;
    return { watch: [], load: () => [] };
  },
}));

function makeRawPost(overrides: Record<string, unknown> = {}) {
  return {
    // Real createContentLoader urls have the .md extension stripped.
    // VitePress's own loader always attaches an `excerpt` key (undefined
    // when the `excerpt` option isn't set) rather than omitting it, so the
    // fixture mirrors that shape to prove the transform strips it.
    url: "/.vitepress/content/posts/example-post",
    src: "word ".repeat(400).trim(),
    html: "<p>Rendered content</p>",
    excerpt: undefined,
    frontmatter: {
      title: "Example Post",
      image: "/images/posts/example-post.jpg",
      draft: false,
      topic: "development",
      date: "2025-01-01T00:00:00.000Z",
      description: "An example post.",
      tags: ["javascript"],
    },
    ...overrides,
  };
}

describe("posts.data.ts loader", () => {
  beforeAll(async () => {
    await import("../../content/posts/posts.data.ts");
  });

  it("registers the posts glob and a transform function with createContentLoader", () => {
    expect(capturedPattern).toBe(".vitepress/content/posts/*.md");
    expect(typeof capturedConfig.transform).toBe("function");
  });

  it("keeps includeSrc and render on but does not request excerpt", () => {
    expect(capturedConfig.includeSrc).toBe(true);
    expect(capturedConfig.render).toBe(true);
    expect(capturedConfig).not.toHaveProperty("excerpt");
  });

  it("returns frontmatter, url, slug, and readTime for each post", () => {
    const [transformed] = capturedConfig.transform([makeRawPost()]);
    const post = transformed as {
      url: string;
      frontmatter: Record<string, unknown>;
    };

    expect(post.url).toBe("/posts/example-post");
    expect(post.frontmatter.slug).toBe("example-post");
    expect(post.frontmatter.title).toBe("Example Post");
    // The fixture src is exactly 400 words: calculateReadTime rounds
    // wordCount / 200, so this pins the real computed value rather than
    // just asserting "some positive number". (Real src also includes the
    // frontmatter block, which calculateReadTime's own tests cover; this
    // test only checks that the loader passes src through correctly.)
    expect(post.frontmatter.readTime).toBe(2);
  });

  it("keeps rendered html for the post detail view but drops src and excerpt", () => {
    const [transformed] = capturedConfig.transform([makeRawPost()]);
    const post = transformed as Record<string, unknown>;

    expect(post.html).toBe("<p>Rendered content</p>");
    expect(post).not.toHaveProperty("src");
    expect(post).not.toHaveProperty("excerpt");
  });

  it("filters out draft posts", () => {
    const draftPost = makeRawPost({
      frontmatter: { ...makeRawPost().frontmatter, draft: true },
    });

    const transformed = capturedConfig.transform([draftPost]);

    expect(transformed).toHaveLength(0);
  });

  it("derives the slug from a url that already omits the content-folder prefix", () => {
    const [transformed] = capturedConfig.transform([
      makeRawPost({ url: "/posts/example-post" }),
    ]) as [{ url: string; frontmatter: { slug: string } }];

    expect(transformed.frontmatter.slug).toBe("example-post");
    expect(transformed.url).toBe("/posts/example-post");
  });

  it("falls back to the minimum readTime when src is absent", () => {
    const [transformed] = capturedConfig.transform([
      makeRawPost({ src: undefined }),
    ]) as [{ frontmatter: { readTime: number } }];

    expect(transformed.frontmatter.readTime).toBe(1);
  });

  it("sorts posts by date, newest first", () => {
    const olderPost = makeRawPost({
      url: "/.vitepress/content/posts/older-post",
      frontmatter: {
        ...makeRawPost().frontmatter,
        date: "2024-01-01T00:00:00.000Z",
      },
    });
    const newerPost = makeRawPost({
      url: "/.vitepress/content/posts/newer-post",
      frontmatter: {
        ...makeRawPost().frontmatter,
        date: "2025-06-01T00:00:00.000Z",
      },
    });

    const transformed = capturedConfig.transform([olderPost, newerPost]) as {
      frontmatter: { slug: string };
    }[];

    expect(transformed.map((post) => post.frontmatter.slug)).toEqual([
      "newer-post",
      "older-post",
    ]);
  });

  it("does not mutate the raw post object, so re-transforming a cached post is safe", () => {
    // VitePress reuses the same cached raw data object across reloads (e.g.
    // dev server HMR) and re-runs transform on it. A transform that mutates
    // `frontmatter`/`url` in place would leak derived state (slug, readTime)
    // back into that cache and corrupt the next pass. toStrictEqual (not
    // toEqual) matters here: toEqual ignores undefined-valued keys, which
    // would hide a regression that deletes/blanks a key instead of copying.
    const cachedRawPost = makeRawPost();
    const pristineRawPost = makeRawPost();

    const [firstPass] = capturedConfig.transform([cachedRawPost]);
    expect(cachedRawPost).toStrictEqual(pristineRawPost);

    const [secondPass] = capturedConfig.transform([cachedRawPost]);
    expect(secondPass).toStrictEqual(firstPass);
  });
});
