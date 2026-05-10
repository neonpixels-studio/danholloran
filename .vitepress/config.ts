import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vitepress";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  title: "Dan Holloran",
  description: "Full-stack developer and photographer based in Reno, NV.",
  vite: {
    plugins: [tailwindcss()],
    resolve: {
      alias: {
        "@": fileURLToPath(new URL(".", import.meta.url)),
        "@components": fileURLToPath(
          new URL("./theme/components", import.meta.url),
        ),
        "@theme": fileURLToPath(new URL("./theme", import.meta.url)),
        "@types": fileURLToPath(new URL("./types", import.meta.url)),
        "@data": fileURLToPath(new URL("./data", import.meta.url)),
        "@content": fileURLToPath(new URL("./content", import.meta.url)),
      },
    },
  },
  cleanUrls: true,
  ignoreDeadLinks: true, // @todo Fix the links
  head: [
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
  ],
});
