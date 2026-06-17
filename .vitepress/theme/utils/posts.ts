import { readdirSync, readFileSync } from "fs";
import { join } from "path";
import { parseFrontmatter } from "./frontmatter";

const POSTS_DIR = join(process.cwd(), ".vitepress/content/posts");

export function getLatestPostImage(): string | undefined {
  const posts = readdirSync(POSTS_DIR)
    .filter((f) => f.endsWith(".md"))
    .map((f) => parseFrontmatter(readFileSync(join(POSTS_DIR, f), "utf-8")).data)
    .filter((d) => !d.draft && d.date && d.image)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  return posts[0]?.image;
}
