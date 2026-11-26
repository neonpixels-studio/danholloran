import { HUES, BG_DARK, BG_LIGHT } from "./grimicornTheme";
import { NEON_HUES, NEON_BG, NEON_RAINBOW } from "./grimicornNeonTheme";

export const TRAFFIC_LIGHT_COLORS = ["#dd9787", "#dada93", "#a9ce93"] as const;

// Colors the theme views name directly in their templates, as hex-<kind>-<hex>
// classes (see themeColorClasses.ts). Each must appear here so its class is
// generated; inlineStyles.test.ts checks the templates against this list.
const TEMPLATE_COLORS = [
  // Grimicorn preview toggle dots and the accent hierarchy sentence
  "#83afe5",
  "#4a80c8",
  "#9a93e1",
  "#80c1ca",
  // Grimicorn Neon text, borders, and glow
  "#e7e5e4",
  "#a7a39c",
  "#75726b",
  "#1c1c20",
  "#22d3ee",
];

// Label colors for the Grimicorn background scale, by preview mode (the lighter dark-mode steps need brighter text).
export const BG_SCALE_LABEL_COLORS = {
  light: "#3C4C55",
  dark: "#BFBFBF",
  darkOnLighterSteps: "#E5E5E5",
};

export const NEON_COPY_FAILED_COLOR = NEON_RAINBOW[0];

export const THEME_COLOR_HEXES: string[] = [
  ...TRAFFIC_LIGHT_COLORS,
  ...TEMPLATE_COLORS,
  ...Object.values(BG_SCALE_LABEL_COLORS),
  ...HUES.flatMap((hue) => [hue.dark, hue.light]),
  ...BG_DARK,
  ...BG_LIGHT,
  ...NEON_HUES.map((hue) => hue.hex),
  ...NEON_BG,
  ...NEON_RAINBOW,
];
