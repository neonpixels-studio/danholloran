import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@typedef": fileURLToPath(new URL(".vitepress/types", import.meta.url)),
      "@typedefs": fileURLToPath(new URL(".vitepress/types", import.meta.url)),
    },
  },
  test: {
    include: [".vitepress/tests/**/*.test.{js,ts}"],
  },
});
