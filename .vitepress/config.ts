import { fileURLToPath, URL } from "node:url";
import { writeFileSync } from "fs";
import { join } from "path";
import { defineConfig } from "vitepress";
import tailwindcss from "@tailwindcss/vite";
import { generateFeed } from "./utils/generateFeed";

export default defineConfig({
  title: "Dan Holloran",
  description: "Full-stack developer and photographer based in Reno, NV.",
  sitemap: {
    hostname: "https://danholloran.me",
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
          new URL("./composables", import.meta.url),
        ),
        "@content": fileURLToPath(new URL("./content", import.meta.url)),
        "@utils": fileURLToPath(new URL("./utils", import.meta.url)),
        "@views": fileURLToPath(new URL("./views", import.meta.url)),
      },
    },
  },
  buildEnd(siteConfig) {
    writeFileSync(join(siteConfig.outDir, "feed.xml"), generateFeed());
  },
  cleanUrls: true,
  head: [
    [
      "link",
      {
        rel: "alternate",
        type: "application/rss+xml",
        title: "DanHolloran",
        href: "https://danholloran.me",
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
