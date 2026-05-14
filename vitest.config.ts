import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vitest/config";
import vue from "@vitejs/plugin-vue";

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL(".vitepress", import.meta.url)),
      "@components": fileURLToPath(
        new URL(".vitepress/theme/components", import.meta.url),
      ),
      "@theme": fileURLToPath(new URL(".vitepress/theme", import.meta.url)),
      "@typedef": fileURLToPath(new URL(".vitepress/types", import.meta.url)),
      "@typedefs": fileURLToPath(new URL(".vitepress/types", import.meta.url)),
      "@data": fileURLToPath(new URL(".vitepress/data", import.meta.url)),
      "@composables": fileURLToPath(
        new URL(".vitepress/theme/composables", import.meta.url),
      ),
      "@content": fileURLToPath(new URL(".vitepress/content", import.meta.url)),
      "@utils": fileURLToPath(
        new URL(".vitepress/theme/utils", import.meta.url),
      ),
      "@views": fileURLToPath(
        new URL(".vitepress/theme/views", import.meta.url),
      ),
    },
  },
  test: {
    environment: "happy-dom",
    env: { TZ: "UTC" },
    include: [".vitepress/tests/**/*.test.{js,ts}"],
  },
});
