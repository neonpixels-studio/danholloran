import { defineConfig } from "vitepress";
import path from "path";
import tailwindcss from "@tailwindcss/vite";

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: "Dan Holloran",
  description:
    "I'm a Full Stack Developer and Photographer currently based in St. Louis. I love traveling and enjoy mentoring others. Let's create something amazing together!",
  vite: {
    plugins: [tailwindcss()],
  },
});
