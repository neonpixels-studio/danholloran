import { existsSync, statSync } from "node:fs";
import { resolve } from "node:path";

const SITE_ORIGIN = "https://danholloran.me";
const FENCE_RE = /^ {0,3}(`{3,}|~{3,})/;
const INLINE_CODE_RE = /`[^`\n]*`/g;
const IMAGE_RE = /!\[[^\]]*\]\([^)]*\)/g;
const MARKDOWN_LINK_RE = /\]\(\s*<?([^)\s>]+)>?(?:\s+"[^"]*")?\s*\)/g;
const HTML_HREF_RE = /\shref=["']([^"']+)["']/g;

export interface InternalLink {
  line: number;
  href: string;
}

export interface RouteTable {
  routes: Set<string>;
  redirectSources: string[];
  publicDir: string;
  pageDir: string;
}

// Blanks fenced code so example links inside code samples are never checked,
// while keeping line numbers intact for error messages.
function blankFencedCode(markdown: string): string[] {
  let openFence: string | null = null;
  return markdown.split(/\r?\n/).map((line) => {
    const fence = FENCE_RE.exec(line)?.[1];
    if (!openFence && fence) {
      openFence = fence;
      return "";
    }
    if (
      openFence &&
      fence &&
      fence[0] === openFence[0] &&
      fence.length >= openFence.length
    ) {
      openFence = null;
      return "";
    }
    return openFence ? "" : line;
  });
}

function normalizeInternalHref(raw: string): string | null {
  const href = raw.startsWith(SITE_ORIGIN)
    ? raw.slice(SITE_ORIGIN.length)
    : raw;
  if (!href.startsWith("/") || href.startsWith("//")) {
    return null;
  }
  return href === "" ? "/" : href;
}

function hrefsInLine(line: string): string[] {
  const text = line.replace(INLINE_CODE_RE, "").replace(IMAGE_RE, "");
  const matches = [
    ...text.matchAll(MARKDOWN_LINK_RE),
    ...text.matchAll(HTML_HREF_RE),
  ];
  return matches.map((match) => match[1]);
}

// Root-relative and same-site absolute links in a post body. Images, fenced
// code and inline code are ignored.
export function extractInternalLinks(markdown: string): InternalLink[] {
  return blankFencedCode(markdown).flatMap((line, index) =>
    hrefsInLine(line).flatMap((raw) => {
      const href = normalizeInternalHref(raw);
      return href ? [{ line: index + 1, href }] : [];
    }),
  );
}

export function normalizeRoutePath(href: string): string {
  const clean = href.replace(/[?#].*$/, "");
  return clean.length > 1 ? clean.replace(/\/+$/, "") : clean;
}

// Source column of each rule in a Netlify _redirects file.
export function parseRedirectSources(source: string): string[] {
  return source
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line !== "" && !line.startsWith("#"))
    .map((line) => line.split(/\s+/)[0]);
}

const REDIRECT_TOKEN_RE = /\*|:[A-Za-z_]+|[.+?^${}()|[\]\\]/g;

function redirectTokenToRegExp(token: string): string {
  if (token === "*") {
    return ".*";
  }
  return token.startsWith(":") ? "[^/]+" : `\\${token}`;
}

function redirectPatternToRegExp(pattern: string): RegExp {
  const body = normalizeRoutePath(pattern).replace(
    REDIRECT_TOKEN_RE,
    redirectTokenToRegExp,
  );
  return new RegExp(`^${body}$`);
}

function matchesRedirect(path: string, sources: string[]): boolean {
  return sources.some((source) => redirectPatternToRegExp(source).test(path));
}

function isFile(path: string): boolean {
  return existsSync(path) && statSync(path).isFile();
}

function hasStaticTarget(path: string, table: RouteTable): boolean {
  const publicPath = resolve(table.publicDir, `.${path}`);
  const pagePath = resolve(table.pageDir, `.${path}.md`);
  const contained =
    publicPath.startsWith(`${table.publicDir}/`) &&
    pagePath.startsWith(`${table.pageDir}/`);
  return contained && (isFile(publicPath) || isFile(pagePath));
}

export function isResolvableLink(href: string, table: RouteTable): boolean {
  const path = normalizeRoutePath(href);
  return (
    path === "/" ||
    table.routes.has(path) ||
    matchesRedirect(path, table.redirectSources) ||
    hasStaticTarget(path, table)
  );
}
