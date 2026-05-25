/**
 * cross-post.mjs
 * Reads new VitePress blog posts and publishes them to Dev.to and Hashnode
 * with canonical URLs pointing back to danholloran.me
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import matter from "gray-matter";

const SITE_URL = process.env.SITE_URL || "https://danholloran.me";
const POSTS_DIR = path.resolve(".vitepress/content/posts");

// ─── Helpers ────────────────────────────────────────────────────────────────

export function readPost(slug) {
  const filePath = path.join(POSTS_DIR, `${slug}.md`);
  if (!fs.existsSync(filePath)) {
    throw new Error(`Post file not found: ${filePath}`);
  }
  const raw = fs.readFileSync(filePath, "utf-8");
  const { data: frontmatter, content } = matter(raw);
  return { frontmatter, content, slug };
}

/**
 * Prepare markdown content for cross-posting:
 * - Resolve relative image paths to absolute URLs
 * - Prepend "Originally published on danholloran.me" header
 * - Append a CTA footer linking back
 */
export function prepareContent(content, slug) {
  const canonicalUrl = `${SITE_URL}/posts/${slug}`;

  // Resolve relative image paths
  const resolved = content.replace(
    /!\[([^\]]*)\]\((?!https?:\/\/)([^)]+)\)/g,
    (_, alt, src) => `![${alt}](${SITE_URL}/${src.replace(/^\.?\//, "")})`,
  );

  const header = `> *Originally published on [danholloran.me](${canonicalUrl})*\n\n---\n\n`;
  const footer = `\n\n---\n\n*This post was originally published on [danholloran.me](${canonicalUrl}). Follow along there for more frontend and dev content.*`;

  return header + resolved + footer;
}

export function shouldCrossPost(frontmatter) {
  return frontmatter.topic === "development" && frontmatter.draft === false;
}

// ─── Dev.to ─────────────────────────────────────────────────────────────────

export async function postToDevTo({ frontmatter, content, slug }) {
  const apiKey = process.env.DEVTO_API_KEY;
  if (!apiKey) throw new Error("DEVTO_API_KEY not set");

  const canonicalUrl = `${SITE_URL}/posts/${slug}`;
  const body = prepareContent(content, slug);

  // Dev.to accepts up to 4 tags as plain strings
  const tags = (frontmatter.tags || [])
    .slice(0, 4)
    .map((t) => t.toLowerCase().replace(/[^a-z0-9]/g, ""));

  const payload = {
    article: {
      title: frontmatter.title,
      body_markdown: body,
      published: true,
      canonical_url: canonicalUrl,
      tags,
      ...(frontmatter.image
        ? { main_image: [SITE_URL, frontmatter.image].join("") }
        : {}),
      ...(frontmatter.description
        ? { description: frontmatter.description }
        : {}),
    },
  };

  const request = () =>
    fetch("https://dev.to/api/articles", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-key": apiKey,
      },
      body: JSON.stringify(payload),
    });

  let res = await request();

  if (res.status === 429) {
    const body = await res.json().catch(() => ({}));
    const waitMatch = String(body.error || "").match(/(\d+)\s*second/);
    const waitSec = waitMatch ? parseInt(waitMatch[1], 10) : 300;
    console.log(
      `⏳ Dev.to rate limited — waiting ${waitSec}s then retrying...`,
    );
    await new Promise((resolve) => setTimeout(resolve, waitSec * 1000));
    res = await request();
  }

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Dev.to error ${res.status}: ${err}`);
  }

  const data = await res.json();
  console.log(`✅ Dev.to: ${data.url}`);
  return data.url;
}

// ─── Hashnode ────────────────────────────────────────────────────────────────

export async function postToHashnode({ frontmatter, content, slug }) {
  const pat = process.env.HASHNODE_PAT;
  const publicationId = process.env.HASHNODE_PUBLICATION_ID;
  if (!pat) throw new Error("HASHNODE_PAT not set");
  if (!publicationId) throw new Error("HASHNODE_PUBLICATION_ID not set");

  const canonicalUrl = `${SITE_URL}/posts/${slug}`;
  const body = prepareContent(content, slug);

  // Hashnode tags need name + slug
  const tags = (frontmatter.tags || []).slice(0, 5).map((t) => ({
    name: t,
    slug: t.toLowerCase().replace(/[^a-z0-9]/g, "-"),
  }));

  const mutation = `
    mutation PublishPost($input: PublishPostInput!) {
      publishPost(input: $input) {
        post {
          url
          title
        }
      }
    }
  `;

  const variables = {
    input: {
      title: frontmatter.title,
      contentMarkdown: body,
      originalArticleURL: canonicalUrl,
      publicationId,
      tags,
      ...(frontmatter.image
        ? {
            coverImageOptions: {
              coverImageURL: [SITE_URL, frontmatter.image].join(""),
            },
          }
        : {}),
    },
  };

  const res = await fetch("https://gql.hashnode.com/", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: pat,
    },
    body: JSON.stringify({ query: mutation, variables }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Hashnode error ${res.status}: ${err}`);
  }

  const contentType = res.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) {
    const body = await res.text();
    throw new Error(
      `Hashnode returned non-JSON response (${res.status}). Check HASHNODE_PAT and HASHNODE_PUBLICATION_ID.\nBody: ${body.slice(0, 200)}`,
    );
  }

  const { data, errors } = await res.json();
  if (errors?.length)
    throw new Error(`Hashnode GraphQL errors: ${JSON.stringify(errors)}`);

  const url = data?.publishPost?.post?.url;
  console.log(`✅ Hashnode: ${url}`);
  return url;
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function run(slugs) {
  let hadError = false;

  for (const slug of slugs) {
    console.log(`\n📝 Processing: ${slug}`);
    let post;

    try {
      post = readPost(slug);
    } catch (err) {
      console.error(`❌ Could not read post "${slug}": ${err.message}`);
      hadError = true;
      continue;
    }

    if (!shouldCrossPost(post.frontmatter)) {
      console.log(
        `   Skipping: topic is "${post.frontmatter.topic}", not "development"`,
      );
      continue;
    }

    console.log(`   Title: ${post.frontmatter.title}`);

    // Dev.to
    try {
      await postToDevTo(post);
    } catch (err) {
      console.error(`❌ Dev.to failed for "${slug}": ${err.message}`);
      hadError = true;
    }

    // Hashnode
    try {
      await postToHashnode(post);
    } catch (err) {
      console.error(`❌ Hashnode failed for "${slug}": ${err.message}`);
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

  run(slugs);
}
