import { existsSync, statSync } from "node:fs";
import { isAbsolute, relative, resolve, sep } from "node:path";

const SITE_ORIGIN_RE = /^https?:\/\/(?:www\.)?danholloran\.me(?=[/?#]|$)/i;
const MAX_REDIRECT_HOPS = 3;
const EXTERNAL_TARGET_RE = /^[a-z][a-z0-9+.-]*:\/\//i;
const FENCE_RE = /^ {0,3}(`{3,}|~{3,})/;
const INLINE_CODE_RE = /(`+)[^`]*?\1/g;
const IMAGE_RE = /!\[[^\]]*\]\([^)]*\)/g;
const MARKDOWN_LINK_RE =
  /\]\(\s*<?([^)\s>]+)>?(?:\s+(?:"[^"]*"|'[^']*'|\([^)]*\)))?\s*\)/g;
const REFERENCE_DEFINITION_RE = /^ {0,3}\[[^\]]+\]:\s*<?([^\s>]+)>?/;
const HTML_HREF_RE = /\shref=["']([^"']+)["']/g;

export interface InternalLink {
  line: number;
  href: string;
}

export interface RouteTable {
  routes: Set<string>;
  redirects: RedirectRule[];
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
  const href = raw.replace(SITE_ORIGIN_RE, "") || "/";
  if (!href.startsWith("/") || href.startsWith("//")) {
    return null;
  }
  return href;
}

function hrefsInLine(line: string): string[] {
  const text = line.replace(INLINE_CODE_RE, "").replace(IMAGE_RE, "");
  const matches = [
    ...text.matchAll(MARKDOWN_LINK_RE),
    ...text.matchAll(HTML_HREF_RE),
  ];
  const definition = REFERENCE_DEFINITION_RE.exec(text)?.[1];
  return [
    ...matches.map((match) => match[1]),
    ...(definition ? [definition] : []),
  ];
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

export interface RedirectRule {
  from: string;
  to: string;
  status: number;
}

const DEFAULT_REDIRECT_STATUS = 301;
const REDIRECT_STATUS_RE = /^(\d{3})!?$/;
const FIRST_ERROR_STATUS = 400;

// From/to columns of each rule in a Netlify _redirects file.
export function parseRedirectRules(source: string): RedirectRule[] {
  return source
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line !== "" && !line.startsWith("#"))
    .map(parseRedirectRule);
}

// Netlify query-condition tokens (`id=:id`) sit between the source and target.
function parseRedirectRule(line: string): RedirectRule {
  const [from, ...rest] = line
    .split(/\s+/)
    .filter(
      (token) =>
        !token.includes("=") || token.startsWith("/") || token.includes("://"),
    );
  const [to = "", statusToken] = rest;
  const status = Number(REDIRECT_STATUS_RE.exec(statusToken ?? "")?.[1]);
  return { from, to, status: status || DEFAULT_REDIRECT_STATUS };
}

const REDIRECT_TOKEN_RE = /\*|:[A-Za-z_]+|[.+?^${}()|[\]\\]/g;

function redirectTokenToRegExp(token: string): string {
  if (token === "*") {
    return "(?<splat>.*)";
  }
  return token.startsWith(":") ? `(?<${token.slice(1)}>[^/]+)` : `\\${token}`;
}

function redirectPatternToRegExp(pattern: string): RegExp {
  const body = normalizeRoutePath(pattern).replace(
    REDIRECT_TOKEN_RE,
    redirectTokenToRegExp,
  );
  return new RegExp(`^${body}$`);
}

function fillPlaceholders(
  target: string,
  groups: Record<string, string>,
): string {
  return target.replace(
    /:([A-Za-z_]+)/g,
    (placeholder, name) => groups[name] ?? placeholder,
  );
}

// The first matching rule with its placeholders filled in, or null if the
// path matches no rule.
function matchRedirect(
  path: string,
  rules: RedirectRule[],
): { target: string; status: number } | null {
  for (const rule of rules) {
    const match = redirectPatternToRegExp(rule.from).exec(path);
    if (!match) {
      continue;
    }
    return {
      target: fillPlaceholders(rule.to, match.groups ?? {}),
      status: rule.status,
    };
  }
  return null;
}

function isFile(path: string): boolean {
  return existsSync(path) && statSync(path).isFile();
}

function isInside(directory: string, path: string): boolean {
  const relativePath = relative(directory, path);
  return (
    relativePath !== ".." &&
    !relativePath.startsWith(`..${sep}`) &&
    !isAbsolute(relativePath)
  );
}

function safeDecode(path: string): string | null {
  try {
    return decodeURI(path);
  } catch {
    return null;
  }
}

function hasStaticTarget(path: string, table: RouteTable): boolean {
  const decoded = safeDecode(path);
  if (!decoded) {
    return false;
  }
  const publicPath = resolve(table.publicDir, `.${decoded}`);
  const pagePaths = [`.${decoded}.md`, `.${decoded}/index.md`].map((page) =>
    resolve(table.pageDir, page),
  );
  return (
    (isInside(table.publicDir, publicPath) && isFile(publicPath)) ||
    pagePaths.some(
      (pagePath) => isInside(table.pageDir, pagePath) && isFile(pagePath),
    )
  );
}

function resolvesDirectly(path: string, table: RouteTable): boolean {
  return path === "/" || table.routes.has(path) || hasStaticTarget(path, table);
}

// A redirect hit only counts when its target resolves too, so a retired
// /blog/<slug> link is still reported once /posts/<slug> is gone.
function resolvesViaRedirect(
  path: string,
  table: RouteTable,
  hopsLeft: number,
): boolean {
  const redirect = matchRedirect(path, table.redirects);
  // 4xx rules (e.g. a catch-all 404) serve an error, not a working page.
  if (!redirect || hopsLeft === 0 || redirect.status >= FIRST_ERROR_STATUS) {
    return false;
  }
  const target = redirect.target.replace(SITE_ORIGIN_RE, "") || "/";
  if (EXTERNAL_TARGET_RE.test(target)) {
    return true;
  }
  return resolves(normalizeRoutePath(target), table, hopsLeft - 1);
}

function resolves(path: string, table: RouteTable, hopsLeft: number): boolean {
  return (
    resolvesDirectly(path, table) || resolvesViaRedirect(path, table, hopsLeft)
  );
}

export function isResolvableLink(href: string, table: RouteTable): boolean {
  return resolves(normalizeRoutePath(href), table, MAX_REDIRECT_HOPS);
}
