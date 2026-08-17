import { existsSync, readFileSync } from "fs";
import { join } from "path";
import { parseFrontmatter } from "./frontmatter";
import type { PageData } from "vitepress";
import { isPublished, loadDatedPosts } from "./loadPublishedPosts";
import { SITE_URL } from "./constants";

// The blog index's JSON-LD lists at most this many recent posts.
const MAX_BLOG_POSTING_ENTRIES = 10;

// Fallback social image for pages without a frontmatter `image`, so og:image,
// twitter:image, and the Article JSON-LD image always resolve. (The post hero
// is fed by the postsDetail content loader, not this transform. The blog-index
// BlogPosting list entries intentionally stay image-optional.)
const DEFAULT_SOCIAL_IMAGE = "/images/default-social.png";
import {
  pageMeta,
  personJsonLd,
  profilePageJsonLd,
  publisherJsonLd,
  themeJsonLd,
} from "./seo";
import resume, { getExperienceLength } from "../../data/resume.ts";
import { ZIP_HREF } from "../../data/grimicornTheme.ts";
import { NEON_ZIP_HREF } from "../../data/grimicornNeonTheme.ts";

// Returns true for head entries owned by our transforms (canonical, OG, JSON-LD).
// Keeping this as a named predicate limits cyclomatic complexity per function.
function isTransformOwned(tag: any[]): boolean {
  if (tag[0] === "link") return tag[1]?.rel === "canonical";
  if (tag[0] === "script") return tag[1]?.type === "application/ld+json";
  if (tag[0] !== "meta") return false;
  return (
    tag[1]?.property?.startsWith("og:") || tag[1]?.name?.startsWith("twitter:")
  );
}

// Strips owned entries so calling transformPageData twice (which VitePress can
// do for dynamic routes) doesn't produce duplicate tags.
function cleanHead(head: any[]): any[] {
  return head.filter((tag) => !isTransformOwned(tag));
}

// Shared title/description + canonical + OG/JSON-LD head boilerplate, so each
// per-page transform stays declarative instead of repeating the same block.
function setStandardPageMeta(
  pageData: PageData,
  meta: Parameters<typeof pageMeta>[0],
): void {
  pageData.title = meta.title;
  pageData.description = meta.description;
  pageData.frontmatter.title = meta.title;
  pageData.frontmatter.description = meta.description;
  pageData.frontmatter.head = [
    ...cleanHead(pageData.frontmatter.head ?? []),
    ["link", { rel: "canonical", href: meta.url }],
    ...pageMeta(meta),
  ];
}

function transformHome(pageData: PageData): void {
  const title = resume.headline;
  pageData.title = title;
  pageData.description = resume.intro;
  pageData.frontmatter.title = title;
  pageData.frontmatter.description =
    "Frontend developer, writer, and explorer. Dan Holloran shares deep-dives on modern web dev, travel photography, and the tools he actually uses at work.";
  pageData.frontmatter.head = [
    ...cleanHead(pageData.frontmatter.head ?? []),
    ["link", { rel: "canonical", href: `${SITE_URL}/` }],
    ...pageMeta({
      title,
      description: resume.intro,
      url: `${SITE_URL}/`,
      image: resume.photo,
      jsonLd: personJsonLd,
    }),
  ];
}

function transformResume(pageData: PageData): void {
  setStandardPageMeta(pageData, {
    title: `Resume – ${resume.headline}`,
    description: `View Dan Holloran's full work history, skills, and experience — ${getExperienceLength()}+ years of frontend and fullstack development across agencies, startups, and enterprise teams.`,
    url: `${SITE_URL}/resume`,
    image: resume.photo,
    jsonLd: profilePageJsonLd,
  });
}

function transformGrimicornThemes(pageData: PageData): void {
  const title = "Grimicorn – a calm, low-fatigue color theme";
  const description =
    "Grimicorn — a calm, low-fatigue color theme (grim reaper × unicorn) for VS Code, terminals, Obsidian, Claude Code and more. Download dark & light variants.";
  const url = `${SITE_URL}/themes/grimicorn`;
  const image = "/images/grimicorn-mascot.png";
  setStandardPageMeta(pageData, {
    title,
    description,
    url,
    image,
    jsonLd: themeJsonLd({
      name: "Grimicorn",
      description,
      url,
      image,
      operatingSystem: "Windows, macOS, Linux",
      downloadUrl: ZIP_HREF,
    }),
  });
}

function transformGrimicornNeonThemes(pageData: PageData): void {
  const title = "Grimicorn Neon – an always-on-rave color theme";
  const description =
    "Grimicorn Neon — the high-voltage variant of Grimicorn. Electric neon accents on near-black, for VS Code, terminals, Obsidian, Claude Code and more. Download the dark-only port for every tool.";
  const url = `${SITE_URL}/themes/grimicorn-neon`;
  const image = "/images/grimicorn-mascot.png";
  setStandardPageMeta(pageData, {
    title,
    description,
    url,
    image,
    jsonLd: themeJsonLd({
      name: "Grimicorn Neon",
      description,
      url,
      image,
      operatingSystem: "Windows, macOS, Linux",
      downloadUrl: NEON_ZIP_HREF,
    }),
  });
}

