import {
  declarationsFromStyle,
  shikiDeclarationClass,
} from "./shikiStyleClasses";

type ClassValue = string | string[] | undefined;

interface HastNode {
  properties: { style?: unknown; class?: ClassValue };
}

function classesOf(value: ClassValue): string[] {
  if (Array.isArray(value)) {
    return value;
  }
  return value ? value.split(/\s+/).filter(Boolean) : [];
}

// A hashed CSP cannot cover inline style attributes, so every Shiki
// declaration (--shiki-light, --shiki-dark-font-style, ...) becomes a class
// named after its value. The stylesheet for those classes is generated from
// the themes (themeStylesheet.ts), so the names need no shared state.
function moveStyleToClasses(node: HastNode) {
  const style = node.properties.style;
  if (typeof style !== "string") {
    return;
  }
  const classes = declarationsFromStyle(style).map(([property, value]) =>
    shikiDeclarationClass(property, value),
  );
  node.properties.class = [...classesOf(node.properties.class), ...classes];
  delete node.properties.style;
}

export const styleToClassTransformer = {
  name: "style-to-class",
  pre: moveStyleToClasses,
  code: moveStyleToClasses,
  line: moveStyleToClasses,
  span: moveStyleToClasses,
};
