import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: [".vitepress/tests/**/*.test.{js,ts}"],
  },
});
