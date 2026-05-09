import { defineConfig } from "vitepress";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  title: "Dan Holloran",
  description: "Full-stack developer and photographer based in Reno, NV.",
  vite: {
    plugins: [tailwindcss()],
  },
});
