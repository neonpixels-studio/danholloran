import type { HeadConfig } from "vitepress";

// Must match --color-bg in style.css (`@theme` for light, `html.dark` for
// dark); webManifest.test.ts enforces it, along with the manifest's values.
export const THEME_COLOR_LIGHT = "#fafaf9";
export const THEME_COLOR_DARK = "#0e0e10";

export function buildThemeColorHeadEntries(): HeadConfig[] {
  return [
    [
      "meta",
      {
        name: "theme-color",
        content: THEME_COLOR_LIGHT,
        media: "(prefers-color-scheme: light)",
      },
    ],
    [
      "meta",
      {
        name: "theme-color",
        content: THEME_COLOR_DARK,
        media: "(prefers-color-scheme: dark)",
      },
    ],
  ];
}
