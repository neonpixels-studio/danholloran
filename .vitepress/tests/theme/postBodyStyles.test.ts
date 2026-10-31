import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, it, expect } from "vitest";

const POST_VIEW_PATH = resolve(
  process.cwd(),
  ".vitepress/theme/views/PostView.vue",
);

function readPostViewStyles(): string {
  const source = readFileSync(POST_VIEW_PATH, "utf8");
  const styleBlock = source.match(/<style>([\s\S]*?)<\/style>/);
  if (!styleBlock) {
    throw new Error("PostView.vue has no <style> block");
  }
  return styleBlock[1].replace(/\/\*[\s\S]*?\*\//g, "");
}

function ruleBodyFor(css: string, selector: string): string {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  // Anchor to the previous rule's close so selector lists don't match a member.
  const rule = css.match(
    new RegExp(`(?:^|\\})\\s*${escaped}\\s*\\{([^}]*)\\}`),
  );
  if (!rule) {
    throw new Error(`No standalone rule for "${selector}"`);
  }
  return rule[1];
}

describe("post body styles", () => {
  const css = readPostViewStyles();

  it("restores bullets on unordered lists stripped by Tailwind preflight", () => {
    expect(ruleBodyFor(css, ".post-body ul")).toMatch(/\blist-disc\b/);
  });

  it("restores numbers on ordered lists stripped by Tailwind preflight", () => {
    expect(ruleBodyFor(css, ".post-body ol")).toMatch(/\blist-decimal\b/);
  });

  it("borders table cells so rows and columns are distinguishable", () => {
    const cellRule = ruleBodyFor(css, ".post-body th,\n.post-body td");
    expect(cellRule).toMatch(/\bborder-b\b/);
    expect(cellRule).toMatch(/\bpx-\d/);
  });

  it("lets wide tables scroll horizontally instead of overflowing the column", () => {
    expect(ruleBodyFor(css, ".post-body .table-scroll")).toMatch(
      /\boverflow-x-auto\b/,
    );
  });

  it("stretches narrow tables to fill the column with no gap on the right", () => {
    const tableRule = ruleBodyFor(css, ".post-body table");
    expect(tableRule).toMatch(/\bw-full\b/);
    expect(tableRule).not.toMatch(/\bblock\b/);
  });

  it("distinguishes table headers from body cells", () => {
    expect(ruleBodyFor(css, ".post-body th")).toMatch(/\bfont-semibold\b/);
  });
});
