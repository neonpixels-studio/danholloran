import { readFileSync, readdirSync } from "node:fs";
import { resolve, join } from "node:path";
import { describe, it, expect } from "vitest";

const HEADERS_PATH = resolve(process.cwd(), "public/_headers");
const CSP_HEADER_NAME = "Content-Security-Policy:";
const COMPONENTS_DIR = resolve(process.cwd(), ".vitepress/theme/components");
const OFF_ORIGIN_FORM_ACTION_RE = /<form[^>]*\saction=["']https?:/i;
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
  return readCspLine().split(CSP_HEADER_NAME)[1] ?? "";
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

  it("has no <form> with an off-origin action attribute", () => {
    // Enforces the invariant the form-action 'self' policy relies on: if a
    // component ever gains a form that natively posts off-origin (e.g. a
    // no-JS fallback action pointing at a third-party endpoint), that
    // submission would be silently blocked in production. Catch it here
    // instead of in the field.
    listVueFiles(COMPONENTS_DIR).forEach((path) => {
      const markup = readFileSync(path, "utf8");
      expect(markup).not.toMatch(OFF_ORIGIN_FORM_ACTION_RE);
    });
  });
});
