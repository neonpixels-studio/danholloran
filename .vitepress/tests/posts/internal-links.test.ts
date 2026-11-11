import { afterAll, beforeAll, describe, it, expect } from "vitest";
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import {
  extractInternalLinks,
  isResolvableLink,
  parseRedirectRules,
  type RouteTable,
} from "../../theme/utils/internalLinks";
import {
  loadPublishedPosts,
  type PublishedPost,
} from "../../theme/utils/loadPublishedPosts";
import {
  tagBasePagePaths,
  tagExtraPagePaths,
  topicBasePagePaths,
  topicExtraPagePaths,
} from "../../theme/utils/archivePaths";

const ROOT = process.cwd();
const REDIRECTS_PATH = resolve(ROOT, "public/_redirects");

function archiveRoutes(
  entries: { params: Record<string, string> }[],
  kind: "topic" | "tag",
): string[] {
  return entries.map((entry) => {
    const { page } = entry.params;
    const base = `/posts/${kind}/${entry.params[kind]}`;
    return page === "1" ? base : `${base}/page/${page}`;
  });
}

function buildRouteTable(posts: PublishedPost[]): RouteTable {
  const routes = new Set<string>([
    "/posts",
    ...posts.map((post) => `/posts/${post.slug}`),
    ...archiveRoutes(topicBasePagePaths(), "topic"),
    ...archiveRoutes(topicExtraPagePaths(), "topic"),
    ...archiveRoutes(tagBasePagePaths(), "tag"),
    ...archiveRoutes(tagExtraPagePaths(), "tag"),
  ]);
  return {
    routes,
    redirects: parseRedirectRules(readFileSync(REDIRECTS_PATH, "utf-8")),
    publicDir: resolve(ROOT, "public"),
    pageDir: ROOT,
  };
}

const TABLE: RouteTable = {
  routes: new Set(["/posts", "/posts/real", "/posts/topic/ai"]),
  redirects: [
    { from: "/old", to: "/posts/real", status: 301 },
    { from: "/blog/*", to: "/posts/:splat", status: 301 },
    { from: "/legacy/:name", to: "/posts/:name", status: 301 },
    { from: "/a.b", to: "/posts/real", status: 301 },
    { from: "/away", to: "https://example.com/", status: 301 },
    { from: "/loop", to: "/loop", status: 301 },
    { from: "/typo/*", to: "/posts/:slpat", status: 301 },
    { from: "/abs", to: "https://danholloran.me/posts/gone", status: 301 },
    { from: "/gone/*", to: "/posts/real", status: 410 },
  ],
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

describe("extractInternalLinks edge cases", () => {
  it("finds reference definitions and single-quoted titles", () => {
    const markdown = "[a][ref]\n\n[ref]: /posts/ref\n[b](/posts/b 'Title')";
    expect(extractInternalLinks(markdown).map((link) => link.href)).toEqual([
      "/posts/ref",
      "/posts/b",
    ]);
  });

  it("accepts http and www variants of the site origin and a bare origin", () => {
    const markdown =
      "[a](http://danholloran.me/posts/a) [b](https://www.danholloran.me/posts/b) [c](https://danholloran.me)";
    expect(extractInternalLinks(markdown).map((link) => link.href)).toEqual([
      "/posts/a",
      "/posts/b",
      "/",
    ]);
  });

  it("keeps a fence open past a shorter inner fence and honours tilde fences", () => {
    const markdown = "````md\n```\n[a](/x)\n````\n~~~\n[b](/y)\n~~~\n[c](/z)";
    expect(extractInternalLinks(markdown)).toEqual([{ line: 8, href: "/z" }]);
  });
});

describe("parseRedirectRules", () => {
  it("skips comments and blank lines and reads from/to", () => {
    const source = "# note\n\n/a /b 301!\r\n/c/* /d/:splat 301";
    expect(parseRedirectRules(source)).toEqual([
      { from: "/a", to: "/b", status: 301 },
      { from: "/c/*", to: "/d/:splat", status: 301 },
    ]);
  });

  it("reads the status and skips query-condition tokens", () => {
    expect(
      parseRedirectRules("/s id=:id /b/:id 302\n/* /404.html 404!"),
    ).toEqual([
      { from: "/s", to: "/b/:id", status: 302 },
      { from: "/*", to: "/404.html", status: 404 },
    ]);
  });
});

describe("isResolvableLink static targets", () => {
  let root = "";
  let table: RouteTable;

  beforeAll(() => {
    root = mkdtempSync(resolve(tmpdir(), "internal-links-"));
    const publicDir = resolve(root, "public");
    const pageDir = resolve(root, "pages");
    mkdirSync(resolve(pageDir, "section"), { recursive: true });
    mkdirSync(publicDir);
    writeFileSync(resolve(publicDir, "my doc.pdf"), "");
    writeFileSync(resolve(pageDir, "about.md"), "");
    writeFileSync(resolve(root, "outside.md"), "");
    writeFileSync(resolve(pageDir, "section/index.md"), "");
    table = { routes: new Set(), redirects: [], publicDir, pageDir };
  });

  afterAll(() => {
    rmSync(root, { recursive: true, force: true });
  });

  it.each(["/my%20doc.pdf", "/about", "/section/"])("accepts %s", (href) => {
    expect(isResolvableLink(href, table)).toBe(true);
  });

  it.each(["/missing.pdf", "/../outside", "/%E0%A4%A"])(
    "rejects %s",
    (href) => {
      expect(isResolvableLink(href, table)).toBe(false);
    },
  );
});

describe("isResolvableLink", () => {
  it.each([
    "/posts/real",
    "/posts/real/",
    "/posts/real#anchor",
    "/posts/",
    "/posts/topic/ai/",
    "/old",
    "/blog/real",
    "/away",
    "/legacy/real",
  ])("accepts %s", (href) => {
    expect(isResolvableLink(href, TABLE)).toBe(true);
  });

  it.each([
    "/posts/missing",
    "/posts/topic/nope",
    "/posts/real/extra",
    "/blog/deleted",
    "/legacy/deleted",
    "/axb",
    "/loop",
    "/typo/real",
    "/abs",
    "/gone/x",
  ])("rejects %s", (href) => {
    expect(isResolvableLink(href, TABLE)).toBe(false);
  });
});

describe("internal links in published posts", () => {
  it("all resolve to a real post, topic/tag page, redirect or static file", () => {
    const posts = loadPublishedPosts();
    const table = buildRouteTable(posts);
    const broken = posts.flatMap((post) =>
      extractInternalLinks(post.body)
        .filter((link) => !isResolvableLink(link.href, table))
        .map(
          (link) => `${post.slug}.md (body line ${link.line}) -> ${link.href}`,
        ),
    );
    expect(broken, `Broken internal links:\n${broken.join("\n")}`).toEqual([]);
  });
});
