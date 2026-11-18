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
const POSTS_PATH_PREFIX = "posts/";
const POST_URL_PREFIX = `${LIGHTHOUSE_ORIGIN}/${POSTS_PATH_PREFIX}`;
const CODE_HEAVY_POST_SLUG = "laravel-and-websockets";
// Counts opening and closing fence lines, so two per code block.
const CODE_FENCE = /^(```|~~~)/gm;
const FENCES_PER_CODE_BLOCK = 2;
const MIN_CODE_BLOCKS = 3;

function readAuditedUrls(): string[] {
  const config = JSON.parse(
    readFileSync(join(process.cwd(), LIGHTHOUSE_CONFIG_PATH), "utf8"),
  );
  const urls = config?.ci?.collect?.url;
  expect(Array.isArray(urls), "ci.collect.url must be an array").toBe(true);
  return urls;
}

function pageUrl(pagePath: string): string {
  return `${LIGHTHOUSE_ORIGIN}/${pagePath}${HTML_EXTENSION}`;
}

function postUrl(slug: string): string {
  return pageUrl(`${POSTS_PATH_PREFIX}${slug}`);
}

function readPost(slug: string) {
  const filePath = join(process.cwd(), POSTS_DIR, `${slug}.md`);
  expect(existsSync(filePath), `${filePath} must exist`).toBe(true);
  return parseFrontmatter(readFileSync(filePath, "utf8"));
}

function readAuditedPagePaths(): string[] {
  return readAuditedUrls()
    .filter((url) => url.endsWith(HTML_EXTENSION))
    .map((url) =>
      url.slice(`${LIGHTHOUSE_ORIGIN}/`.length, -HTML_EXTENSION.length),
    );
}

function countMatches(text: string, pattern: RegExp): number {
  return text.match(pattern)?.length ?? 0;
}

describe(".lighthouserc.json collect.url", () => {
  // The blog index (a grid of post hero images) is the image-heavy audit target.
  it("audits the home page, the blog index and the resume page", () => {
    const urls = readAuditedUrls();
    expect(urls).toContain(`${LIGHTHOUSE_ORIGIN}/`);
    expect(urls).toContain(POST_URL_PREFIX);
    expect(urls).toContain(pageUrl("resume"));
  });

  it("audits a code-heavy post page", () => {
    const urls = readAuditedUrls();
    expect(urls).toContain(postUrl(CODE_HEAVY_POST_SLUG));
  });

  it("only uses URLs the static server can resolve", () => {
    const unresolvable = readAuditedUrls().filter(
      (url) => !url.endsWith("/") && !url.endsWith(HTML_EXTENSION),
    );
    expect(unresolvable).toEqual([]);
  });

  it("backs every non-post page URL with a root-level markdown source", () => {
    const pagePaths = readAuditedPagePaths().filter(
      (pagePath) => !pagePath.startsWith(POSTS_PATH_PREFIX),
    );
    expect(pagePaths.length).toBeGreaterThan(0);
    pagePaths.forEach((pagePath) => {
      const sourcePath = join(process.cwd(), `${pagePath}.md`);
      expect(existsSync(sourcePath), `${sourcePath} must exist`).toBe(true);
    });
  });

  it("only points at published posts so the audited URL never 404s", () => {
    const slugs = readAuditedPagePaths()
      .filter((pagePath) => pagePath.startsWith(POSTS_PATH_PREFIX))
      .map((pagePath) => pagePath.slice(POSTS_PATH_PREFIX.length));
    expect(slugs.length).toBeGreaterThan(0);
    slugs.forEach((slug) => {
      const { data } = readPost(slug);
      expect(isPublished(data, slug)).toBe(true);
    });
  });

  it("keeps the code-heavy post code-heavy", () => {
    const { content } = readPost(CODE_HEAVY_POST_SLUG);
    const codeBlocks =
      countMatches(content, CODE_FENCE) / FENCES_PER_CODE_BLOCK;
    expect(codeBlocks).toBeGreaterThanOrEqual(MIN_CODE_BLOCKS);
  });
});

const IMAGE_BUDGET_ASSERTIONS = [
  "total-byte-weight",
  "unsized-images",
  "image-size-responsive",
];
// Measured 345-375 KB on the audited pages (Nov 2026); leaves headroom for
// normal growth while still catching an unoptimized image shipping.
const MAX_BUDGET_BYTES = 600_000;

function readImageBudget() {
  const config = JSON.parse(
    readFileSync(join(process.cwd(), LIGHTHOUSE_CONFIG_PATH), "utf8"),
  );
  const matrix = config?.ci?.assert?.assertMatrix;
  expect(Array.isArray(matrix), "assertMatrix must be an array").toBe(true);
  return matrix.find((entry) => entry.assertions["total-byte-weight"]);
}

describe(".lighthouserc.json image and page weight budget", () => {
  it("applies to the blog index and the code-heavy post only", () => {
    const pattern = new RegExp(readImageBudget().matchingUrlPattern);
    expect(pattern.test(POST_URL_PREFIX)).toBe(true);
    expect(pattern.test(postUrl(CODE_HEAVY_POST_SLUG))).toBe(true);
    expect(pattern.test(`${LIGHTHOUSE_ORIGIN}/`)).toBe(false);
    expect(pattern.test(pageUrl("resume"))).toBe(false);
  });

  it("asserts page weight and image sizing as errors", () => {
    const { assertions } = readImageBudget();
    IMAGE_BUDGET_ASSERTIONS.forEach((auditId) => {
      expect(assertions[auditId]?.[0], auditId).toBe("error");
    });
  });

  it("caps total byte weight at the budget", () => {
    const { assertions } = readImageBudget();
    expect(assertions["total-byte-weight"][1].maxNumericValue).toBe(
      MAX_BUDGET_BYTES,
    );
  });

  it("requires sized, responsive images", () => {
    const { assertions } = readImageBudget();
    expect(assertions["unsized-images"][1].minScore).toBe(1);
    expect(assertions["image-size-responsive"][1].minScore).toBe(1);
  });
});

describe(".lighthouserc.json category thresholds", () => {
  // assertMatrix cannot be combined with top-level assertions, so the
  // category scores live in a catch-all matrix entry.
  it("keeps the category score assertions on every audited page", () => {
    const config = JSON.parse(
      readFileSync(join(process.cwd(), LIGHTHOUSE_CONFIG_PATH), "utf8"),
    );
    const catchAll = config.ci.assert.assertMatrix.find(
      (entry: { matchingUrlPattern: string }) =>
        entry.matchingUrlPattern === ".*",
    );
    expect(Object.keys(catchAll.assertions).sort()).toEqual([
      "categories:accessibility",
      "categories:best-practices",
      "categories:performance",
      "categories:seo",
    ]);
  });
});
