export type Declaration = [property: string, value: string];

const SHIKI_VARIABLE =
  /^--shiki-(light|dark)(-bg|-font-style|-font-weight|-text-decoration)?$/;

// Shiki writes style as `--shiki-light:#aaa;--shiki-dark:#bbb;`.
export function declarationsFromStyle(style: string): Declaration[] {
  return style
    .split(";")
    .map((declaration) => declaration.trim())
    .filter(Boolean)
    .map((declaration) => {
      const separator = declaration.indexOf(":");
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

function themeDeclarations(
  variant: "light" | "dark",
  theme: ShikiThemeSource,
): Declaration[] {
  const declarations: Declaration[] = [];
  for (const { settings } of theme.settings) {
    if (settings?.foreground) {
      declarations.push([`--shiki-${variant}`, settings.foreground]);
    }
    for (const token of (settings?.fontStyle ?? "").split(/\s+/)) {
      const known = FONT_STYLE_DECLARATIONS[token];
      if (known) {
        declarations.push([`--shiki-${variant}-${known[0]}`, known[1]]);
      }
    }
  }
  return declarations;
}

// Shiki merges underline + strikethrough into one declaration.
function combinedDecoration(variant: "light" | "dark"): Declaration {
  return [`--shiki-${variant}-text-decoration`, "underline line-through"];
}

export function buildShikiClassCss(themes: {
  light: ShikiThemeSource;
  dark: ShikiThemeSource;
}): string {
  const declarations = [
    ...themeDeclarations("light", themes.light),
    ...themeDeclarations("dark", themes.dark),
    combinedDecoration("light"),
    combinedDecoration("dark"),
  ];
  const rules = new Map(
    declarations.map((declaration) => [
      shikiDeclarationClass(...declaration),
      ruleFor(declaration),
    ]),
  );
  return [...rules.values()].sort().join("\n");
}
