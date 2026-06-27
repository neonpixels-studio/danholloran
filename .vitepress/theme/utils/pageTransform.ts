import { existsSync, readFileSync, readdirSync } from "fs";
import { join } from "path";
import { parseFrontmatter } from "./frontmatter";
import type { PageData } from "vitepress";
import { SITE_URL } from "./constants";
import {
  pageMeta,
  personJsonLd,
  profilePageJsonLd,
  publisherJsonLd,
} from "./seo";
import resume, { getExperienceLength } from "../../data/resume.ts";

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
  setStandardPageMeta(pageData, {
    title: "Grimicorn – a calm, low-fatigue color theme",
    description:
      "Grimicorn — a calm, low-fatigue color theme (grim reaper × unicorn) for VS Code, terminals, Obsidian, Claude Code and more. Download dark & light variants.",
    url: `${SITE_URL}/themes/grimicorn`,
    image: "/images/grimicorn-mascot.png",
  });
}

function transformGrimicornNeonThemes(pageData: PageData): void {
  setStandardPageMeta(pageData, {
    title: "Grimicorn Neon – an always-on-rave color theme",
    description:
      "Grimicorn Neon — the high-voltage variant of Grimicorn. Electric neon accents on near-black, for VS Code, terminals, Obsidian, Claude Code and more. Download the dark-only port for every tool.",
    url: `${SITE_URL}/themes/grimicorn-neon`,
    image: "/images/grimicorn-mascot.png",
  });
}

// Newest-first BlogPosting JSON-LD for the up-to-10 published posts.
function buildBlogPostingList() {
  const postsDir = join(process.cwd(), ".vitepress/content/posts");
  return readdirSync(postsDir)
    .filter((f) => f.endsWith(".md"))
    .map((f) => {
      const { data } = parseFrontmatter(
        readFileSync(join(postsDir, f), "utf-8"),
      );
      return {
        slug: f.replace(/\.md$/, ""),
        title: data.title as string | undefined,
        description: data.description as string | undefined,
        date: data.date as string | undefined,
        image: data.image as string | undefined,
        draft: data.draft as boolean | undefined,
      };
    })
    .filter((p) => !p.draft)
    .sort(
      (a, b) =>
        new Date(b.date ?? 0).getTime() - new Date(a.date ?? 0).getTime(),
    )
    .slice(0, 10)
    .map((p) => ({
      "@type": "BlogPosting",
      headline: p.title ?? "",
      description: p.description ?? "",
      url: `${SITE_URL}/posts/${p.slug}`,
      datePublished: p.date,
      ...(p.image && { image: `${SITE_URL}${p.image}` }),
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
  const url = `${SITE_URL}/posts`;
  pageData.frontmatter.head = [
    ...cleanHead(pageData.frontmatter.head ?? []),
    ["link", { rel: "canonical", href: url }],
    ...pageMeta({
      title,
      description,
      url,
      image:
        (pageData.frontmatter.image as string | undefined) ??
        "/images/default-social.png",
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
  const title = data.title ?? "";
  const description = data.description ?? "";
  const url = `${SITE_URL}/posts/${slug}`;
  setStandardPageMeta(pageData, {
    title,
    description,
    url,
    image: data.image,
    type: "article",
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: title,
      description,
      datePublished: data.date,
      dateModified: data.dateModified ?? data.date,
      url,
      ...(data.image && {
        image: `${SITE_URL}${data.image}`,
      }),
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
