import { existsSync, readFileSync } from "fs";
import { join } from "path";
import {
  coerceFrontmatterString,
  normalizeFrontmatterTopic,
  parseFrontmatter,
} from "./frontmatter";
import type { PageData } from "vitepress";
import {
  INDEX_FILE,
  isPublished,
  loadDatedPosts,
  POSTS_DIR,
} from "./loadPublishedPosts";
import { SITE_URL } from "./constants";
import { archiveHref, toPageNumber } from "./archive";

// The blog index's JSON-LD lists at most this many recent posts.
const MAX_BLOG_POSTING_ENTRIES = 10;

// VitePress appends " | Dan Holloran" (the site title) to every page <title>.
// Past ~65 rendered characters Google truncates the tag in the SERP, cutting
// off the brand suffix and often the tail of the headline. When the base title
// alone leaves no room for the suffix under that budget, drop the suffix so the
// headline itself survives.
const TITLE_SUFFIX_LENGTH = " | Dan Holloran".length;
const MAX_SERP_TITLE_LENGTH = 65;

function applyTitleTemplate(pageData: PageData, title: string): void {
  if (title.length + TITLE_SUFFIX_LENGTH > MAX_SERP_TITLE_LENGTH) {
    pageData.titleTemplate = false;
    pageData.frontmatter.titleTemplate = false;
  }
}

