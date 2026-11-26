import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, it, expect } from "vitest";

const DIST_DIRECTORY = join(process.cwd(), ".vitepress/dist");
const GENERATED_CLASS = /\b(?:shk|hex)-[a-z0-9-]+/g;

function filesWithSuffix(suffix: string): string[] {
  return readdirSync(DIST_DIRECTORY, { recursive: true, encoding: "utf8" })
    .filter((entry) => entry.endsWith(suffix))
    .map((entry) => join(DIST_DIRECTORY, entry));
}

function classesUsedInPages(): Set<string> {
  const used = new Set<string>();
  for (const page of filesWithSuffix(".html")) {
    const markup = readFileSync(page, "utf8");
    const attributes = markup.match(/class="[^"]*"/g) ?? [];
    attributes
      .flatMap((attribute) => attribute.match(GENERATED_CLASS) ?? [])
      .forEach((name) => used.add(name));
  }
  return used;
}

function builtStylesheet(): string {
  return filesWithSuffix(".css")
    .map((file) => readFileSync(file, "utf8"))
    .join("\n");
}

// The code highlighting and theme swatch classes are named by value but
// defined from the theme data, so a color the data misses would silently
// render unstyled. This proves every class a page uses has a rule.
describe("generated style classes in the built site", () => {
  it("defines every shk-* and hex-* class a page uses", () => {
    const used = classesUsedInPages();
    const stylesheet = builtStylesheet();

    expect(used.size).toBeGreaterThan(0);
    const undefinedClasses = [...used].filter(
      (name) => !stylesheet.includes(`.${name}{`),
    );
    expect(undefinedClasses).toEqual([]);
  });

  it("leaves no inline style attribute on any page", () => {
    const withInlineStyle = filesWithSuffix(".html").filter((page) =>
      /<[a-z0-9]+(?:\s[^>]*)?\sstyle="/.test(readFileSync(page, "utf8")),
    );

    expect(withInlineStyle).toEqual([]);
  });
});
