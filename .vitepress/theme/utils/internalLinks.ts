import MarkdownIt, { type Token } from "markdown-it";
import { existsSync, statSync } from "node:fs";
import { isAbsolute, relative, resolve, sep } from "node:path";

const SITE_ORIGIN_RE = /^https?:\/\/(?:www\.)?danholloran\.me(?=[/?#]|$)/i;
const MAX_REDIRECT_HOPS = 3;
const EXTERNAL_TARGET_RE = /^[a-z][a-z0-9+.-]*:\/\//i;
const markdownParser = new MarkdownIt({ html: true, linkify: true });
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

function lineCount(text: string): number {
  return text.split("\n").length - 1;
}

function htmlHrefs(html: string, firstLine: number): InternalLink[] {
  return [...html.matchAll(HTML_HREF_RE)].map((match) => ({
    line: firstLine + lineCount(html.slice(0, match.index + 1)),
    href: match[1],
  }));
}

// markdown-it keeps no source position on inline tokens, so the inline parser
// state is subclassed to remember where in the inline content each token
// starts (a flushed text token ends there, and it never spans a newline).
const tokenOffsets = new WeakMap<Token, number>();
const BaseInlineState = markdownParser.inline.State;
markdownParser.inline.State = class extends BaseInlineState {
  push(...args: Parameters<InstanceType<typeof BaseInlineState>["push"]>) {
    const token = super.push(...args);
    tokenOffsets.set(token, this.pos);
    return token;
  }

  pushPending() {
    const token = super.pushPending();
    tokenOffsets.set(token, this.pos);
    return token;
  }
};

function hrefsInChild(child: Token, line: number): InternalLink[] {
  if (child.type === "html_inline") {
    return htmlHrefs(child.content, line);
  }
  const href = child.type === "link_open" ? child.attrGet("href") : null;
  return typeof href === "string" && href ? [{ line, href }] : [];
}

// Tokens created after parsing (linkify) have no offset; they sit on the same
// line as the next token with one, since a text token never spans a newline.
function childLines(inline: Token, firstLine: number): number[] {
  const children = inline.children ?? [];
  let nextLine = firstLine + lineCount(inline.content);
  const lines = new Array<number>(children.length);
  for (let index = children.length - 1; index >= 0; index--) {
    const offset = tokenOffsets.get(children[index]);
    nextLine =
      offset === undefined
        ? nextLine
        : firstLine + lineCount(inline.content.slice(0, offset));
    lines[index] = nextLine;
  }
  return lines;
}

function hrefsInInlineToken(inline: Token, firstLine: number): InternalLink[] {
  const lines = childLines(inline, firstLine);
  return (inline.children ?? []).flatMap((child, index) =>
    hrefsInChild(child, lines[index]),
  );
}

function hrefsInToken(token: Token, firstLine: number): InternalLink[] {
  if (token.type === "inline") {
    return hrefsInInlineToken(token, firstLine);
  }
  return token.type === "html_block" ? htmlHrefs(token.content, firstLine) : [];
}

// Table cell tokens carry no source map, so they inherit the line of the
// nearest preceding token that has one.
function hrefsInTokens(tokens: Token[]): InternalLink[] {
  let currentLine = 1;
  return tokens.flatMap((token) => {
    currentLine = token.map ? token.map[0] + 1 : currentLine;
    return hrefsInToken(token, currentLine);
  });
}

// Root-relative and same-site absolute links in a post body, found by walking
// markdown-it tokens so images, fenced and indented code, and inline code are
// never mistaken for links.
export function extractInternalLinks(markdown: string): InternalLink[] {
  return hrefsInTokens(markdownParser.parse(markdown, {})).flatMap(
    ({ line, href: raw }) => {
      const href = normalizeInternalHref(raw);
      return href ? [{ line, href }] : [];
    },
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

// markdown-it percent-encodes non-ASCII link destinations, so a route is
// matched in both its encoded and decoded form.
function isKnownRoute(path: string, table: RouteTable): boolean {
  return table.routes.has(path) || table.routes.has(safeDecode(path) ?? path);
}

function resolvesDirectly(path: string, table: RouteTable): boolean {
  return (
    path === "/" || isKnownRoute(path, table) || hasStaticTarget(path, table)
  );
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
