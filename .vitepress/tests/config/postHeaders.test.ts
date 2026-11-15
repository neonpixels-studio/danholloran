// @vitest-environment node
import { describe, it, expect, vi } from "vitest";
import {
  createMarkdownRenderer,
  disposeMdItInstance,
  type MarkdownOptions,
} from "vitepress";
import { configureMarkdown } from "../../theme/utils/configureMarkdown";
import type { PostHeader } from "../../theme/utils/postHeaders";

// config.ts asserts committed image variants are current as a module-load
// side effect; stubbing it keeps this test about markdown options only.
vi.mock("../../theme/utils/imageVariantManifest", async (importOriginal) => ({
  ...(await importOriginal<
    typeof import("../../theme/utils/imageVariantManifest")
  >()),
  assertImageVariantsUpToDate: vi.fn(),
}));

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

async function loadRealMarkdownOptions(): Promise<MarkdownOptions> {
  const { default: siteConfig } = await import("../../config");
  if (!siteConfig.markdown) {
    throw new Error("config.ts no longer defines markdown options");
  }
  return siteConfig.markdown;
}

describe("post page headers", () => {
  it("extracts the h2s of a body wrapped like posts/[slug].md using the real site config", async () => {
    disposeMdItInstance();
    const md = await createMarkdownRenderer(
      process.cwd(),
      await loadRealMarkdownOptions(),
    );
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
