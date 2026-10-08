import type { HeadConfig } from "vitepress";

// Only the upright faces are preloaded: they render on every page, while the
// italic faces are rare enough to load on demand via @font-face.
export const PRELOADED_FONT_FILES = [
  "inter-latin-opsz-normal.woff2",
  "jetbrains-mono-latin-wght-normal.woff2",
];

// Vite emits imported fonts as `/assets/<name>.<content-hash>.woff2`.
function findBuiltFontUrl(assets: string[], fileName: string): string {
  const baseName = fileName.replace(/\.woff2$/, "");
  const builtUrl = assets.find((assetUrl) =>
    new RegExp(`/assets/${baseName}\\.[\\w-]+\\.woff2$`).test(assetUrl),
  );
  if (!builtUrl) {
    throw new Error(
      `Preloaded font ${fileName} was not found in the built assets; check it is referenced from style.css.`,
    );
  }
  return builtUrl;
}

export function buildFontPreloadHeadEntries(assets: string[]): HeadConfig[] {
  // Fonts are always fetched in CORS mode, so preload needs crossorigin even
  // for same-origin files or the preload is discarded and the font refetched.
  return PRELOADED_FONT_FILES.map((fileName) => [
    "link",
    {
      rel: "preload",
      as: "font",
      type: "font/woff2",
      href: findBuiltFontUrl(assets, fileName),
      crossorigin: "",
    },
  ]);
}
