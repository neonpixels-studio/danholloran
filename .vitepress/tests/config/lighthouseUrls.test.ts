import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, it, expect } from "vitest";
import { parseFrontmatter } from "../../theme/utils/frontmatter";
import { isPublished } from "../../theme/utils/loadPublishedPosts";

const LIGHTHOUSE_CONFIG_PATH = ".lighthouserc.json";
const LIGHTHOUSE_ORIGIN = "http://localhost";
const POSTS_DIR = ".vitepress/content/posts";
// lhci's static server (staticDistDir) does not apply cleanUrls, so
// extensionless URLs 404; audited pages must name the built .html file.
const HTML_EXTENSION = ".html";
const POST_URL_PREFIX = `${LIGHTHOUSE_ORIGIN}/posts/`;
const IMAGE_HEAVY_POST_SLUG = "wp-better-attachments";
const CODE_HEAVY_POST_SLUG = "laravel-and-websockets";
const MARKDOWN_IMAGE = /!\[[^\]]*\]\(/g;
// Counts opening and closing fence lines, so two per code block.
const CODE_FENCE = /^(```|~~~)/gm;
const FENCES_PER_CODE_BLOCK = 2;
const MIN_BODY_IMAGES = 3;
const MIN_CODE_BLOCKS = 3;

function readAuditedUrls(): string[] {
  const config = JSON.parse(
    readFileSync(join(process.cwd(), LIGHTHOUSE_CONFIG_PATH), "utf8"),
  );
  const urls = config.ci.collect.url;
  expect(Array.isArray(urls), "ci.collect.url must be an array").toBe(true);
  return urls;
}

function pageUrl(pagePath: string): string {
  return `${LIGHTHOUSE_ORIGIN}/${pagePath}${HTML_EXTENSION}`;
}

function postUrl(slug: string): string {
  return pageUrl(`posts/${slug}`);
}

function readPost(slug: string) {
  const filePath = join(process.cwd(), POSTS_DIR, `${slug}.md`);
  expect(existsSync(filePath), `${filePath} must exist`).toBe(true);
  return parseFrontmatter(readFileSync(filePath, "utf8"));
}

function countMatches(text: string, pattern: RegExp): number {
  return text.match(pattern)?.length ?? 0;
}

describe(".lighthouserc.json collect.url", () => {
  it("audits the home page, the blog index and the resume page", () => {
    const urls = readAuditedUrls();
    expect(urls).toContain(`${LIGHTHOUSE_ORIGIN}/`);
    expect(urls).toContain(POST_URL_PREFIX);
    expect(urls).toContain(pageUrl("resume"));
  });

  it("audits an image-heavy and a code-heavy post page", () => {
    const urls = readAuditedUrls();
    expect(urls).toContain(postUrl(IMAGE_HEAVY_POST_SLUG));
    expect(urls).toContain(postUrl(CODE_HEAVY_POST_SLUG));
  });

  it("only uses URLs the static server can resolve", () => {
    const unresolvable = readAuditedUrls().filter(
      (url) => !url.endsWith("/") && !url.endsWith(HTML_EXTENSION),
    );
    expect(unresolvable).toEqual([]);
  });

  it("backs every non-post page URL with a root-level markdown source", () => {
    const pagePaths = readAuditedUrls()
      .filter((url) => url.endsWith(HTML_EXTENSION))
      .filter((url) => !url.startsWith(POST_URL_PREFIX))
      .map((url) =>
        url.slice(`${LIGHTHOUSE_ORIGIN}/`.length, -HTML_EXTENSION.length),
      );
    expect(pagePaths).toContain("resume");
    pagePaths.forEach((pagePath) => {
      expect(existsSync(join(process.cwd(), `${pagePath}.md`))).toBe(true);
    });
  });

  it("only points at published posts so the audited URL never 404s", () => {
    const slugs = readAuditedUrls()
      .filter(
        (url) =>
          url.startsWith(POST_URL_PREFIX) && url.endsWith(HTML_EXTENSION),
      )
      .map((url) => url.slice(POST_URL_PREFIX.length, -HTML_EXTENSION.length))
      .filter(Boolean);
    expect(slugs.length).toBeGreaterThan(0);
    slugs.forEach((slug) => {
      const { data } = readPost(slug);
      expect(isPublished(data, slug)).toBe(true);
    });
  });

  it("keeps the image-heavy post image-heavy (hero plus in-body images)", () => {
    const { data, content } = readPost(IMAGE_HEAVY_POST_SLUG);
    expect(data.image).toBeTruthy();
    expect(countMatches(content, MARKDOWN_IMAGE)).toBeGreaterThanOrEqual(
      MIN_BODY_IMAGES,
    );
  });

  it("keeps the code-heavy post code-heavy", () => {
    const { content } = readPost(CODE_HEAVY_POST_SLUG);
    const codeBlocks =
      countMatches(content, CODE_FENCE) / FENCES_PER_CODE_BLOCK;
    expect(codeBlocks).toBeGreaterThanOrEqual(MIN_CODE_BLOCKS);
  });
});
