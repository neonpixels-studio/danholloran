import { describe, it, expect } from "vitest";
import type { Post } from "@typedefs";
import {
  buildArchiveView,
  buildHomePosts,
  findPostNeighbors,
} from "@utils/postViews";
import { FIRST_PAGE_SIZE, REST_PAGE_SIZE } from "@utils/archive";

function buildPost(
  index: number,
  overrides: Partial<Post["frontmatter"]> = {},
): Post {
  return {
    url: `/posts/post-${index}`,
    dateIsValid: true,
    frontmatter: {
      title: `Post ${index}`,
      slug: `post-${index}`,
      image: `/images/posts/post-${index}.jpg`,
      draft: false,
      topic: "development",
      date: "2025-01-01T00:00:00.000Z",
      description: `Description ${index}.`,
      tags: ["css"],
      readTime: 5,
      ...overrides,
    },
  };
}

function buildPosts(count: number): Post[] {
  return Array.from({ length: count }, (_unused, index) => buildPost(index));
}

function slugs(posts: Post[]): string[] {
  return posts.map((post) => post.frontmatter.slug);
}

describe("buildArchiveView", () => {
  it("slices the first page and counts pages across the whole archive", () => {
    const view = buildArchiveView(buildPosts(21));

    expect(view.posts).toHaveLength(FIRST_PAGE_SIZE);
    expect(view.posts[0].frontmatter.slug).toBe("post-0");
    expect(view.totalPages).toBe(3);
  });

  it("slices a later page from its route param", () => {
    const view = buildArchiveView(buildPosts(21), { page: "2" });

    expect(view.posts).toHaveLength(REST_PAGE_SIZE);
    expect(view.posts[0].frontmatter.slug).toBe(`post-${FIRST_PAGE_SIZE}`);
  });

  it("falls back to page 1 for a malformed page param", () => {
    const view = buildArchiveView(buildPosts(21), { page: "nope" });

    expect(view.posts[0].frontmatter.slug).toBe("post-0");
  });

  it("filters by topic slug, matching labels that slug the same", () => {
    const posts = [
      buildPost(0, { topic: "Development" }),
      buildPost(1, { topic: "travel" }),
      buildPost(2, { topic: "development" }),
    ];
    const view = buildArchiveView(posts, { topic: "development" });

    expect(slugs(view.posts)).toEqual(["post-0", "post-2"]);
    expect(view.totalPages).toBe(1);
  });

  it("filters by tag slug", () => {
    const posts = [
      buildPost(0, { tags: ["React.js"] }),
      buildPost(1, { tags: ["css"] }),
    ];
    const view = buildArchiveView(posts, { tag: "react-js" });

    expect(slugs(view.posts)).toEqual(["post-0"]);
  });

  it("treats the 'all' sentinel as no filter", () => {
    const posts = [
      buildPost(0, { topic: "travel" }),
      buildPost(1, { topic: "development" }),
    ];
    const view = buildArchiveView(posts, { topic: "all", tag: "all" });

    expect(view.posts).toHaveLength(2);
  });

  it("lists every topic from the whole archive, de-duped and sorted, even on a filtered page", () => {
    const posts = [
      buildPost(0, { topic: "travel" }),
      buildPost(1, { topic: "Development" }),
      buildPost(2, { topic: "development" }),
      buildPost(3, { topic: "→" }),
    ];
    const view = buildArchiveView(posts, { topic: "travel" });

    expect(view.topics).toEqual([
      { slug: "development", label: "Development" },
      { slug: "travel", label: "travel" },
    ]);
  });
});

describe("findPostNeighbors", () => {
  const posts = buildPosts(3);

  it("links a mid-list post to its older and newer neighbors", () => {
    const neighbors = findPostNeighbors(posts, "post-1");

    expect(neighbors?.post.frontmatter.slug).toBe("post-1");
    expect(neighbors?.prevPost?.frontmatter.slug).toBe("post-2");
    expect(neighbors?.nextPost?.frontmatter.slug).toBe("post-0");
  });

  it("has no newer post for the newest post and no older post for the oldest", () => {
    expect(findPostNeighbors(posts, "post-0")?.nextPost).toBeNull();
    expect(findPostNeighbors(posts, "post-2")?.prevPost).toBeNull();
  });

  it("returns null for a slug with no published post", () => {
    expect(findPostNeighbors(posts, "missing")).toBeNull();
  });
});

describe("buildHomePosts", () => {
  it("keeps only the posts home renders: one featured plus eight recent", () => {
    const home = buildHomePosts(buildPosts(20));

    expect(slugs(home.latestPosts)).toEqual(slugs(buildPosts(9)));
  });

  it("counts only posts tagged national-park", () => {
    const posts = [
      buildPost(0, { tags: ["national-park", "travel"] }),
      buildPost(1, { tags: ["national-park"] }),
      buildPost(2, { tags: ["travel"] }),
      buildPost(3, { tags: [] }),
    ];

    expect(buildHomePosts(posts).nationalParkCount).toBe(2);
  });
});
