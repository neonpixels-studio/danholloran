import { existsSync, readFileSync, statSync } from "node:fs";
import { resolve } from "node:path";
import { describe, it, expect } from "vitest";
import postsPaths from "../../../posts/[slug].paths";

const REDIRECTS_PATH = resolve(process.cwd(), "public/_redirects");
const PUBLIC_DIR = resolve(process.cwd(), "public");
const POSTS_PREFIX = "/posts/";
// Dynamic listing routes (posts/page/[page].md, posts/tag/[tag].md) whose
// params are not enumerated here; a redirect into them is accepted by prefix.
const DYNAMIC_ROUTE_PREFIXES = [`${POSTS_PREFIX}page/`, `${POSTS_PREFIX}tag/`];
const VALID_STATUS_CODES = [200, 301, 302, 303, 307, 308, 404, 410, 451];
const PLACEHOLDER_RE = /[:*]/;
const EXTERNAL_RE = /^[a-z][a-z0-9+.-]*:\/\//i;
const STATUS_RE = /^(\d{3})(!)?$/;

interface RedirectRule {
  line: number;
  from: string;
  to: string;
  status: string;
}

function parseRedirects(source: string): {
  rules: RedirectRule[];
  errors: string[];
} {
  const rules: RedirectRule[] = [];
  const errors: string[] = [];
  source.split("\n").forEach((rawLine, index) => {
    const line = rawLine.trim();
    if (line === "" || line.startsWith("#")) {
      return;
    }
    const [from, to, status, ...extra] = line.split(/\s+/);
    const lineNumber = index + 1;
    if (!to) {
      errors.push(`line ${lineNumber}: missing target`);
      return;
    }
    if (!from.startsWith("/") && !EXTERNAL_RE.test(from)) {
      errors.push(`line ${lineNumber}: source must start with "/"`);
      return;
    }
    if (extra.length > 0) {
      errors.push(`line ${lineNumber}: unexpected extra fields`);
      return;
    }
    if (!status) {
      errors.push(`line ${lineNumber}: missing status`);
      return;
    }
    const match = STATUS_RE.exec(status);
    if (!match || !VALID_STATUS_CODES.includes(Number(match[1]))) {
      errors.push(`line ${lineNumber}: invalid status "${status}"`);
      return;
    }
    rules.push({ line: lineNumber, from, to, status });
  });
  return { rules, errors };
}

function publishedPostPaths(): string[] {
  return postsPaths
    .paths()
    .map((entry) => `${POSTS_PREFIX}${entry.params.slug}`);
}

const PUBLISHED_POST_PATHS = new Set(publishedPostPaths());

