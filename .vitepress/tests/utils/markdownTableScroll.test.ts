import { describe, it, expect } from "vitest";
import { createMarkdownRenderer, disposeMdItInstance } from "vitepress";
import { configureMarkdown } from "../../theme/utils/configureMarkdown";

const TABLE_MARKDOWN = "| Block | Fee |\n| --- | --- |\n| n | 1.00 |\n";

async function renderWithSiteConfig(markdown: string): Promise<string> {
  // createMarkdownRenderer caches one instance per process and ignores its
  // arguments once one exists, so dispose it to get this test's config.
  disposeMdItInstance();
  const md = await createMarkdownRenderer(process.cwd(), {
    config: configureMarkdown,
  });
  return md.render(markdown);
}

describe("markdown table scroll wrapper", () => {
  it("wraps a table in the scroll container", async () => {
    const html = await renderWithSiteConfig(TABLE_MARKDOWN);
    expect(html).toMatch(
      /<div class="table-scroll">\s*<table[\s\S]*<\/table>\s*<\/div>/,
    );
  });

  it("wraps each table separately", async () => {
    const html = await renderWithSiteConfig(
      `${TABLE_MARKDOWN}\nBetween\n\n${TABLE_MARKDOWN}`,
    );
    expect(html.match(/<div class="table-scroll">/g)).toHaveLength(2);
    expect(html.match(/<\/table>\s*<\/div>/g)).toHaveLength(2);
  });

  it("leaves content without tables unwrapped", async () => {
    const html = await renderWithSiteConfig("Just a paragraph.");
    expect(html).not.toContain("table-scroll");
  });
});
