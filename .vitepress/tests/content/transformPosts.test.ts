import { describe, it, expect, vi, afterEach } from "vitest";
import type { ContentData } from "vitepress";
import {
  POSTS_GLOB,
  transformPosts,
} from "../../content/posts/transformPosts.ts";

function makeRawPost(overrides: Record<string, unknown> = {}): ContentData {
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
  } as ContentData;
}

describe("transformPosts", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("targets every markdown file in the posts content folder", () => {
    // Pins the literal so a typo in POSTS_GLOB (which the loader tests only
    // compare against itself) fails a test rather than silently emptying the
    // site.
    expect(POSTS_GLOB).toBe(".vitepress/content/posts/*.md");
  });

  it("returns frontmatter, url, slug, and readTime for each post", () => {
    const [post] = transformPosts([makeRawPost()]);

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

  it("passes an array of tags through unchanged", () => {
    const [post] = transformPosts([makeRawPost()]);

    expect(post.frontmatter.tags).toEqual(["javascript"]);
  });

  it("normalizes non-array tags to an empty array at the chokepoint", () => {
    // The fixture's frontmatter carries a scalar where a list is expected;
    // every downstream consumer relies on transformPosts guaranteeing an array
    // so it no longer has to guard the shape itself.
    const scalarTagsPost = makeRawPost({
      frontmatter: { ...makeRawPost().frontmatter, tags: "javascript" },
    });

    const [post] = transformPosts([scalarTagsPost]);

    expect(post.frontmatter.tags).toEqual([]);
  });

  it("normalizes missing tags to an empty array at the chokepoint", () => {
    const untaggedPost = makeRawPost({
      frontmatter: { ...makeRawPost().frontmatter, tags: undefined },
    });

    const [post] = transformPosts([untaggedPost]);

    expect(post.frontmatter.tags).toEqual([]);
  });

  it("drops src and excerpt from every post", () => {
    const [post] = transformPosts([makeRawPost()]);

    expect(post).not.toHaveProperty("src");
    expect(post).not.toHaveProperty("excerpt");
  });

  it("keeps rendered html when the raw post carries it (detail loader path)", () => {
    const [post] = transformPosts([makeRawPost()]);

    expect(post.html).toBe("<p>Rendered content</p>");
  });

  it("omits html when the raw post has none (render:false list loader path)", () => {
    // The list loader runs with render:false, so VitePress never attaches an
    // `html` key to the raw data it hands the transform. This proves the list
    // payload ships no rendered post html.
    const rawWithoutHtml = makeRawPost();
    delete (rawWithoutHtml as unknown as Record<string, unknown>).html;

    const [post] = transformPosts([rawWithoutHtml]);

    expect(post).not.toHaveProperty("html");
  });

  it("filters out draft posts", () => {
    const draftPost = makeRawPost({
      frontmatter: { ...makeRawPost().frontmatter, draft: true },
    });

    expect(transformPosts([draftPost])).toHaveLength(0);
  });

  it("derives the slug from a url that already omits the content-folder prefix", () => {
    const [post] = transformPosts([
      makeRawPost({ url: "/posts/example-post" }),
    ]);

    expect(post.frontmatter.slug).toBe("example-post");
    expect(post.url).toBe("/posts/example-post");
  });

  it("falls back to the minimum readTime when src is absent", () => {
    const [post] = transformPosts([makeRawPost({ src: undefined })]);

    expect(post.frontmatter.readTime).toBe(1);
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

    const sorted = transformPosts([olderPost, newerPost]);

    expect(sorted.map((post) => post.frontmatter.slug)).toEqual([
      "newer-post",
      "older-post",
    ]);
  });

  it("sorts a post with an unparseable date last and warns instead of scrambling order", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const goodPost = makeRawPost({
      url: "/.vitepress/content/posts/good-post",
      frontmatter: {
        ...makeRawPost().frontmatter,
        date: "2025-01-01T00:00:00.000Z",
      },
    });
    const badDatePost = makeRawPost({
      url: "/.vitepress/content/posts/bad-date-post",
      frontmatter: { ...makeRawPost().frontmatter, date: "not-a-date" },
    });

    // Bad-date post is passed first to prove it is actively re-sorted last,
    // not merely left where it started.
    const sorted = transformPosts([badDatePost, goodPost]);

    expect(sorted.map((post) => post.frontmatter.slug)).toEqual([
      "good-post",
      "bad-date-post",
    ]);
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining("unparseable date"),
    );
  });

  it("treats a missing date as unparseable and sorts it last", () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    const datedPost = makeRawPost({
      url: "/.vitepress/content/posts/dated-post",
      frontmatter: {
        ...makeRawPost().frontmatter,
        date: "2025-01-01T00:00:00.000Z",
      },
    });
    const undatedPost = makeRawPost({
      url: "/.vitepress/content/posts/undated-post",
      frontmatter: { ...makeRawPost().frontmatter, date: undefined },
    });

    const sorted = transformPosts([undatedPost, datedPost]);

    expect(sorted.map((post) => post.frontmatter.slug)).toEqual([
      "dated-post",
      "undated-post",
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

    const [firstPass] = transformPosts([cachedRawPost]);
    expect(cachedRawPost).toStrictEqual(pristineRawPost);

    const [secondPass] = transformPosts([cachedRawPost]);
    expect(secondPass).toStrictEqual(firstPass);
  });
});
