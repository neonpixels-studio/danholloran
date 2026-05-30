import { existsSync, readFileSync, readdirSync } from "fs";
import { join } from "path";
import matter from "gray-matter";
import type { PageData } from "vitepress";
import { SITE_URL } from "./constants";
import { pageMeta, personJsonLd } from "./seo";
import resume, { getExperienceLength } from "../../data/resume.ts";

function transformHome(pageData: PageData): void {
  const title = resume.headline;
  pageData.title = title;
  pageData.description = resume.intro;
  pageData.frontmatter.title = title;
  pageData.frontmatter.description =
    "Frontend developer, writer, and explorer. Dan Holloran shares deep-dives on modern web dev, travel photography, and the tools he actually uses at work.";
  pageData.frontmatter.head = [
    ...(pageData.frontmatter.head ?? []),
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
    ...(pageData.frontmatter.head ?? []),
    ["link", { rel: "canonical", href: `${SITE_URL}/resume` }],
    ...pageMeta({
      title,
      description,
      url: `${SITE_URL}/resume`,
      image: resume.photo,
      jsonLd: personJsonLd,
    }),
  ];
}

function transformPostsIndex(pageData: PageData): void {
  const title = pageData.frontmatter.title as string;
  const description = pageData.frontmatter.description as string;
  const url = `${SITE_URL}/posts/`;
  const postsDir = join(process.cwd(), ".vitepress/content/posts");
  const blogPosts = readdirSync(postsDir)
    .filter((f) => f.endsWith(".md"))
    .map((f) => {
      const { data } = matter(readFileSync(join(postsDir, f), "utf-8"));
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
    ...(pageData.frontmatter.head ?? []),
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

  const { data } = matter(readFileSync(postPath, "utf-8"));
  const title = data.title ?? "";
  const description = data.description ?? "";
  const url = `${SITE_URL}/posts/${slug}`;
  pageData.title = title;
  pageData.description = description;
  pageData.frontmatter.title = title;
  pageData.frontmatter.description = description;
  pageData.frontmatter.head = [
    ...(pageData.frontmatter.head ?? []),
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