function stripQueryAndHash(path: string): string {
  return path.replace(/[?#].*$/, "");
}

function normalizePath(path: string): string {
  const cleanPath = stripQueryAndHash(path);
  return cleanPath.length > 1 ? cleanPath.replace(/\/$/, "") : cleanPath;
}

function isExistingFile(path: string): boolean {
  return existsSync(path) && statSync(path).isFile();
}

function hasPublicFileOrPage(normalized: string): boolean {
  const publicPath = resolve(PUBLIC_DIR, `.${normalized}`);
  const pagePath = resolve(process.cwd(), `.${normalized}.md`);
  const isContained =
    publicPath.startsWith(`${PUBLIC_DIR}/`) &&
    pagePath.startsWith(`${process.cwd()}/`);
  return (
    isContained && (isExistingFile(publicPath) || isExistingFile(pagePath))
  );
}

function isKnownRoute(path: string): boolean {
  if (!path.startsWith("/")) {
    return false;
  }
  const normalized = normalizePath(path);
  if (normalized === "/" || normalized === POSTS_PREFIX.replace(/\/$/, "")) {
    return true;
  }
  if (PUBLISHED_POST_PATHS.has(normalized)) {
    return true;
  }
  if (
    DYNAMIC_ROUTE_PREFIXES.some((prefix) =>
      stripQueryAndHash(path).startsWith(prefix),
    )
  ) {
    return true;
  }
  return hasPublicFileOrPage(normalized);
}

// A splat/placeholder target cannot be resolved to one file, so require the
// static part before it to be a known directory route instead.
function isKnownPatternTarget(target: string): boolean {
  const staticPrefix = target.slice(0, target.search(PLACEHOLDER_RE));
  return isKnownRoute(staticPrefix) || isPublicDirectory(staticPrefix);
}

function isPublicDirectory(path: string): boolean {
  const publicPath = resolve(PUBLIC_DIR, `.${normalizePath(path)}`);
  return (
    publicPath.startsWith(`${PUBLIC_DIR}/`) &&
    existsSync(publicPath) &&
    statSync(publicPath).isDirectory()
  );
}

function findDuplicateSources(rules: RedirectRule[]): string[] {
  const sources = rules.map((rule) => normalizePath(rule.from));
  return sources.filter((source, index) => sources.indexOf(source) !== index);
}

function findSelfRedirects(rules: RedirectRule[]): RedirectRule[] {
  return rules.filter(
    (rule) => normalizePath(rule.from) === normalizePath(rule.to),
  );
}

function isResolvableTarget(target: string): boolean {
  if (EXTERNAL_RE.test(target)) {
    return true;
  }
  if (PLACEHOLDER_RE.test(target)) {
    return isKnownPatternTarget(target);
  }
  return isKnownRoute(target);
}

const parsed = parseRedirects(readFileSync(REDIRECTS_PATH, "utf-8"));

describe("public/_redirects", () => {
  it("has at least one rule", () => {
    expect(parsed.rules.length).toBeGreaterThan(0);
  });

  it("has no malformed lines", () => {
    expect(parsed.errors).toEqual([]);
  });

  it("has no duplicate from rules", () => {
    expect(findDuplicateSources(parsed.rules)).toEqual([]);
  });

  it("has no self-redirects", () => {
    expect(findSelfRedirects(parsed.rules)).toEqual([]);
  });

  it("only redirects to targets that resolve", () => {
    const deadTargets = parsed.rules
      .filter((rule) => !isResolvableTarget(rule.to))
      .map((rule) => `line ${rule.line}: ${rule.from} -> ${rule.to}`);
    expect(deadTargets).toEqual([]);
  });
});

describe("parseRedirects", () => {
  it("ignores comments and blank lines", () => {
    expect(parseRedirects("# note\n\n/a /b 301!\n").rules).toHaveLength(1);
  });

  it("flags a missing target", () => {
    expect(parseRedirects("/a\n").errors).toHaveLength(1);
  });

  it("flags a source without a leading slash", () => {
    expect(parseRedirects("a /b 301\n").errors).toHaveLength(1);
  });

  it("flags a invalid status", () => {
    expect(parseRedirects("/a /b\n").errors).toHaveLength(1);
    expect(parseRedirects("/a /b 999\n").errors).toHaveLength(1);
    expect(parseRedirects("/a /b 999!\n").errors).toHaveLength(1);
    expect(parseRedirects("/a /b 301 extra\n").errors).toHaveLength(1);
    expect(parseRedirects("/a /b abc\n").errors).toHaveLength(1);
  });
});

describe("rule checks", () => {
  const rule = (from: string, to: string): RedirectRule => ({
    line: 1,
    from,
    to,
    status: "301",
  });

  it("finds duplicate sources, ignoring a trailing slash", () => {
    const rules = [rule("/a", "/x"), rule("/a/", "/y"), rule("/b", "/x")];
    expect(findDuplicateSources(rules)).toEqual(["/a"]);
    expect(findDuplicateSources([rule("/a", "/x"), rule("/b", "/x")])).toEqual(
      [],
    );
  });

  it("finds self-redirects", () => {
    expect(findSelfRedirects([rule("/a", "/a/")])).toHaveLength(1);
    expect(findSelfRedirects([rule("/a", "/b")])).toHaveLength(0);
  });
});

describe("isResolvableTarget", () => {
  it("accepts external URLs and splats into the posts route", () => {
    expect(isResolvableTarget("https://example.com/:splat")).toBe(true);
    expect(isResolvableTarget("/posts/:splat")).toBe(true);
    expect(isResolvableTarget("/images/:splat")).toBe(true);
  });

  it("rejects a missing post and an unknown splat prefix", () => {
    expect(isResolvableTarget("/posts/definitely-not-a-post")).toBe(false);
    expect(isResolvableTarget("/nowhere/:splat")).toBe(false);
    expect(isResolvableTarget(":splat")).toBe(false);
    expect(isResolvableTarget("/../package.json")).toBe(false);
    expect(isResolvableTarget("/images/")).toBe(false);
  });

  it("accepts the posts index and a real post", () => {
    expect(isResolvableTarget("/posts/")).toBe(true);
    const [firstPost] = publishedPostPaths();
    expect(firstPost).toBeDefined();
    expect(isResolvableTarget(firstPost)).toBe(true);
  });
});
