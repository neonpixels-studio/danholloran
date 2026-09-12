import { describe, it, expect } from "vitest";
import type { ContentData } from "vitepress";
import {
  INSTAGRAM_GLOB,
  transformInstagram,
} from "../../content/instagram/transformInstagram.ts";

function makeRawInstagramPost(
  overrides: Record<string, unknown> = {},
  frontmatterOverrides: Record<string, unknown> = {},
): ContentData {
  return {
    url: "/.vitepress/content/instagram/example-post",
    src: undefined,
    html: undefined,
    excerpt: undefined,
    frontmatter: {
      created_at: "2025-01-01T00:00:00.000Z",
      caption: "A great photo",
      tags: ["nature"],
      location: "Yosemite",
      images: ["/images/instagram/example-post.jpg"],
      url: "https://www.instagram.com/p/example000/",
      ...frontmatterOverrides,
    },
    ...overrides,
  } as ContentData;
}

describe("transformInstagram", () => {
  it("targets every markdown file in the instagram content folder", () => {
    // Pins the literal so a typo in INSTAGRAM_GLOB (which the loader tests
    // only compare against itself) fails a test rather than silently
    // emptying the Instagram strip.
    expect(INSTAGRAM_GLOB).toBe(".vitepress/content/instagram/*.md");
  });

  it("projects only the frontmatter fields HomeInstagram reads", () => {
    const [tile] = transformInstagram([makeRawInstagramPost()]);

    expect(tile.frontmatter).toEqual({
      created_at: "2025-01-01T00:00:00.000Z",
      caption: "A great photo",
      location: "Yosemite",
      images: ["/images/instagram/example-post.jpg"],
      url: "https://www.instagram.com/p/example000/",
    });
  });

  it("drops the loader-generated top-level page url, which HomeInstagram never reads", () => {
    const [tile] = transformInstagram([makeRawInstagramPost()]);

    expect(tile).not.toHaveProperty("url");
  });

  it("sorts posts by created_at, newest first", () => {
    const olderPost = makeRawInstagramPost(
      { url: "/.vitepress/content/instagram/older-post" },
      { created_at: "2024-01-01T00:00:00.000Z", url: "older" },
    );
    const newerPost = makeRawInstagramPost(
      { url: "/.vitepress/content/instagram/newer-post" },
      { created_at: "2025-06-01T00:00:00.000Z", url: "newer" },
    );

    const sorted = transformInstagram([olderPost, newerPost]);

    expect(sorted.map((tile) => tile.frontmatter.url)).toEqual([
      "newer",
      "older",
    ]);
  });

  it("slices to the six newest posts, so the rest never leave the loader", () => {
    const posts = Array.from({ length: 20 }, (_unused, index) =>
      makeRawInstagramPost(
        { url: `/.vitepress/content/instagram/post-${index}` },
        {
          created_at: new Date(2025, 0, index + 1).toISOString(),
          url: `post-${index}`,
        },
      ),
    );

    const tiles = transformInstagram(posts);

    expect(tiles).toHaveLength(6);
    // Newest six (highest index, since date increases with index) survive.
    expect(tiles.map((tile) => tile.frontmatter.url)).toEqual([
      "post-19",
      "post-18",
      "post-17",
      "post-16",
      "post-15",
      "post-14",
    ]);
  });

  it.each([
    ["missing", undefined],
    ["malformed", "not-a-date"],
  ])(
    "sorts a post with a %s created_at last instead of leaving it in place",
    (_label, createdAt) => {
      // NaN from `new Date(createdAt).getTime()` makes every comparison
      // against this post return 0 ("equal" to Array.prototype.sort), which
      // would leave it wherever the glob happened to list it rather than
      // actually sorting it last. Placing it first in the input, ahead of
      // both dated posts, proves it is actively re-sorted rather than
      // merely never moved.
      const undatedPost = makeRawInstagramPost(
        { url: "/.vitepress/content/instagram/undated-post" },
        { created_at: createdAt, url: "undated" },
      );
      const olderPost = makeRawInstagramPost(
        { url: "/.vitepress/content/instagram/older-post" },
        { created_at: "2024-01-01T00:00:00.000Z", url: "older" },
      );
      const newerPost = makeRawInstagramPost(
        { url: "/.vitepress/content/instagram/newer-post" },
        { created_at: "2025-06-01T00:00:00.000Z", url: "newer" },
      );

      const sorted = transformInstagram([undatedPost, olderPost, newerPost]);

      expect(sorted.map((tile) => tile.frontmatter.url)).toEqual([
        "newer",
        "older",
        "undated",
      ]);
    },
  );
});
