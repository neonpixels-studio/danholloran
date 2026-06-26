import { fileURLToPath, URL } from "node:url";
import { writeFileSync, readFileSync } from "fs";
import { join } from "path";
import { defineConfig } from "vitepress";
import tailwindcss from "@tailwindcss/vite";
import { generateFeed } from "./theme/utils/generateFeed";
import { generateLlmsTxt } from "./theme/utils/generateLlmsTxt";
import { parse as parsePlist } from "plist";
import { transformSitemapItems } from "./theme/utils/sitemap";
import { injectThemeBgTransformer } from "./theme/utils/codeTransformers";
import { transformPageData } from "./theme/utils/pageTransform";
import { SITE_URL, SITE_DESCRIPTION } from "./theme/utils/constants";

const darkTheme = parsePlist(
  readFileSync(
    new URL("./themes/grimicorn-dark.tmTheme", import.meta.url),
    "utf-8",
  ),
);
const lightTheme = parsePlist(
  readFileSync(
    new URL("./themes/grimicorn-light.tmTheme", import.meta.url),
    "utf-8",
  ),
);

export default defineConfig({
  title: "Dan Holloran",
  description: SITE_DESCRIPTION,
  sitemap: {
    hostname: SITE_URL,
    transformItems: transformSitemapItems,
  },
  markdown: {
    theme: {
      light: lightTheme as any,
      dark: darkTheme as any,
    },
    codeTransformers: [injectThemeBgTransformer],
  },
  vite: {
    build: { cssMinify: "esbuild" },
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
  transformPageData,
  buildEnd(siteConfig) {
    writeFileSync(join(siteConfig.outDir, "feed.xml"), generateFeed());
    writeFileSync(join(siteConfig.outDir, "llms.txt"), generateLlmsTxt());
  },
  cleanUrls: true,
  // Static assets under public/ are served as-is; keep their markdown
  // (e.g. the downloadable grimicorn-palette.md) out of page routing.
  srcExclude: ["public/**"],
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
        title: "Dan Holloran",
        href: "https://danholloran.me/feed.xml",
      },
    ],
    [
      "link",
      {
        rel: "icon",
        type: "image/png",
        href: "/images/favicon-96x96.png?v=20260515",
        sizes: "96x96",
      },
    ],
    [
      "link",
      {
        rel: "icon",
        type: "image/svg+xml",
        href: "/images/favicon.svg?v=20260515",
      },
    ],
    ["link", { rel: "shortcut icon", href: "/images/favicon.ico?v=20260515" }],
    [
      "link",
      {
        rel: "apple-touch-icon",
        sizes: "180x180",
        href: "/images/apple-touch-icon.png?v=20260515",
      },
    ],
    ["meta", { name: "apple-mobile-web-app-title", content: "Dan Holloran" }],
    ["link", { rel: "manifest", href: "/images/site.webmanifest?v=20260515" }],
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
        rel: "preload",
        as: "style",
        href: "https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&family=JetBrains+Mono:ital,wght@0,100..800;1,100..800&display=swap",
        onload: "this.onload=null;this.rel='stylesheet'",
      },
    ],
    [
      "noscript",
      {},
      '<link href="https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&family=JetBrains+Mono:ital,wght@0,100..800;1,100..800&display=swap" rel="stylesheet">',
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
