import { describe, it, expect } from "vitest";
import { createMarkdownRenderer, disposeMdItInstance } from "vitepress";
import { configureMarkdown } from "../../theme/utils/configureMarkdown";
import {
  POST_MARKDOWN_HEADERS,
  type PostHeader,
} from "../../theme/utils/postHeaders";

// Shaped like posts/[slug].md: the body sits inside a v-pre wrapper.
const POST_PAGE_SOURCE = [
  '<PostView v-bind="params.postNeighbors">',
  "<div v-pre>",
  "",
  "## One",
  "",
  "## Two",
  "",
  "### Nested",
  "",
  "## Three",
  "",
  "## Four",
  "",
  "</div>",
  "</PostView>",
].join("\n");

describe("post page headers", () => {
  it("extracts the h2s of a body wrapped like posts/[slug].md", async () => {
    disposeMdItInstance();
    const md = await createMarkdownRenderer(process.cwd(), {
      headers: POST_MARKDOWN_HEADERS,
      config: configureMarkdown,
    });
    const env: { headers?: PostHeader[] } = {};
    md.render(POST_PAGE_SOURCE, env);
    expect(env.headers?.map((header) => header.link)).toEqual([
      "#one",
      "#two",
      "#three",
      "#four",
    ]);
  });

  it("extracts nothing without the headers option", async () => {
    disposeMdItInstance();
    const md = await createMarkdownRenderer(process.cwd(), {
      config: configureMarkdown,
    });
    const env: { headers?: PostHeader[] } = {};
    md.render(POST_PAGE_SOURCE, env);
    expect(env.headers ?? []).toEqual([]);
  });
});