// Fallback social image for pages without a frontmatter `image`, so og:image,
// twitter:image, and the Article JSON-LD image always resolve. (The post hero
// is fed by the postsDetail content loader, not this transform. The blog-index
// BlogPosting list entries intentionally stay image-optional.)
const DEFAULT_SOCIAL_IMAGE = "/images/default-social.png";
import {
  AUTHOR_NAME,
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
    tag[1]?.property?.startsWith("og:") ||
    tag[1]?.name?.startsWith("twitter:") ||
    tag[1]?.name === "robots"
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
  canonicalUrl: string = meta.url,
  noindex = false,
): void {
  pageData.title = meta.title;
  pageData.description = meta.description;
  pageData.frontmatter.title = meta.title;
  pageData.frontmatter.description = meta.description;
  applyTitleTemplate(pageData, meta.title);
  pageData.frontmatter.head = [
    ...cleanHead(pageData.frontmatter.head ?? []),
    ["link", { rel: "canonical", href: canonicalUrl }],
    ...(noindex
      ? [["meta", { name: "robots", content: "noindex,follow" }]]
      : []),
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
        name: AUTHOR_NAME,
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
          name: AUTHOR_NAME,
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
  const topic = normalizeFrontmatterTopic(data.topic);
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

// Reads a post's raw frontmatter by slug without applying the draft filter, so
// callers can tell "no such post" apart from "post exists but is a draft".
// Shared by transformPost (its own slug) and the canonical-target lookup
// below (an arbitrary author-typed slug) so there's one definition of how a
// slug maps to a post file.
function loadPostFrontmatterBySlug(
  slug: string,
): Record<string, unknown> | null {
  const fileName = `${slug}.md`;
  // index.md isn't a post — loadPublishedPosts() excludes it from the corpus
  // (see INDEX_FILE) — so it must never resolve here either, even though the
  // file may exist on disk.
  if (fileName === INDEX_FILE) {
    return null;
  }
  const postPath = join(POSTS_DIR, fileName);
  if (!existsSync(postPath)) {
    return null;
  }
  return parseFrontmatter(readFileSync(postPath, "utf-8")).data;
}

// Every real post filename in .vitepress/content/posts matches this shape
// (lowercase letters, digits, single hyphens). Enforcing it on a canonical
// slug *before* it ever reaches the filesystem closes off `join`'s silent
// `..` normalization (a `canonical: ../../../README` would otherwise resolve
// to a real file outside the posts directory and pass) and mixed-case values
// that `existsSync` may resolve case-insensitively on some filesystems but
// that 404 on the case-sensitive production host.
const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

// Normalizes frontmatter `canonical` to a target slug, or null when there's
// no override — absent, blank, a bare `canonical:` key (yaml parses that to
// null, not a string), and naming the post's own slug are all self-canonical.
// Throws on a genuinely non-string *value*, or a string that isn't shaped
// like a real post slug: both are content typos, not a legitimate way of
// saying "no override", and shouldn't be swallowed silently.
function resolveCanonicalSlug(
  data: Record<string, unknown>,
  slug: string,
): string | null {
  if (data.canonical == null) {
    return null;
  }
  if (typeof data.canonical !== "string") {
    throw new Error(
      `resolvePostCanonical: post "${slug}" has a non-string canonical value ${JSON.stringify(data.canonical)}; it must be a post slug.`,
    );
  }
  const canonicalSlug = data.canonical.trim();
  if (!canonicalSlug || canonicalSlug === slug) {
    return null;
  }
  if (!SLUG_PATTERN.test(canonicalSlug)) {
    throw new Error(
      `resolvePostCanonical: post "${slug}" declares canonical "${canonicalSlug}", which isn't a valid post slug (lowercase letters, digits, and single hyphens only).`,
    );
  }
  return canonicalSlug;
}

// Throws unless the canonical target both exists and is published, naming the
// specific reason (missing vs. draft) so the author isn't sent hunting for a
// typo in a slug that's actually spelled correctly but just unpublished.
function assertCanonicalTargetIsPublished(
  targetData: Record<string, unknown> | null,
  slug: string,
  canonicalSlug: string,
): asserts targetData is Record<string, unknown> {
  if (!targetData) {
    throw new Error(
      `resolvePostCanonical: post "${slug}" declares canonical "${canonicalSlug}", but no published post with that slug exists. Fix the typo/rename, or remove the canonical override if the target was never meant to publish.`,
    );
  }
  if (!isPublished(targetData, canonicalSlug)) {
    throw new Error(
      `resolvePostCanonical: post "${slug}" declares canonical "${canonicalSlug}", but that post is a draft. Publish it, or remove the canonical override until it is.`,
    );
  }
}

// Throws when the canonical target itself declares a different canonical —
// search engines ignore chained canonicals, so the consolidation signal is
// silently lost unless authors are pointed at the final target directly.
function assertCanonicalTargetNotChained(
  targetData: Record<string, unknown>,
  slug: string,
  canonicalSlug: string,
): void {
  const targetCanonicalSlug =
    typeof targetData.canonical === "string" ? targetData.canonical.trim() : "";
  if (targetCanonicalSlug && targetCanonicalSlug !== canonicalSlug) {
    throw new Error(
      `resolvePostCanonical: post "${slug}" declares canonical "${canonicalSlug}", but that post itself canonicals to "${targetCanonicalSlug}". Point "${slug}" directly at the final target — search engines ignore canonical chains.`,
    );
  }
}

// A `canonical` frontmatter slug points a post's canonical link at another post,
// consolidating the ranking signal for near-duplicate photo posts about the same
// landmark. og:url and the Article JSON-LD stay self-referential — only the
// canonical signal is redirected.
//
// The slug is author-typed YAML with no referential integrity of its own, so a
// typo, a rename, or a draft-only slug would otherwise ship a canonical tag
// pointing at a URL that 404s or was never published — a silent SEO footgun
// that's invisible until a crawler (or a human) follows the link. Fail loud
// here instead: this runs during `transformPageData`, which VitePress calls
// for every page at build time, so a bad slug aborts the build rather than
// shipping (mirrors posts/[slug].paths.ts's fail-loud policy for the same
// class of content error).
function resolvePostCanonical(
  data: Record<string, unknown>,
  selfUrl: string,
  slug: string,
): string {
  const canonicalSlug = resolveCanonicalSlug(data, slug);
  if (!canonicalSlug) {
    return selfUrl;
  }
  const targetData = loadPostFrontmatterBySlug(canonicalSlug);
  assertCanonicalTargetIsPublished(targetData, slug, canonicalSlug);
  assertCanonicalTargetNotChained(targetData, slug, canonicalSlug);
  return `${SITE_URL}/posts/${canonicalSlug}`;
}

function transformPost(pageData: PageData): void {
  const slug = pageData.params?.slug;
  if (!slug) return;

  const data = loadPostFrontmatterBySlug(slug);
  if (!data) return;

  // Defense-in-depth: posts/[slug].paths.ts already drops drafts from route
  // generation, but bail here too so a draft reached through any other route
  // source never emits title/canonical/OG/JSON-LD. Without this a draft would
  // ship rich SEO metadata over a body PostView renders blank (postsDetail.data
  // excludes it) — a reachable, indexable, empty page.
  if (!isPublished(data, slug)) return;

  // title/description are coerced (not dropped) for a non-string value — see
  // coerceFrontmatterString. image has no sane coercion — a non-string value
  // falls back to the default social image.
  const title = coerceFrontmatterString(data.title);
  const description = coerceFrontmatterString(data.description);
  const image =
    typeof data.image === "string" ? data.image : DEFAULT_SOCIAL_IMAGE;
  const url = `${SITE_URL}/posts/${slug}`;
  setStandardPageMeta(
    pageData,
    {
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
          name: AUTHOR_NAME,
          url: SITE_URL,
        },
        publisher: publisherJsonLd,
      },
    },
    resolvePostCanonical(data, url, slug),
  );
}

