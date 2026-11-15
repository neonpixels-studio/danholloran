import { configDefaults, defineConfig } from "vitest/config";
import baseConfig from "./vitest.config";

// Runs only the post-build smoke test, against .vitepress/dist, so it must
// follow `npm run build`. The default config excludes it (see vitest.config.ts)
// because `npm run test:ci` runs before the build exists. Spread rather than
// mergeConfig, which would concatenate the default include list back in.
export default defineConfig({
  ...baseConfig,
  test: {
    ...baseConfig.test,
    include: [".vitepress/tests/dist/**/*.test.{js,ts}"],
    exclude: [...configDefaults.exclude],
  },
});
