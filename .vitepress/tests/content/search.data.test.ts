import { describe, it, expect, vi, afterEach } from "vitest";
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

describe("transformSearchData date handling", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("sorts a post with an unparseable date last and warns instead of scrambling order", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const goodPost = makeRawPostWithTags([]);
    const badDatePost = {
      ...makeRawPostWithTags([]),
      url: "/.vitepress/content/posts/bad-date-post",
      frontmatter: { ...DEFAULT_FRONTMATTER, date: "not-a-date", tags: [] },
    } as ContentData;

    // Bad-date post is passed first to prove it is actively re-sorted last,
    // not merely left where it started.
    const sorted = transformSearchData([badDatePost, goodPost]);

    expect(sorted.map((item) => item.href)).toEqual([
      "/posts/example-post",
      "/posts/bad-date-post",
    ]);
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining("unparseable date"),
    );
  });

  it("does not render 'Invalid Date' into desc when the frontmatter date is unparseable", () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    const badDatePost = {
      ...makeRawPostWithTags([]),
      frontmatter: { ...DEFAULT_FRONTMATTER, date: "not-a-date", tags: [] },
    } as ContentData;

    const [item] = transformSearchData([badDatePost]);

    expect(item.desc).not.toContain("Invalid Date");
    expect(item.desc).toBe("development");
  });

  it("renders the formatted date into desc when the frontmatter date is valid", () => {
    const [item] = transformSearchData([makeRawPostWithTags([])]);

    expect(item.desc).toBe("development · Jan 1, 2025");
  });

  it("treats a null frontmatter date as unparseable rather than rendering the epoch", () => {
    // `new Date(null).getTime()` is 0, not NaN — a bare `date:` YAML key
    // (which parses to `null`) must not silently sort as the epoch and
    // format as "Jan 1, 1970".
    vi.spyOn(console, "warn").mockImplementation(() => {});
    const nullDatePost = {
      ...makeRawPostWithTags([]),
      frontmatter: { ...DEFAULT_FRONTMATTER, date: null, tags: [] },
    } as ContentData;

    const [item] = transformSearchData([nullDatePost]);

    expect(item.desc).toBe("development");
    expect(item.desc).not.toContain("1970");
  });
});
