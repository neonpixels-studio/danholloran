import { existsSync, statSync } from "fs";
import { execFileSync } from "child_process";
import { join } from "path";
import type { UserConfig } from "vitepress";
import {
  loadPublishedPosts,
  hasUsableDate,
  type PublishedPost,
} from "./loadPublishedPosts";

// vitepress doesn't export `SitemapItem` directly; derive it from the public
// `sitemap.transformItems` config type so this stays in sync with vitepress's
// own definition instead of hand-duplicating it.
type SitemapTransformItems = NonNullable<
  NonNullable<UserConfig["sitemap"]>["transformItems"]
>;
type SitemapItem = Parameters<SitemapTransformItems>[0][number];

// Post source files live here, not at a route-shaped path: `/posts/<slug>` is
// served by the dynamic `posts/[slug].md` route, so `fileEntry` (which probes
// `<cwd>/posts/<slug>.md`) never finds them. The mtime fall-through therefore
// has to resolve against the real content file directly.
const POSTS_CONTENT_DIR = join(process.cwd(), ".vitepress/content/posts");

function indexBySlug(posts: PublishedPost[]): Map<string, PublishedPost> {
  const bySlug = new Map<string, PublishedPost>();
  for (const post of posts) {
    bySlug.set(post.slug, post);
  }
  return bySlug;
}

// Post pages carry their published date as lastmod. A published post with a
// usable date uses that date; anything else (a draft, an undated post, or one
// with a date the shared loader warned about rather than threw on) falls back
// to the source file's mtime. That mtime is a meaningful "last changed" signal
// when the working tree is preserved between builds; on a fresh CI clone git
// doesn't restore mtimes, so it degrades to checkout time (a git-log-derived
// date would be the fully robust fix — see follow-up).
// Returns null only when the URL isn't a post or no source file backs it, so
// the caller can fall through to its own handling.
function postLastmod(
  url: string,
  publishedBySlug: Map<string, PublishedPost>,
): Date | null {
  const postSlug = url.match(/^posts\/(.+)$/)?.[1];
  if (!postSlug) {
    return null;
  }

  const post = publishedBySlug.get(postSlug);
  if (post && hasUsableDate(post)) {
    return new Date(post.sortTime);
  }

  const contentPath = join(POSTS_CONTENT_DIR, `${postSlug}.md`);
  if (existsSync(contentPath)) {
    return statSync(contentPath).mtime;
  }

  return null;
}

// The real last-content-change date for a source file: the author date of its
// most recent commit. File mtime is unreliable as a freshness signal — on a
// fresh CI clone git doesn't restore mtimes, so every static page degrades to
// checkout (build) time and signals false freshness on every deploy. Returns
// null for an untracked file or when git isn't available, so the caller falls
// back to mtime.
function gitLastModified(filePath: string): Date | null {
  try {
    const iso = execFileSync(
      "git",
      ["log", "-1", "--format=%cI", "--", filePath],
      { cwd: process.cwd(), encoding: "utf-8" },
    ).trim();
    return iso ? new Date(iso) : null;
  } catch {
    return null;
  }
}

// Resolves a stripped URL to the source file that backs it, returning the final
// URL and its last-modified date, or null when no source file is found.
// Prefers the git commit date over mtime so a rebuild of an unchanged page
// doesn't report today's date. Directory-index routes (e.g. posts/index.md)
// keep their trailing slash because the slashless form 301-redirects to it, and
// a sitemap must list the final URL.
function fileEntry(url: string): { url: string; lastmod: Date } | null {
  const base = url || "index";

  const filePath = join(process.cwd(), `${base}.md`);
  if (existsSync(filePath)) {
    return {
      url,
      lastmod: gitLastModified(filePath) ?? statSync(filePath).mtime,
    };
  }

  const indexPath = join(process.cwd(), base, "index.md");
  if (existsSync(indexPath)) {
    return {
      url: url ? `${url}/` : url,
      lastmod: gitLastModified(indexPath) ?? statSync(indexPath).mtime,
    };
  }

  return null;
}

// Paginated / filtered archive routes (posts/page, posts/topic, posts/tag) have
// no single backing source file, so both post- and file-lookups miss and they
// would otherwise fall through to `new Date()` — telling crawlers every one of
// the ~500 archive pages changed on every build. Anchor them to the newest
// published post's date instead: a real, build-stable signal.
const ARCHIVE_ROUTE = /^posts\/(page|topic|tag)(\/|$)/;

// Archive URLs kept out of the sitemap because they carry `noindex,follow`
// (see pageTransform.isIndexableArchive): the unfiltered paginated views, every
// tag page, and any filter's /page/N views. The only archive surfaces that stay
// in the sitemap are the topic hub page-1 URLs (posts/topic/<topic>), which the
// negative lookahead preserves.
const NONINDEXED_ARCHIVE = /^posts\/(page\/|tag(\/|$)|topic\/[^/]+\/page\/)/;

function isSitemapExcluded(url: string): boolean {
  return url === "README" || NONINDEXED_ARCHIVE.test(url);
}

function newestPublishedDate(posts: PublishedPost[]): Date | null {
  const newest = posts.find(hasUsableDate);
  return newest ? new Date(newest.sortTime) : null;
}

export function transformSitemapItems(items: SitemapItem[]): SitemapItem[] {
  const published = loadPublishedPosts();
  const publishedBySlug = indexBySlug(published);
  const archiveLastmod = newestPublishedDate(published);
  return items
    .filter((item) => !isSitemapExcluded(item.url.replace(/\/$/, "")))
    .map((item) => {
      const url = item.url.replace(/\/$/, "");

      const postDate = postLastmod(url, publishedBySlug);
      if (postDate) {
        return { ...item, url, lastmod: postDate };
      }

      if (ARCHIVE_ROUTE.test(url) && archiveLastmod) {
        return { ...item, url, lastmod: archiveLastmod };
      }

      const entry = fileEntry(url);
      if (entry) {
        return { ...item, ...entry };
      }

      return { ...item, url, lastmod: new Date() };
    });
}
