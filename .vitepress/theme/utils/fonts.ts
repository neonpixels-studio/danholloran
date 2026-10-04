import type { HeadConfig } from "vitepress";

const FONTS_BASE_PATH = "/fonts";

// Only the upright faces are preloaded: they render on every page, while the
// italic faces are rare enough to load on demand via @font-face.
export const PRELOADED_FONT_FILES = [
  "inter-latin-opsz-normal.woff2",
  "jetbrains-mono-latin-wght-normal.woff2",
];

export function buildFontPreloadHeadEntries(): HeadConfig[] {
  // Fonts are always fetched in CORS mode, so preload needs crossorigin even
  // for same-origin files or the preload is discarded and the font refetched.
  return PRELOADED_FONT_FILES.map((fileName) => [
    "link",
    {
      rel: "preload",
      as: "font",
      type: "font/woff2",
      href: `${FONTS_BASE_PATH}/${fileName}`,
      crossorigin: "",
    },
  ]);
}
