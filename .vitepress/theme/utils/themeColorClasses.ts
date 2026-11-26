const HEX_COLOR = /^#[0-9a-f]{6}$/i;
const GLOW_BLUR_PX = 22;
const GLOW_ALPHA_HEX = "66";

export type ColorKind = "bg" | "text" | "border" | "glow";
type RuleBody = (_hex: string) => string;

const RULE_BODY_BY_KIND: Record<ColorKind, RuleBody> = {
  bg: (hex) => `background: ${hex}`,
  text: (hex) => `color: ${hex}`,
  border: (hex) => `border-color: ${hex}`,
  glow: (hex) => `box-shadow: 0 0 ${GLOW_BLUR_PX}px ${hex}${GLOW_ALPHA_HEX}`,
};

function assertHexColor(hex: string): string {
  if (!HEX_COLOR.test(hex)) {
    throw new Error(`Expected a 6-digit hex color, got "${hex}"`);
  }
  return hex.toLowerCase();
}

export function colorClass(kind: ColorKind, hex: string): string {
  return `hex-${kind}-${assertHexColor(hex).slice(1)}`;
}

function uniqueHexes(hexes: readonly string[]): string[] {
  return [...new Set(hexes.map(assertHexColor))].sort();
}

function colorRules(hexes: readonly string[]): string[] {
  return uniqueHexes(hexes).flatMap((hex) =>
    (Object.keys(RULE_BODY_BY_KIND) as ColorKind[]).map(
      (kind) =>
        `.${colorClass(kind, hex)} { ${RULE_BODY_BY_KIND[kind](hex)}; }`,
    ),
  );
}

export function rainbowGradient(stops: readonly string[]): string {
  const looped = [...stops, stops[0]].map(assertHexColor);
  return `linear-gradient(90deg, ${looped.join(", ")})`;
}

// Generated from the theme data so the pages carry classes instead of inline
// style attributes (which a hashed CSP cannot cover).
export function buildColorClassesCss(options: {
  hexes: readonly string[];
  rainbowStops: readonly string[];
  copyFailedColor: string;
}): string {
  return [
    ...colorRules(options.hexes),
    `.hex-rainbow-gradient { background-image: ${rainbowGradient(options.rainbowStops)}; }`,
    `.hex-copy-failed { --n-copy-failed: ${assertHexColor(options.copyFailedColor)}; }`,
  ].join("\n");
}
