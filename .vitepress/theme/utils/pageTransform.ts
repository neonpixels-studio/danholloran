import { existsSync, readFileSync } from "fs";
import { join } from "path";
import matter from "gray-matter";
import type { PageData } from "vitepress";
import { SITE_URL } from "./constants";
import { pageMeta, personJsonLd } from "./seo";
import resume from "../../data/resume";

export function transformPageData(pageData: PageData): void {
  if (pageData.filePath === "index.md") {
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
  } else if (pageData.filePath === "resume.md") {
    const title = `Resume – ${resume.headline}`;
    pageData.title = title;
    pageData.description = resume.intro;
    pageData.frontmatter.title = title;
    pageData.frontmatter.description = resume.intro;
    pageData.frontmatter.head = [
      ...(pageData.frontmatter.head ?? []),
      ["link", { rel: "canonical", href: `${SITE_URL}/resume` }],
      ...pageMeta({
        title,
        description: resume.intro,
        url: `${SITE_URL}/resume`,
        image: resume.photo,
        jsonLd: personJsonLd,
      }),
    ];
  } else if (pageData.filePath === "posts/index.md") {
    const title = pageData.frontmatter.title as string;
    const description = pageData.frontmatter.description as string;
    pageData.frontmatter.head = [
      ...(pageData.frontmatter.head ?? []),
      ["link", { rel: "canonical", href: `${SITE_URL}/posts` }],
      ...pageMeta({
        title,
        description,
        url: `${SITE_URL}/posts`,
        image: pageData.frontmatter.image as string | undefined,
      }),
    ];
  } else if (pageData.filePath === "posts/[slug].md") {
    const slug = pageData.params?.slug;
    if (slug) {
      const postPath = join(
        process.cwd(),
        ".vitepress/content/posts",
        `${slug}.md`,
      );
      if (existsSync(postPath)) {
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
    }
  }
}
