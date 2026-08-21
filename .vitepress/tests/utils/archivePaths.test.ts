import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@utils/loadPublishedPosts", () => ({
  loadPublishedPosts: vi.fn(),
}));

import { loadPublishedPosts } from "@utils/loadPublishedPosts";
import {
  allExtraPagePaths,
  topicBasePagePaths,
  topicExtraPagePaths,
  tagBasePagePaths,
  tagExtraPagePaths,
} from "@utils/archivePaths";

const mockLoad = vi.mocked(loadPublishedPosts);

function makePosts(specs: Array<{ topic: string; tags: string[] }>) {
  return specs.map((spec, index) => ({
    slug: `post-${index}`,
    body: "",
    sortTime: index,
    topic: spec.topic,
    tags: spec.tags,
  }));
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("allExtraPagePaths", () => {
  it("emits only pages 2..N of the unfiltered archive", () => {
    mockLoad.mockReturnValue(
      makePosts(
        Array.from({ length: 21 }, () => ({ topic: "development", tags: [] })),
      ) as any,
    );
    expect(allExtraPagePaths()).toEqual([
      { params: { page: "2" } },
      { params: { page: "3" } },
    ]);
  });

  it("emits nothing when every post fits on page 1", () => {
    mockLoad.mockReturnValue(
      makePosts([{ topic: "development", tags: [] }]) as any,
    );
    expect(allExtraPagePaths()).toEqual([]);
  });
});

describe("topic paths", () => {
  beforeEach(() => {
    mockLoad.mockReturnValue(
      makePosts([
        { topic: "development", tags: [] },
        { topic: "development", tags: [] },
        { topic: "Travel", tags: [] },
      ]) as any,
    );
  });

  it("emits one base route per topic with slug, label, and page 1", () => {
    expect(topicBasePagePaths()).toEqual([
      {
        params: { topic: "development", topicLabel: "development", page: "1" },
      },
      { params: { topic: "travel", topicLabel: "Travel", page: "1" } },
    ]);
  });

  it("emits no extra pages when each topic fits on page 1", () => {
    expect(topicExtraPagePaths()).toEqual([]);
  });

  it("collapses topics that collide on slug to one deterministic bucket", () => {
    mockLoad.mockReturnValue(
      makePosts([
        { topic: "travel", tags: [] },
        { topic: "Travel", tags: [] },
      ]) as any,
    );
    const base = topicBasePagePaths();
    expect(base).toHaveLength(1);
    // Lexicographically smallest label wins ("Travel" < "travel").
    expect(base[0].params).toEqual({
      topic: "travel",
      topicLabel: "Travel",
      page: "1",
    });
  });

  it("paginates a topic that overflows the first page", () => {
    mockLoad.mockReturnValue(
      makePosts(
        Array.from({ length: 12 }, () => ({ topic: "development", tags: [] })),
      ) as any,
    );
    expect(topicExtraPagePaths()).toEqual([
      {
        params: { topic: "development", topicLabel: "development", page: "2" },
      },
    ]);
  });
});

describe("tag paths", () => {
  it("buckets posts by tag slug and counts distinct posts", () => {
    mockLoad.mockReturnValue(
      makePosts([
        { topic: "development", tags: ["tailwind.css"] },
        { topic: "development", tags: ["tailwind-css"] },
        { topic: "development", tags: ["react"] },
      ]) as any,
    );
    const base = tagBasePagePaths();
    const slugs = base.map((entry) => entry.params.tag);
    expect(slugs).toContain("tailwind-css");
    expect(slugs).toContain("react");
    // The two tailwind labels collapse to a single slug bucket.
    expect(slugs.filter((slug) => slug === "tailwind-css")).toHaveLength(1);
    // Deterministic representative label (lexicographically smallest) so the
    // page title never flips with post order.
    const tailwind = base.find((entry) => entry.params.tag === "tailwind-css");
    expect(tailwind?.params.tagLabel).toBe("tailwind-css");
  });

  it("skips tags whose label has no routable slug", () => {
    mockLoad.mockReturnValue(
      makePosts([{ topic: "development", tags: ["→", "react"] }]) as any,
    );
    const slugs = tagBasePagePaths().map((entry) => entry.params.tag);
    expect(slugs).toEqual(["react"]);
  });

  it("paginates a tag that overflows the first page", () => {
    mockLoad.mockReturnValue(
      makePosts(
        Array.from({ length: 11 }, () => ({
          topic: "development",
          tags: ["javascript"],
        })),
      ) as any,
    );
    expect(tagExtraPagePaths()).toEqual([
      { params: { tag: "javascript", tagLabel: "javascript", page: "2" } },
    ]);
  });
});
