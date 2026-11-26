import { buildColorClassesCss } from "./themeColorClasses";
import { buildShikiClassCss, type ShikiThemeSource } from "./shikiStyleClasses";
import { NEON_RAINBOW } from "../../data/grimicornNeonTheme";
import {
  NEON_COPY_FAILED_COLOR,
  THEME_COLOR_HEXES,
} from "../../data/themeColors";

export const THEME_STYLESHEET_MODULE = "virtual:theme-classes.css";
const RESOLVED_MODULE_ID = `\0${THEME_STYLESHEET_MODULE}`;

export function buildThemeStylesheet(shikiThemes: {
  light: ShikiThemeSource;
  dark: ShikiThemeSource;
}): string {
  return [
    "/* Generated from the theme data; see themeStylesheet.ts. */",
    buildShikiClassCss(shikiThemes),
    buildColorClassesCss({
      hexes: THEME_COLOR_HEXES,
      rainbowStops: NEON_RAINBOW,
      copyFailedColor: NEON_COPY_FAILED_COLOR,
    }),
  ].join("\n");
}

// Serves the stylesheet as a virtual CSS module so code highlighting colors
// and theme swatches ship as classes rather than style attributes.
export function themeStylesheetPlugin(shikiThemes: {
  light: ShikiThemeSource;
  dark: ShikiThemeSource;
}) {
  return {
    name: "theme-stylesheet",
    resolveId(id: string) {
      return id === THEME_STYLESHEET_MODULE ? RESOLVED_MODULE_ID : undefined;
    },
    load(id: string) {
      return id === RESOLVED_MODULE_ID
        ? buildThemeStylesheet(shikiThemes)
        : undefined;
    },
  };
}
