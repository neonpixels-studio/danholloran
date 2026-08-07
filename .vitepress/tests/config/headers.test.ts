import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, it, expect } from "vitest";

const HEADERS_PATH = resolve(process.cwd(), "public/_headers");
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
  "frame-ancestors",
];

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

function readConnectSrc(): string[] {
  const directive = readCspLine()
    .split(";")
    .map((part) => part.trim())
    .find((part) => /^connect-src(\s|$)/.test(part));
  if (!directive) {
    throw new Error("connect-src directive not found in CSP");
  }
  return directive.split(/\s+/).slice(1);
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
