import { existsSync, statSync } from "fs";
import { join } from "path";
import type { SitemapItem } from "vitepress";
import {
  loadPublishedPosts,
  hasUsableDate,
  type PublishedPost,
} from "./loadPublishedPosts";

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

// Resolves a stripped URL to the source file that backs it, returning the final
// URL and its mtime, or null when no source file is found. Directory-index
// routes (e.g. posts/index.md) keep their trailing slash because the slashless
// form 301-redirects to it, and a sitemap must list the final URL.
function fileEntry(url: string): { url: string; lastmod: Date } | null {
  const base = url || "index";

  const filePath = join(process.cwd(), `${base}.md`);
  if (existsSync(filePath)) {
    return { url, lastmod: statSync(filePath).mtime };
  }

  const indexPath = join(process.cwd(), base, "index.md");
  if (existsSync(indexPath)) {
    return { url: url ? `${url}/` : url, lastmod: statSync(indexPath).mtime };
  }

  return null;
}

export function transformSitemapItems(items: SitemapItem[]): SitemapItem[] {
  const publishedBySlug = indexBySlug(loadPublishedPosts());
  return items
    .filter((item) => item.url !== "README")
    .map((item) => {
      const url = item.url.replace(/\/$/, "");

      const postDate = postLastmod(url, publishedBySlug);
      if (postDate) {
        return { ...item, url, lastmod: postDate };
      }

      const entry = fileEntry(url);
      if (entry) {
        return { ...item, ...entry };
      }

      return { ...item, url, lastmod: new Date() };
    });
}
