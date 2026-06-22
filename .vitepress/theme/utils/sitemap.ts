import { existsSync, readFileSync, statSync } from "fs";
import { join } from "path";
import { parseFrontmatter } from "./frontmatter";
import type { SitemapItem } from "vitepress";

export function transformSitemapItems(items: SitemapItem[]): SitemapItem[] {
  return items
    .filter((item) => item.url !== "README")
    .map((item) => {
      const url = item.url.replace(/\/$/, "");

      const postSlug = url.match(/^posts\/(.+)$/)?.[1];
      if (postSlug) {
        const postPath = join(
          process.cwd(),
          ".vitepress/content/posts",
          `${postSlug}.md`,
        );
        if (existsSync(postPath)) {
          const { data } = parseFrontmatter(readFileSync(postPath, "utf-8"));
          if (data.date) {
            const parsed = new Date(data.date);
            if (Number.isNaN(parsed.getTime())) {
              throw new Error(
                `Invalid date "${data.date}" in frontmatter of ${postSlug}.md`,
              );
            }
            return { ...item, url, lastmod: parsed };
          }
        }
      }

      const base = url || "index";
      for (const candidate of [`${base}.md`, join(base, "index.md")]) {
        const fullPath = join(process.cwd(), candidate);
        if (existsSync(fullPath)) {
          return { ...item, url, lastmod: statSync(fullPath).mtime };
        }
      }

      return { ...item, url, lastmod: new Date() };
    });
}
