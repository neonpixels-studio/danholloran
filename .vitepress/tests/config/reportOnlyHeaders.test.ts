import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cspReportEndpoint, writeReportOnlyPolicy } from "@utils/reportOnlyCsp";

const SOURCE_HEADERS = readFileSync(
  resolve(process.cwd(), "public/_headers"),
  "utf8",
);
const REPORT_ONLY_HEADER = "Content-Security-Policy-Report-Only:";
const ENFORCED_HEADER = "Content-Security-Policy:";
const ORIGIN_PATTERN = /https:\/\/[a-z0-9.-]+/g;

function headerLines(text: string, header: string): string[] {
  return text.split("\n").filter((line) => line.includes(header));
}

function originsOf(policy: string): string[] {
  return [...new Set(policy.match(ORIGIN_PATTERN) ?? [])];
}

// The nearest unindented line above the header is the path rule it sits under.
function pathBlockOf(text: string, header: string): string | undefined {
  const lines = text.split("\n");
  const headerIndex = lines.findIndex((line) => line.includes(header));
  return lines
    .slice(0, headerIndex)
    .reverse()
    .find(
      (line) => line.length > 0 && !/^\s/.test(line) && !line.startsWith("#"),
    );
}

describe("report-only policy appended to the real _headers", () => {
  let outDir: string;

  beforeEach(() => {
    outDir = mkdtempSync(join(tmpdir(), "report-only-csp-"));
    writeFileSync(join(outDir, "_headers"), SOURCE_HEADERS);
    writeFileSync(
      join(outDir, "index.html"),
      '<html><head><style>a{}</style></head><body><script>1</script><p style="color:red">x</p></body></html>',
    );
    vi.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
    rmSync(outDir, { recursive: true, force: true });
  });

  it("keeps every line of public/_headers and adds one report-only policy for /*", async () => {
    await writeReportOnlyPolicy(outDir, "production");

    const built = readFileSync(join(outDir, "_headers"), "utf8");
    expect(built.startsWith(SOURCE_HEADERS)).toBe(true);
    expect(headerLines(built, REPORT_ONLY_HEADER)).toHaveLength(1);
    expect(pathBlockOf(built, REPORT_ONLY_HEADER)).toBe("/*");
    expect(built).toContain(cspReportEndpoint("production"));
  });

  it("hashes inline code and allows exactly the sources the enforced policy does", async () => {
    await writeReportOnlyPolicy(outDir, "production");

    const built = readFileSync(join(outDir, "_headers"), "utf8");
    const [reportOnly] = headerLines(built, REPORT_ONLY_HEADER);
    const [enforced] = headerLines(SOURCE_HEADERS, ENFORCED_HEADER);
    expect(reportOnly).not.toContain("'unsafe-inline'");
    expect(reportOnly).toContain("'sha256-");
    expect(reportOnly).toMatch(/script-src 'self'/);

    const allowedOrigins = originsOf(enforced);
    const reportedOrigins = originsOf(reportOnly.split("report-uri")[0]);
    expect(allowedOrigins.length).toBeGreaterThan(0);
    expect([...reportedOrigins].sort()).toEqual([...allowedOrigins].sort());
  });
});
