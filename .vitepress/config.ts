import { fileURLToPath, URL } from "node:url";
import { writeFileSync, readFileSync, existsSync, statSync } from "fs";
import { join } from "path";
import { defineConfig } from "vitepress";
import tailwindcss from "@tailwindcss/vite";
import { generateFeed } from "./theme/utils/generateFeed";
import matter from "gray-matter";
import resume from "./data/resume";

const SITE_URL = "https://danholloran.me";

function pageMeta(opts: {
  title: string;
  description: string;
  url: string;
  image?: string;
  type?: "website" | "article";
  jsonLd?: Record<string, unknown>;
}): any[] {
  const { title, description, url, image, type = "website", jsonLd } = opts;
  const imageUrl = image ? `${SITE_URL}${image}` : undefined;
  const meta: any[] = [
    ["meta", { property: "og:type", content: type }],
    ["meta", { property: "og:title", content: title }],
    ["meta", { property: "og:description", content: description }],
    ["meta", { property: "og:url", content: url }],
    ["meta", { property: "og:locale", content: "en_US" }],
    ["meta", { name: "twitter:title", content: title }],
    ["meta", { name: "twitter:description", content: description }],
  ];
  if (imageUrl) {
    meta.push(
      ["meta", { property: "og:image", content: imageUrl }],
      ["meta", { name: "twitter:image", content: imageUrl }],
    );
  }
  if (jsonLd) {
    meta.push([
      "script",
      { type: "application/ld+json" },
      JSON.stringify(jsonLd),
    ]);
  }
  return meta;
}

const personJsonLd = {
  "@context": "https://schema.org",
  "@type": "Person",
  name: `${resume.firstName} ${resume.lastName}`,
  url: SITE_URL,
  image: `${SITE_URL}${resume.photo}`,
  jobTitle: resume.headline,
  description: resume.intro,
  sameAs: resume.contacts
    .filter((c) => c.link?.startsWith("https://") && c.link !== SITE_URL)
    .map((c) => c.link as string),
};

export default defineConfig({
  title: "Dan Holloran",
  description: "Full-stack developer and photographer based in Reno, NV.",
  sitemap: {
    hostname: SITE_URL,
    transformItems: (items) =>
      items
        .filter((item) => item.url !== "README")
        .map((item) => {
          const url = item.url.replace(/\/$/, "");

          // Posts: use frontmatter date
          const postSlug = url.match(/^posts\/(.+)$/)?.[1];
          if (postSlug) {
            const postPath = join(
              process.cwd(),
              ".vitepress/content/posts",
              `${postSlug}.md`,
            );
            if (existsSync(postPath)) {
              const { data } = matter(readFileSync(postPath, "utf-8"));
              if (data.date) return { ...item, lastmod: new Date(data.date) };
            }
          }

          // Other pages: use file mtime
          const base = url || "index";
          for (const candidate of [`${base}.md`, join(base, "index.md")]) {
            const fullPath = join(process.cwd(), candidate);
            if (existsSync(fullPath)) {
              return { ...item, lastmod: statSync(fullPath).mtime };
            }
          }

          return { ...item, lastmod: new Date() };
        }),
  },
  markdown: {
    theme: {
      light: "synthwave-84",
      dark: "tokyo-night",
    },
    // Inject theme background CSS vars — VitePress doesn't emit them for dual themes
    codeTransformers: [
      {
        name: "inject-theme-bg",
        pre(node) {
          const existing =
            typeof node.properties.style === "string"
              ? node.properties.style
              : "";
          node.properties.style = `--shiki-light-bg:#262335;--shiki-dark-bg:#1A1B26;${existing}`;
        },
      },
    ],
  },
  vite: {
    plugins: [tailwindcss()],
    resolve: {
      alias: {
        "@": fileURLToPath(new URL(".", import.meta.url)),
        "@components": fileURLToPath(
          new URL("./theme/components", import.meta.url),
        ),
        "@theme": fileURLToPath(new URL("./theme", import.meta.url)),
        "@typedefs": fileURLToPath(new URL("./types", import.meta.url)),
        "@data": fileURLToPath(new URL("./data", import.meta.url)),
        "@composables": fileURLToPath(
          new URL("./theme/composables", import.meta.url),
        ),
        "@content": fileURLToPath(new URL("./content", import.meta.url)),
        "@utils": fileURLToPath(new URL("./theme/utils", import.meta.url)),
        "@views": fileURLToPath(new URL("./theme/views", import.meta.url)),
      },
    },
  },
  transformPageData(pageData) {
    if (pageData.filePath === "index.md") {
      const title = `${resume.firstName} ${resume.lastName} - ${resume.headline}`;
      pageData.title = title;
      pageData.description = resume.intro;
      pageData.frontmatter.title = title;
      pageData.frontmatter.description = resume.intro;
      pageData.frontmatter.head = [
        ...(pageData.frontmatter.head ?? []),
        ...pageMeta({
          title,
          description: resume.intro,
          url: `${SITE_URL}/`,
          image: resume.photo,
          jsonLd: personJsonLd,
        }),
      ];
    } else if (pageData.filePath === "resume.md") {
      const title = `Resume – ${resume.firstName} ${resume.lastName} | ${resume.headline}`;
      pageData.title = title;
      pageData.description = resume.intro;
      pageData.frontmatter.title = title;
      pageData.frontmatter.description = resume.intro;
      pageData.frontmatter.head = [
        ...(pageData.frontmatter.head ?? []),
        ...pageMeta({
          title,
          description: resume.intro,
          url: `${SITE_URL}/resume`,
          image: resume.photo,
          jsonLd: personJsonLd,
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
  },
  buildEnd(siteConfig) {
    writeFileSync(join(siteConfig.outDir, "feed.xml"), generateFeed());
  },
  cleanUrls: true,
  head: [
    ["meta", { property: "og:site_name", content: "Dan Holloran" }],
    ["meta", { name: "twitter:card", content: "summary_large_image" }],
    [
      "script",
      {
        async: "",
        src: "https://www.googletagmanager.com/gtag/js?id=G-HRDP48J1X5",
      },
    ],
    [
      "script",
      {},
      "window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','G-HRDP48J1X5');",
    ],
    [
      "link",
      {
        rel: "alternate",
        type: "application/rss+xml",
        title: "DanHolloran",
        href: "https://danholloran.me/feed.xml",
      },
    ],
    [
      "link",
      { rel: "icon", type: "image/svg+xml", href: "/images/favicon.svg" },
    ],
    ["link", { rel: "icon", type: "image/png", href: "/images/favicon.png" }],

    ["link", { rel: "preconnect", href: "https://fonts.googleapis.com" }],
    [
      "link",
      {
        rel: "preconnect",
        href: "https://fonts.gstatic.com",
        crossorigin: "",
      },
    ],
    [
      "link",
      {
        href: "https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&family=JetBrains+Mono:ital,wght@0,100..800;1,100..800&display=swap",
        rel: "stylesheet",
      },
    ],
    [
      "meta",
      {
        name: "theme-color",
        content: "#fafaf9",
        media: "(prefers-color-scheme: light)",
      },
    ],
    [
      "meta",
      {
        name: "theme-color",
        content: "#0e0e10",
        media: "(prefers-color-scheme: dark)",
      },
    ],
  ],
});
