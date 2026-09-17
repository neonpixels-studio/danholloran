import { readFileSync, readdirSync } from "node:fs";
import { resolve, join } from "node:path";
import { describe, it, expect } from "vitest";

const HEADERS_PATH = resolve(process.cwd(), "public/_headers");
const CSP_HEADER_NAME = "Content-Security-Policy:";
// Scoped to the theme, where live templates render — not .vitepress/content,
// whose posts include fenced ```html/```jsx code samples that legitimately
// contain literal action="..." strings as prose, not real forms.
const THEME_DIR = resolve(process.cwd(), ".vitepress/theme");
// Catches a literal off-origin target on <form action> or <button
// formaction>, and flags a dynamic :action/v-bind:action binding for manual
// review since a template expression can't be resolved statically here.
const OFF_ORIGIN_ACTION_RE = /\b(?:form)?action=["']https?:\/\//i;
const DYNAMIC_ACTION_RE = /\b(?::|v-bind:)(?:form)?action=/i;
const SELF_CONNECT_SRC = "'self'";
const NEWSLETTER_CONNECT_SRC = "https://app.kit.com";
const ANALYTICS_CONNECT_SOURCES = [
  "https://www.google-analytics.com",
  "https://www.googletagmanager.com",
];
const EXPECTED_DIRECTIVES = [
  "default-src",
  "script-src",
  "style-src",
  "font-src",
  "img-src",
  "connect-src",
  "object-src",
  "base-uri",
  "form-action",
  "frame-ancestors",
];

function listVueFiles(directory: string): string[] {
  return readdirSync(directory, { recursive: true })
    .filter((entry) => typeof entry === "string" && entry.endsWith(".vue"))
    .map((entry) => join(directory, entry as string));
}

function readCspLine(): string {
  const contents = readFileSync(HEADERS_PATH, "utf8");
  const cspLine = contents
    .split("\n")
    .find((line) => line.includes("Content-Security-Policy:"));
  if (!cspLine) {
    throw new Error("Content-Security-Policy header not found in _headers");
  }
  return cspLine;
}

function readPolicy(): string {
  // Drop the "Content-Security-Policy:" header name so the first `;`-segment
  // is a bare directive like every other segment — otherwise a name-based
  // match against the first segment (e.g. default-src) never fires.
  const [, policy] = readCspLine().split(CSP_HEADER_NAME);
  if (!policy) {
    throw new Error(
      `CSP line did not contain the "${CSP_HEADER_NAME}" header name`,
    );
  }
  return policy;
}

function readDirective(name: string): string[] {
  const directive = readPolicy()
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.split(/\s+/)[0] === name);
  if (!directive) {
    throw new Error(`${name} directive not found in CSP`);
  }
  return directive.split(/\s+/).slice(1);
}

function readConnectSrc(): string[] {
  return readDirective("connect-src");
}

describe("public/_headers connect-src", () => {
  it("allows the Kit newsletter form endpoint so subscribe() is not CSP-blocked", () => {
    expect(readConnectSrc()).toContain(NEWSLETTER_CONNECT_SRC);
  });

  it("still allows same-origin requests", () => {
    expect(readConnectSrc()).toContain(SELF_CONNECT_SRC);
  });

  it("still allows the analytics endpoints", () => {
    const sources = readConnectSrc();
    ANALYTICS_CONNECT_SOURCES.forEach((source) => {
      expect(sources).toContain(source);
    });
  });

  it("declares all expected CSP directives", () => {
    const cspLine = readCspLine();
    EXPECTED_DIRECTIVES.forEach((directive) => {
      expect(cspLine).toMatch(new RegExp(`[\\s;]${directive}\\s`));
    });
  });

  it("locks the default-src fallback to 'self'", () => {
    // Regression test: readDirective() used to match against the raw CSP
    // line (header name included), so a name-based lookup against the first
    // `;`-segment — default-src — silently never matched.
    expect(readDirective("default-src")).toEqual(["'self'"]);
  });
});

describe("public/_headers legacy-plugin and injection restrictions", () => {
  it("blocks legacy plugin content with object-src 'none'", () => {
    expect(readDirective("object-src")).toEqual(["'none'"]);
  });

  it("restricts <base> tag injection with base-uri 'self'", () => {
    expect(readDirective("base-uri")).toEqual(["'self'"]);
  });

  it("restricts form submission targets with form-action 'self'", () => {
    // Every <form> in the app (newsletter signup, contact form) submits via
    // fetch() from a JS handler with the native submit prevented, so no form
    // ever navigates to an external action — 'self' matches actual usage.
    expect(readDirective("form-action")).toEqual(["'self'"]);
  });

  describe("form-action 'self' invariant: no off-origin action in the theme", () => {
    // Enforces the assumption form-action 'self' relies on: every <form>/
    // <button> in the app targets same-origin (or is submitted via fetch(),
    // covered by connect-src). If a template ever gains a literal off-origin
    // action/formaction, or a dynamic :action binding this regex can't
    // resolve, that submission would be silently blocked in production.
    const themeFiles = listVueFiles(THEME_DIR);

    it("scans at least one theme file (guards against a vacuous pass)", () => {
      expect(themeFiles.length).toBeGreaterThan(0);
    });

    it.each(themeFiles)("%s has no off-origin action/formaction", (path) => {
      const markup = readFileSync(path, "utf8");
      expect(markup).not.toMatch(OFF_ORIGIN_ACTION_RE);
    });

    it.each(themeFiles)(
      "%s has no dynamic :action binding needing manual review",
      (path) => {
        const markup = readFileSync(path, "utf8");
        expect(markup).not.toMatch(DYNAMIC_ACTION_RE);
      },
    );
  });
});
