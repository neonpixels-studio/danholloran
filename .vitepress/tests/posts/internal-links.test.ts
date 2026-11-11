import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  extractInternalLinks,
  isResolvableLink,
  parseRedirectSources,
  type RouteTable,
} from "../../theme/utils/internalLinks";
import { loadPublishedPosts } from "../../theme/utils/loadPublishedPosts";
import {
  tagBasePagePaths,
  tagExtraPagePaths,
  topicBasePagePaths,
  topicExtraPagePaths,
} from "../../theme/utils/archivePaths";

const ROOT = process.cwd();
const REDIRECTS_PATH = resolve(ROOT, "public/_redirects");

function filterRoutes(
  entries: { params: Record<string, string> }[],
  kind: "topic" | "tag",
): string[] {
  return entries.map((entry) => {
    const { page } = entry.params;
    const base = `/posts/${kind}/${entry.params[kind]}`;
    return page === "1" ? base : `${base}/page/${page}`;
  });
}

function buildRouteTable(): RouteTable {
  const posts = loadPublishedPosts();
  const routes = new Set<string>([
    "/posts",
    ...posts.map((post) => `/posts/${post.slug}`),
    ...filterRoutes(topicBasePagePaths(), "topic"),
    ...filterRoutes(topicExtraPagePaths(), "topic"),
    ...filterRoutes(tagBasePagePaths(), "tag"),
    ...filterRoutes(tagExtraPagePaths(), "tag"),
  ]);
  return {
    routes,
    redirectSources: parseRedirectSources(
      readFileSync(REDIRECTS_PATH, "utf-8"),
    ),
    publicDir: resolve(ROOT, "public"),
    pageDir: ROOT,
  };
}

const TABLE: RouteTable = {
  routes: new Set(["/posts", "/posts/real", "/posts/topic/ai"]),
  redirectSources: ["/old", "/blog/*", "/legacy/:name"],
  publicDir: "/nonexistent/public",
  pageDir: "/nonexistent/pages",
};

describe("extractInternalLinks", () => {
  it("finds markdown and html links with their line numbers", () => {
    const markdown = 'a [x](/posts/a)\n\n<a href="/posts/b/">b</a>';
    expect(extractInternalLinks(markdown)).toEqual([
      { line: 1, href: "/posts/a" },
      { line: 3, href: "/posts/b/" },
    ]);
  });

  it("treats same-site absolute URLs as internal and ignores external ones", () => {
    const markdown =
      "[a](https://danholloran.me/posts/a) [b](https://example.com/posts/b) [c](//cdn.example.com/x)";
    expect(extractInternalLinks(markdown)).toEqual([
      { line: 1, href: "/posts/a" },
    ]);
  });

  it("ignores images, fenced code and inline code", () => {
    const markdown =
      "![alt](/images/a.png)\n`[x](/posts/inline)`\n```md\n[y](/posts/fenced)\n```\n[z](/posts/kept)";
    expect(extractInternalLinks(markdown)).toEqual([
      { line: 6, href: "/posts/kept" },
    ]);
  });

  it("still finds the link wrapping an image", () => {
    expect(extractInternalLinks("[![alt](/a.png)](/posts/wrap)")).toEqual([
      { line: 1, href: "/posts/wrap" },
    ]);
  });

  it("keeps anchors and a link title out of the href", () => {
    expect(extractInternalLinks('[a](/posts/a#top "Title")')).toEqual([
      { line: 1, href: "/posts/a#top" },
    ]);
  });
});

describe("isResolvableLink", () => {
  it.each([
    "/posts/real",
    "/posts/real/",
    "/posts/real#anchor",
    "/posts/",
    "/posts/topic/ai/",
    "/old",
    "/blog/anything/here",
    "/legacy/some-name",
  ])("accepts %s", (href) => {
    expect(isResolvableLink(href, TABLE)).toBe(true);
  });

  it.each(["/posts/missing", "/posts/topic/nope", "/posts/real/extra"])(
    "rejects %s",
    (href) => {
      expect(isResolvableLink(href, TABLE)).toBe(false);
    },
  );
});

describe("internal links in published posts", () => {
  it("all resolve to a real post, topic/tag page, redirect or static file", () => {
    const table = buildRouteTable();
    const broken = loadPublishedPosts().flatMap((post) =>
      extractInternalLinks(post.body)
        .filter((link) => !isResolvableLink(link.href, table))
        .map(
          (link) => `${post.slug}.md (body line ${link.line}) -> ${link.href}`,
        ),
    );
    expect(broken, `Broken internal links:\n${broken.join("\n")}`).toEqual([]);
  });
});
