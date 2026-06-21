import { existsSync, readFileSync, readdirSync } from "fs";
import { join } from "path";
import { parseFrontmatter } from "./frontmatter";
import type { PageData } from "vitepress";
import { SITE_URL } from "./constants";
import { pageMeta, personJsonLd, profilePageJsonLd } from "./seo";
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
  const title = `Resume – ${resume.headline}`;
  const description = `View Dan Holloran's full work history, skills, and experience — ${getExperienceLength()}+ years of frontend and fullstack development across agencies, startups, and enterprise teams.`;
  pageData.title = title;
  pageData.description = description;
  pageData.frontmatter.title = title;
  pageData.frontmatter.description = description;
  pageData.frontmatter.head = [
    ...cleanHead(pageData.frontmatter.head ?? []),
    ["link", { rel: "canonical", href: `${SITE_URL}/resume` }],
    ...pageMeta({
      title,
      description,
      url: `${SITE_URL}/resume`,
      image: resume.photo,
      jsonLd: profilePageJsonLd,
    }),
  ];
}

function transformPostsIndex(pageData: PageData): void {
  const title = pageData.frontmatter.title as string;
  const description = pageData.frontmatter.description as string;
  const url = `${SITE_URL}/posts`;
  const postsDir = join(process.cwd(), ".vitepress/content/posts");
  const blogPosts = readdirSync(postsDir)
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
        blogPost: blogPosts,
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
  pageData.title = title;
  pageData.description = description;
  pageData.frontmatter.title = title;
  pageData.frontmatter.description = description;
  pageData.frontmatter.head = [
    ...cleanHead(pageData.frontmatter.head ?? []),
    ["link", { rel: "canonical", href: url }],
    ...pageMeta({
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
      },
    }),
  ];
}

export function transformPageData(pageData: PageData): void {
  switch (pageData.filePath) {
    case "index.md":
      return transformHome(pageData);
    case "resume.md":
      return transformResume(pageData);
    case "posts/index.md":
      return transformPostsIndex(pageData);
    case "posts/[slug].md":
      return transformPost(pageData);
  }
}
