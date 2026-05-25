/**
 * announce-x.mjs
 * Posts a tweet announcing a new blog post on danholloran.me
 *
 * Requires X API v2 OAuth 1.0a credentials (free tier supports posting):
 *   X_APP_KEY        → API Key
 *   X_APP_SECRET     → API Key Secret
 *   X_ACCESS_TOKEN   → Access Token (your account)
 *   X_ACCESS_SECRET  → Access Token Secret
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import matter from "gray-matter";
import { TwitterApi } from "twitter-api-v2";

const SITE_URL = process.env.SITE_URL || "https://danholloran.me";
const POSTS_DIR = path.resolve(".vitepress/content/posts");

// ─── Tweet composer ──────────────────────────────────────────────────────────

/**
 * Builds the tweet text. Stays under 280 chars.
 * Format:
 *   New post: "{title}"
 *
 *   {description or first sentence of post}
 *
 *   {url} #{tag1} #{tag2} #{tag3}
 */
export function composeTweet(frontmatter, slug) {
  const url = `${SITE_URL}/posts/${slug}`;
  const title = frontmatter.title?.trim() || "New post";
  const description = frontmatter.description?.trim() || "";

  // Up to 3 hashtags from tags frontmatter
  const hashtags = (frontmatter.tags || [])
    .slice(0, 3)
    .map((t) => `#${t.replace(/[^a-zA-Z0-9]/g, "")}`)
    .join(" ");

  // Build tweet, trimming description if needed to stay under 280
  const footer = `\n\n${url}${hashtags ? " " + hashtags : ""}`;
  const header = `New post: "${title}"\n\n`;
  const maxDescLen = 280 - header.length - footer.length;

  let body = "";
  if (description && maxDescLen > 20) {
    body =
      description.length > maxDescLen
        ? description.slice(0, maxDescLen - 1) + "…"
        : description;
  }

  return header + body + footer;
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function run(slugs, rwClient) {
  let hadError = false;

  for (const slug of slugs) {
    const filePath = path.join(POSTS_DIR, `${slug}.md`);
    if (!fs.existsSync(filePath)) {
      console.error(`❌ Post not found: ${filePath}`);
      hadError = true;
      continue;
    }

    const { data: frontmatter } = matter(fs.readFileSync(filePath, "utf-8"));
    const tweet = composeTweet(frontmatter, slug);

    console.log(`\n🐦 Tweeting for: ${slug}`);
    console.log("─".repeat(50));
    console.log(tweet);
    console.log("─".repeat(50));
    console.log(`   Length: ${tweet.length}/280`);

    try {
      const { data } = await rwClient.v2.tweet(tweet);
      console.log(`✅ X/Twitter: https://x.com/i/web/status/${data.id}`);
    } catch (err) {
      console.error(`❌ X/Twitter failed for "${slug}": ${err.message}`);
      hadError = true;
    }
  }

  if (hadError) process.exit(1);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const slugsRaw = process.env.POST_SLUGS || "";
  const slugs = slugsRaw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  if (slugs.length === 0) {
    console.log("No post slugs provided. Exiting.");
    process.exit(0);
  }

  const client = new TwitterApi({
    appKey: process.env.X_APP_KEY,
    appSecret: process.env.X_APP_SECRET,
    accessToken: process.env.X_ACCESS_TOKEN,
    accessSecret: process.env.X_ACCESS_SECRET,
  });

  run(slugs, client.readWrite);
}