// Newest-first BlogPosting JSON-LD for the most recent published posts. Only
// posts with a usable date are listed, so `datePublished` is never an
// `Invalid Date` string that structured-data validators reject.
function buildBlogPostingList() {
  return loadDatedPosts()
    .slice(0, MAX_BLOG_POSTING_ENTRIES)
    .map((post) => ({
      "@type": "BlogPosting",
      headline: post.title ?? "",
      description: post.description ?? "",
      url: `${SITE_URL}/posts/${post.slug}`,
      datePublished: post.date,
      ...(post.image && { image: `${SITE_URL}${post.image}` }),
      author: {
        "@type": "Person",
        name: `${resume.firstName} ${resume.lastName}`,
        url: SITE_URL,
      },
    }));
}

function transformPostsIndex(pageData: PageData): void {
  const title = pageData.frontmatter.title as string;
  const description = pageData.frontmatter.description as string;
  // Trailing slash: /posts is a directory index that 301-redirects to /posts/,
  // so the self-canonical (and JSON-LD url) must be the final /posts/ URL.
  const url = `${SITE_URL}/posts/`;
  pageData.frontmatter.head = [
    ...cleanHead(pageData.frontmatter.head ?? []),
    ["link", { rel: "canonical", href: url }],
    ...pageMeta({
      title,
      description,
      url,
      image:
        (pageData.frontmatter.image as string | undefined) ??
        DEFAULT_SOCIAL_IMAGE,
      jsonLd: {
        "@context": "https://schema.org",
        "@type": "Blog",
        name: title,
        description,
        url,
        blogPost: buildBlogPostingList(),
        author: {
          "@type": "Person",
          name: `${resume.firstName} ${resume.lastName}`,
          url: SITE_URL,
        },
      },
    }),
  ];
}

// Optional topical signals for Article JSON-LD: topic -> articleSection,
// tags -> comma-separated keywords. Each field is omitted when its source is
// absent so we never emit empty schema properties.
function buildArticleTopicalFields(data: Record<string, unknown>): {
  articleSection?: string;
  keywords?: string;
} {
  const fields: { articleSection?: string; keywords?: string } = {};
  const topic = typeof data.topic === "string" ? data.topic.trim() : "";
  if (topic.length > 0) {
    fields.articleSection = topic;
  }
  // Frontmatter is author-written YAML, so normalize before emitting: coerce a
  // lone scalar to an array, stringify scalar entries (an unquoted tag like a
  // year parses as a number/boolean — keep it rather than silently drop it),
  // discard non-scalars and blanks, and omit the field entirely if nothing
  // survives (never emit an empty keywords string).
  const rawTags = data.tags;
  const tags = Array.isArray(rawTags) ? rawTags : [rawTags];
  const keywords = tags
    .filter(
      (tag) =>
        typeof tag === "string" ||
        typeof tag === "number" ||
        typeof tag === "boolean",
    )
    .map((tag) => String(tag).trim())
    .filter((tag) => tag.length > 0);
  if (keywords.length > 0) {
    fields.keywords = keywords.join(", ");
  }
  return fields;
}

function transformPost(pageData: PageData): void {
  const slug = pageData.params?.slug;
  if (!slug) return;

  const postPath = join(
    process.cwd(),
    ".vitepress/content/posts",
    `${slug}.md`,
  );
  if (!existsSync(postPath)) return;

  const { data } = parseFrontmatter(readFileSync(postPath, "utf-8"));
  // Defense-in-depth: posts/[slug].paths.ts already drops drafts from route
  // generation, but bail here too so a draft reached through any other route
  // source never emits title/canonical/OG/JSON-LD. Without this a draft would
  // ship rich SEO metadata over a body PostView renders blank (postsDetail.data
  // excludes it) — a reachable, indexable, empty page.
  if (!isPublished(data, slug)) return;

  const title = data.title ?? "";
  const description = data.description ?? "";
  const image = data.image ?? DEFAULT_SOCIAL_IMAGE;
  const url = `${SITE_URL}/posts/${slug}`;
  setStandardPageMeta(pageData, {
    title,
    description,
    url,
    image,
    type: "article",
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: title,
      description,
      datePublished: data.date,
      dateModified: data.dateModified ?? data.date,
      url,
      ...buildArticleTopicalFields(data),
      image: `${SITE_URL}${image}`,
      author: {
        "@type": "Person",
        name: `${resume.firstName} ${resume.lastName}`,
        url: SITE_URL,
      },
      publisher: publisherJsonLd,
    },
  });
}

export function transformPageData(pageData: PageData): void {
  switch (pageData.filePath) {
    case "index.md":
      return transformHome(pageData);
    case "resume.md":
      return transformResume(pageData);
    case "themes/grimicorn.md":
      return transformGrimicornThemes(pageData);
    case "themes/grimicorn-neon.md":
      return transformGrimicornNeonThemes(pageData);
    case "posts/index.md":
      return transformPostsIndex(pageData);
    case "posts/[slug].md":
      return transformPost(pageData);
  }
}
