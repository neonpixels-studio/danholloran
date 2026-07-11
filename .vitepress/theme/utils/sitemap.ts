import { existsSync, readFileSync, statSync } from "fs";
import { join } from "path";
import { parseFrontmatter } from "./frontmatter";
import type { SitemapItem } from "vitepress";

// Post pages carry their published date as lastmod. Returns null when the URL
// isn't a post, the file is missing, or it has no date, so the caller can fall
// through to file mtime.
function postLastmod(url: string): Date | null {
  const postSlug = url.match(/^posts\/(.+)$/)?.[1];
  if (!postSlug) {
    return null;
  }

  const postPath = join(
    process.cwd(),
    ".vitepress/content/posts",
    `${postSlug}.md`,
  );
  if (!existsSync(postPath)) {
    return null;
  }

  const { data } = parseFrontmatter(readFileSync(postPath, "utf-8"));
  if (!data.date) {
    return null;
  }

  const parsed = new Date(data.date);
  if (Number.isNaN(parsed.getTime())) {
    throw new Error(
      `Invalid date "${data.date}" in frontmatter of ${postSlug}.md`,
    );
  }
  return parsed;
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
  return items
    .filter((item) => item.url !== "README")
    .map((item) => {
      const url = item.url.replace(/\/$/, "");

      const postDate = postLastmod(url);
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
