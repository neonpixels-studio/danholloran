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
const CODE_FENCE = /^```/gm;
const MIN_BODY_IMAGES = 3;
const MIN_CODE_FENCES = 6;

function readAuditedUrls(): string[] {
  const config = JSON.parse(
    readFileSync(join(process.cwd(), LIGHTHOUSE_CONFIG_PATH), "utf8"),
  );
  return config.ci.collect.url;
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
    expect(urls).toContain(`${LIGHTHOUSE_ORIGIN}/resume${HTML_EXTENSION}`);
  });

  it("audits an image-heavy and a code-heavy post page", () => {
    const urls = readAuditedUrls();
    expect(urls).toContain(
      `${POST_URL_PREFIX}${IMAGE_HEAVY_POST_SLUG}${HTML_EXTENSION}`,
    );
    expect(urls).toContain(
      `${POST_URL_PREFIX}${CODE_HEAVY_POST_SLUG}${HTML_EXTENSION}`,
    );
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
    expect(countMatches(content, CODE_FENCE)).toBeGreaterThanOrEqual(
      MIN_CODE_FENCES,
    );
  });
});
