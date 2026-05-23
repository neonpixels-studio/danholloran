import { Feed } from "feed";
import { readdirSync, readFileSync } from "fs";
import { join } from "path";
import matter from "gray-matter";
import { SITE_URL } from "./constants";

const POSTS_DIR = join(process.cwd(), ".vitepress/content/posts");

export function generateFeed(): string {
  const feed = new Feed({
    title: "Dan Holloran",
    description: "Full-stack developer and photographer based in Reno, NV.",
    id: SITE_URL,
    link: SITE_URL,
    language: "en",
    favicon: `${SITE_URL}/favicon.ico`,
    copyright: `© ${new Date().getFullYear()} Dan Holloran`,
    feedLinks: { rss: `${SITE_URL}/feed.xml` },
    author: { name: "Dan Holloran", link: SITE_URL },
  });

  const files = readdirSync(POSTS_DIR).filter(
    (f) => f.endsWith(".md") && f !== "index.md",
  );

  const posts = files
    .map((file) => {
      const raw = readFileSync(join(POSTS_DIR, file), "utf-8");
      const { data } = matter(raw);
      const slug = file.replace(/\.md$/, "");
      return { ...data, slug } as Record<string, any>;
    })
    .filter((p) => !p.draft && p.date)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  for (const post of posts) {
    const url = `${SITE_URL}/posts/${post.slug}`;
    feed.addItem({
      title: post.title,
      id: url,
      link: url,
      description: post.description ?? "",
      date: new Date(post.date),
      category: post.tags?.map((t: string) => ({ name: t })) ?? [],
      image: post.image ? `${SITE_URL}${post.image}` : undefined,
    });
  }

  return feed.rss2();
}
