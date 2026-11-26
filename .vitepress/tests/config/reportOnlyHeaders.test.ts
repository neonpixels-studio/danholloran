import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { writeReportOnlyPolicy } from "@utils/reportOnlyCsp";

const SOURCE_HEADERS = readFileSync(
  resolve(process.cwd(), "public/_headers"),
  "utf8",
);
const REPORT_ONLY_HEADER = "Content-Security-Policy-Report-Only:";

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
    rmSync(outDir, { recursive: true, force: true });
  });

  it("keeps every line of public/_headers and adds one report-only policy", async () => {
    await writeReportOnlyPolicy(outDir, "production");

    const built = readFileSync(join(outDir, "_headers"), "utf8");
    expect(built.startsWith(SOURCE_HEADERS)).toBe(true);
    const reportOnlyLines = built
      .split("\n")
      .filter((line) => line.includes(REPORT_ONLY_HEADER));
    expect(reportOnlyLines).toHaveLength(1);
    expect(built).not.toContain('Reporting-Endpoints: csp-endpoint=""');
  });

  it("hashes inline code instead of allowing unsafe-inline, and adds no new source", async () => {
    await writeReportOnlyPolicy(outDir, "production");

    const built = readFileSync(join(outDir, "_headers"), "utf8");
    const reportOnly = built
      .split("\n")
      .find((line) => line.includes(REPORT_ONLY_HEADER)) as string;
    expect(reportOnly).not.toContain("'unsafe-inline'");
    expect(reportOnly).toContain("'sha256-");
    const enforced = SOURCE_HEADERS.split("\n").find((line) =>
      line.includes("Content-Security-Policy:"),
    ) as string;
    const originPattern = /https:\/\/[a-z0-9.-]+/g;
    const allowedOrigins = enforced.match(originPattern) as string[];
    const reportOriginsOnly =
      reportOnly.split("report-uri")[0].match(originPattern) ?? [];
    for (const origin of reportOriginsOnly) {
      expect(allowedOrigins).toContain(origin);
    }
  });
});
