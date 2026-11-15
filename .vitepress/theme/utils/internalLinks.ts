import MarkdownIt from "markdown-it";
import { existsSync, statSync } from "node:fs";
import { isAbsolute, relative, resolve, sep } from "node:path";

type Token = ReturnType<MarkdownIt["parse"]>[number];

const SITE_ORIGIN_RE = /^https?:\/\/(?:www\.)?danholloran\.me(?=[/?#]|$)/i;
const MAX_REDIRECT_HOPS = 3;
const EXTERNAL_TARGET_RE = /^[a-z][a-z0-9+.-]*:\/\//i;
const markdownParser = new MarkdownIt({ html: true });
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

function normalizeInternalHref(raw: string): string | null {
  const href = raw.replace(SITE_ORIGIN_RE, "") || "/";
  if (!href.startsWith("/") || href.startsWith("//")) {
    return null;
  }
  return href;
}

function htmlHrefs(html: string): { href: string; lineOffset: number }[] {
  return [...html.matchAll(HTML_HREF_RE)].map((match) => ({
    href: match[1],
    lineOffset: html.slice(0, match.index).split("\n").length - 1,
  }));
}

function hrefsInInlineToken(
  inline: Token,
  firstLine: number,
): { line: number; href: string }[] {
  let line = firstLine;
  const found: { line: number; href: string }[] = [];
  for (const child of inline.children ?? []) {
    if (child.type === "softbreak" || child.type === "hardbreak") {
      line += 1;
    }
    const href = child.type === "link_open" ? child.attrGet("href") : null;
    if (href) {
      found.push({ line, href });
    }
    if (child.type === "html_inline") {
      found.push(
        ...htmlHrefs(child.content).map((html) => ({
          line: line + html.lineOffset,
          href: html.href,
        })),
      );
    }
  }
  return found;
}

function hrefsInToken(token: Token): { line: number; href: string }[] {
  if (!token.map) {
    return [];
  }
  const firstLine = token.map[0] + 1;
  if (token.type === "inline") {
    return hrefsInInlineToken(token, firstLine);
  }
  if (token.type === "html_block") {
    return htmlHrefs(token.content).map((html) => ({
      line: firstLine + html.lineOffset,
      href: html.href,
    }));
  }
  return [];
}

// Root-relative and same-site absolute links in a post body, found by walking
// markdown-it tokens so images, fenced and indented code, and inline code are
// never mistaken for links.
export function extractInternalLinks(markdown: string): InternalLink[] {
  return markdownParser
    .parse(markdown, {})
    .flatMap(hrefsInToken)
    .flatMap(({ line, href: raw }) => {
      const href = normalizeInternalHref(raw);
      return href ? [{ line, href }] : [];
    });
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