// Paginated / filtered archive routes. Every archive page stays crawlable
// (noindex,follow) so posts remain discoverable, but only the topic hub pages
// (development, finance, obsidian, travel — page 1) are indexable. Tag pages
// duplicate the topic hubs, split subjects across synonym slugs, and are often
// a single thin post; paginated views (/page/N of any filter) duplicate posts
// already indexed at their own URLs. Both are excluded from the index and the
// sitemap to consolidate ranking signal on the topic hubs and post pages.
const TOPIC_HUB_FILE_PATH = "posts/topic/[topic].md";

// A topic hub's page 1 is the one indexable archive surface. Its own
// `[topic].md` route is always page 1, so the filePath alone decides.
function isIndexableArchive(pageData: PageData): boolean {
  return pageData.filePath === TOPIC_HUB_FILE_PATH;
}

interface ArchiveScope {
  heading: string;
  subject: string;
  href: string;
}

function archivePageNumber(pageData: PageData): number {
  return toPageNumber(pageData.params?.page);
}

function resolveArchiveScope(pageData: PageData): ArchiveScope | null {
  const params = pageData.params ?? {};
  const page = archivePageNumber(pageData);
  if (pageData.filePath === "posts/page/[page].md") {
    return {
      heading: "Writing",
      subject: "writing on code, craft, and exploration",
      href: archiveHref(page, {}),
    };
  }
  if (pageData.filePath.startsWith("posts/topic/")) {
    const label = (params.topicLabel ?? params.topic ?? "") as string;
    return {
      heading: `Posts on ${label}`,
      subject: `posts on ${label}`,
      href: archiveHref(page, { topicSlug: params.topic as string }),
    };
  }
  if (pageData.filePath.startsWith("posts/tag/")) {
    const label = (params.tagLabel ?? params.tag ?? "") as string;
    return {
      heading: `Posts tagged #${label}`,
      subject: `posts tagged ${label}`,
      href: archiveHref(page, { tagSlug: params.tag as string }),
    };
  }
  return null;
}

function transformArchive(pageData: PageData): void {
  const scope = resolveArchiveScope(pageData);
  if (!scope) {
    return;
  }
  const page = archivePageNumber(pageData);
  const title = page > 1 ? `${scope.heading} — Page ${page}` : scope.heading;
  const pageNote = page > 1 ? ` Page ${page}.` : "";
  const url = `${SITE_URL}${scope.href}`;
  setStandardPageMeta(
    pageData,
    {
      title,
      description: `Dan Holloran's ${scope.subject}.${pageNote}`,
      url,
      image: DEFAULT_SOCIAL_IMAGE,
    },
    url,
    !isIndexableArchive(pageData),
  );
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
    case "posts/page/[page].md":
    case "posts/topic/[topic].md":
    case "posts/topic/[topic]/page/[page].md":
    case "posts/tag/[tag].md":
    case "posts/tag/[tag]/page/[page].md":
      return transformArchive(pageData);
  }
}
