import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { SENTRY_DSN } from "@utils/errorReporting";
import { writeHeadersFile } from "@neon-pixels/security/netlify";
import {
  CSP_REPORT_ENDPOINT,
  REPORT_ONLY_DIRECTIVES,
  cspReportEndpoint,
  formatUnhashable,
  writeReportOnlyPolicy,
} from "@utils/reportOnlyCsp";

vi.mock("@neon-pixels/security/netlify", () => ({
  writeHeadersFile: vi.fn(),
}));

const writeHeadersFileMock = vi.mocked(writeHeadersFile);

describe("cspReportEndpoint", () => {
  it.each([
    ["production", "production"],
    ["deploy-preview", "preview"],
    ["branch-deploy", "preview"],
    [undefined, "development"],
  ])("tags the %s context as %s", (context, environment) => {
    expect(cspReportEndpoint(context)).toBe(
      `${CSP_REPORT_ENDPOINT}&sentry_environment=${environment}`,
    );
  });

  it("targets the security endpoint of the DSN's project and key", () => {
    const dsn = new URL(SENTRY_DSN);
    expect(CSP_REPORT_ENDPOINT).toBe(
      `${dsn.origin}/api/${dsn.pathname.slice(1)}/security/?sentry_key=${dsn.username}`,
    );
  });
});

describe("writeReportOnlyPolicy", () => {
  beforeEach(() => {
    writeHeadersFileMock.mockReset();
    vi.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("appends a report-only policy to the existing _headers file", async () => {
    writeHeadersFileMock.mockResolvedValue({
      path: "dist/_headers",
      scriptHashes: [],
      styleHashes: [],
      unhashable: [],
    });

    await writeReportOnlyPolicy("dist", "deploy-preview");

    expect(writeHeadersFileMock).toHaveBeenCalledWith("dist", {
      directives: REPORT_ONLY_DIRECTIVES,
      reportEndpoint: cspReportEndpoint("deploy-preview"),
      reportOnly: true,
      append: true,
    });
  });

  it("prints unhashable files without throwing", async () => {
    writeHeadersFileMock.mockResolvedValue({
      path: "dist/_headers",
      scriptHashes: [],
      styleHashes: [],
      unhashable: [{ file: "a.html", attributes: ["<div style>"] }],
    });

    await writeReportOnlyPolicy("dist", "production");

    expect(console.log).toHaveBeenCalledWith(expect.stringContaining("a.html"));
  });
});

describe("formatUnhashable", () => {
  it("says so when nothing is unhashable", () => {
    expect(formatUnhashable([])).toContain("no unhashable");
  });

  it("separates shared shell markup from per-file extras", () => {
    const output = formatUnhashable([
      { file: "a.html", attributes: ["<div style>", "<pre style>"] },
      { file: "b.html", attributes: ["<div style>"] },
    ]);

    expect(output).toContain(
      "In every listed file: <div style> [site shell (mobile menu, search dialog, results list)]",
    );
    expect(output).toContain(
      "1 file(s): <pre style> [Shiki code highlighting (--shiki-*-bg)]",
    );
    expect(output).toContain("    a.html");
    expect(output).toContain("1 file(s): no further markup");
  });

  it("prints attributes with no known source bare", () => {
    const output = formatUnhashable([
      { file: "a.html", attributes: ["<p style>"] },
    ]);

    expect(output).toContain("In every listed file: <p style>\n");
  });

  it("reports nothing shared when files have no attribute in common", () => {
    const output = formatUnhashable([
      { file: "a.html", attributes: ["<p style>"] },
      { file: "b.html", attributes: ["<b style>"] },
    ]);

    expect(output).toContain("In every listed file: nothing");
  });
});
