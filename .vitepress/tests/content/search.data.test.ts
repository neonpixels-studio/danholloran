import { describe, it, expect, vi } from "vitest";
import type { ContentData } from "vitepress";
import type { PostSearchItem } from "@typedefs";
import { transformSearchData } from "../../content/posts/search.data.ts";
import { POSTS_GLOB } from "../../content/posts/transformPosts.ts";

// createContentLoader is provided by vitepress at build time and throws
// outside an active vitepress process (see posts.data.test.ts for the same
// pattern); capture the pattern/config it's handed so the wiring itself can
// be asserted. Behavior is exercised by calling the exported transform
// directly, matching how transformPosts.test.ts tests transformPosts.
// `var`, not `let`: the mocked `createContentLoader` below runs as a side
// effect of the static `transformSearchData` import above (search.data.ts
// calls createContentLoader at module scope), which executes before a
// hoisted-but-not-yet-initialized `let` binding would be reachable.
var capturedPattern: string;
var capturedConfig: { transform: (_data: ContentData[]) => PostSearchItem[] };

vi.mock("vitepress", () => ({
  createContentLoader: (pattern: string, config: typeof capturedConfig) => {
    capturedPattern = pattern;
    capturedConfig = config;
    return { watch: [], load: () => [] };
  },
}));

const DEFAULT_FRONTMATTER = {
  title: "Example Post",
  draft: false,
  topic: "development",
  date: "2025-01-01T00:00:00.000Z",
  description: "An example post.",
};

// Every case here only varies `tags`; hoisting the rest of the frontmatter
// keeps each test focused on the one thing it's proving.
function makeRawPostWithTags(tags: unknown): ContentData {
  return {
    url: "/.vitepress/content/posts/example-post",
    src: undefined,
    html: undefined,
    excerpt: undefined,
    frontmatter: { ...DEFAULT_FRONTMATTER, tags },
  } as ContentData;
}

describe("search.data.ts list loader", () => {
  it("registers the shared posts glob and transformSearchData with createContentLoader", () => {
    expect(capturedPattern).toBe(POSTS_GLOB);
    expect(capturedConfig.transform).toBe(transformSearchData);
  });
});

describe("transformSearchData", () => {
  it("derives the slug-based href from the content loader url", () => {
    const [item] = transformSearchData([makeRawPostWithTags(["js"])]);

    expect(item.href).toBe("/posts/example-post");
  });

  it("does not strip a url that merely resembles the content-folder prefix", () => {
    // Pins the escaped dot in the slug-derivation regex: `.` is a wildcard,
    // so an unescaped version would also match "/xvitepress/content/posts/"
    // and strip it down to "example-post" — the same href as a real post at
    // the actual content-folder path, a silent collision.
    const rawPost = {
      url: "/xvitepress/content/posts/example-post",
      src: undefined,
      html: undefined,
      excerpt: undefined,
      frontmatter: { ...DEFAULT_FRONTMATTER, tags: [] },
    } as ContentData;

    const [item] = transformSearchData([rawPost]);

    expect(item.href).not.toBe("/posts/example-post");
  });

  it("joins array tags into the keyword string", () => {
    const [item] = transformSearchData([makeRawPostWithTags(["js", "css"])]);

    expect(item.kw).toBe("An example post. development js css");
  });

  it("drops a scalar string tag instead of exploding it into characters", () => {
    // A naive `...tags` spread of the string "javascript" would splice in
    // "j", "a", "v", ... as single-character keywords; normalizeTags guards
    // the container shape so none of that leaks into the index.
    const [item] = transformSearchData([makeRawPostWithTags("javascript")]);

    expect(item.kw).toBe("An example post. development");
  });

  it("drops the tag when frontmatter tags is a number", () => {
    const [item] = transformSearchData([makeRawPostWithTags(2025)]);

    expect(item.kw).toBe("An example post. development");
  });

  it("handles missing tags gracefully", () => {
    const [item] = transformSearchData([makeRawPostWithTags(undefined)]);

    expect(item.kw).toBe("An example post. development");
  });

  it("handles a bare null tags key gracefully", () => {
    // Frontmatter YAML with a bare `tags:` key (no value) parses to `null`,
    // distinct from the key being absent entirely.
    const [item] = transformSearchData([makeRawPostWithTags(null)]);

    expect(item.kw).toBe("An example post. development");
  });

  it("keeps only the string entries when a tags array mixes types", () => {
    const [item] = transformSearchData([makeRawPostWithTags(["js", 3, null])]);

    expect(item.kw).toBe("An example post. development js");
  });
});
