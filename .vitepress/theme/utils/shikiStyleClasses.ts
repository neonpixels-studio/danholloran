export type ShikiVariant = "light" | "dark";
export type Declaration = [property: string, value: string];

const SHIKI_VARIABLE =
  /^--shiki-(light|dark)(-font-style|-font-weight|-text-decoration)?$/;

// Shiki writes style as `--shiki-light:#aaa;--shiki-dark:#bbb;`.
export function declarationsFromStyle(style: string): Declaration[] {
  return style
    .split(";")
    .map((declaration) => declaration.trim())
    .filter(Boolean)
    .map((declaration) => {
      const separator = declaration.indexOf(":");
      if (separator === -1) {
        throw new Error(`Malformed inline style declaration "${declaration}"`);
      }
      return [
        declaration.slice(0, separator).trim(),
        declaration.slice(separator + 1).trim(),
      ];
    });
}

function slugOf(value: string): string {
  return value
    .toLowerCase()
    .replace(/^#/, "")
    .replace(/[^a-z0-9]+/g, "-");
}

export function shikiDeclarationClass(property: string, value: string): string {
  const match = SHIKI_VARIABLE.exec(property);
  if (!match) {
    throw new Error(
      `Unexpected inline style "${property}: ${value}" in highlighted code`,
    );
  }
  return `shk-${property.slice("--shiki-".length)}-${slugOf(value)}`;
}

function ruleFor([property, value]: Declaration): string {
  return `.${shikiDeclarationClass(property, value)} { ${property}: ${value}; }`;
}

const FONT_STYLE_DECLARATIONS: Record<string, Declaration> = {
  italic: ["font-style", "italic"],
  bold: ["font-weight", "bold"],
  underline: ["text-decoration", "underline"],
  strikethrough: ["text-decoration", "line-through"],
};

interface ThemeSetting {
  settings?: { foreground?: string; fontStyle?: string };
}

export interface ShikiThemeSource {
  settings: ThemeSetting[];
}

function foregroundDeclarations(
  variant: ShikiVariant,
  settings: ThemeSetting["settings"],
): Declaration[] {
  if (!settings?.foreground) {
    return [];
  }
  return [[`--shiki-${variant}`, settings.foreground]];
}

function fontStyleDeclarations(
  variant: ShikiVariant,
  settings: ThemeSetting["settings"],
): Declaration[] {
  return (settings?.fontStyle ?? "")
    .split(/\s+/)
    .map((token) => FONT_STYLE_DECLARATIONS[token])
    .filter((declaration): declaration is Declaration => Boolean(declaration))
    .map(([property, value]) => [`--shiki-${variant}-${property}`, value]);
}

function themeDeclarations(
  variant: ShikiVariant,
  theme: ShikiThemeSource,
): Declaration[] {
  return theme.settings.flatMap(({ settings }) => [
    ...foregroundDeclarations(variant, settings),
    ...fontStyleDeclarations(variant, settings),
  ]);
}

// Shiki merges underline + strikethrough into one declaration.
function combinedDecoration(variant: ShikiVariant): Declaration {
  return [`--shiki-${variant}-text-decoration`, "underline line-through"];
}

// When the two themes disagree on a token, Shiki fills the missing side with
// `inherit` for every variable.
const INHERITABLE_VARIABLE_SUFFIXES = [
  "",
  "-font-style",
  "-font-weight",
  "-text-decoration",
];

function inheritDeclarations(variant: ShikiVariant): Declaration[] {
  return INHERITABLE_VARIABLE_SUFFIXES.map((suffix) => [
    `--shiki-${variant}${suffix}`,
    "inherit",
  ]);
}

export type ShikiThemePair = Record<ShikiVariant, ShikiThemeSource>;

export function buildShikiClassCss(themes: ShikiThemePair): string {
  const declarations = [
    ...themeDeclarations("light", themes.light),
    ...themeDeclarations("dark", themes.dark),
    combinedDecoration("light"),
    combinedDecoration("dark"),
    ...inheritDeclarations("light"),
    ...inheritDeclarations("dark"),
  ];
  const rules = new Map(
    declarations.map((declaration) => [
      shikiDeclarationClass(...declaration),
      ruleFor(declaration),
    ]),
  );
  return [...rules.values()].sort().join("\n");
}
