import { defineConfig } from "vitepress";
import svgLoader from "vite-svg-loader";
import path from "path";
import { usePreferredDark } from "@vueuse/core";

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: "Dan Holloran",
  description:
    "Full Stack Developer and Photographer based in St. Louis. I love traveling and enjoy mentoring others. Let's create something amazing together!",
  cleanUrls: true,
  appearance: usePreferredDark,
  ignoreDeadLinks: true, // @todo Fix links
  head: [
    [
      "meta",
      {
        name: "theme-color",
        content: "#D85CF6",
      },
    ],
    ["link", { rel: "icon", href: "/images/favicon.svg" }],
    ["link", { rel: "preconnect", href: "https://fonts.googleapis.com" }],
    [
      "link",
      {
        rel: "preconnect",
        href: "https://fonts.gstatic.com",
        crossorigin: true,
      },
    ],
    [
      "link",
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Figtree:wght@300;400;700&family=Fira+Code&family=Young+Serif&display=swap",
      },
    ],
    // @todo Analytics, etc.
  ],
  sitemap: {
    hostname: "https://danholloran.me",
  },
  lastUpdated: true,
  vite: {
    plugins: [svgLoader()],
    resolve: {
      alias: [{ find: "@", replacement: path.resolve(__dirname, "./../src") }],
    },
  },
});
