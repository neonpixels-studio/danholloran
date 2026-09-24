import { describe, it, expect, afterEach } from "vitest";
import { mkdtempSync, rmSync, writeFileSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import {
  assertResumePdfUpToDate,
  fingerprintFile,
  isResumePdfUpToDate,
  writeResumePdfManifest,
  DEFAULT_RESUME_PDF_MANIFEST_PATHS,
  type ResumePdfManifestPaths,
} from "../../theme/utils/resumePdfManifest";

describe("resumePdfManifest", () => {
  let paths: ResumePdfManifestPaths;
  let tempDir: string;

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true });
  });

  function setUp(resumeContents: string, pdfContents = "fake-pdf-bytes"): void {
    tempDir = mkdtempSync(join(tmpdir(), "resume-pdf-manifest-"));
    paths = {
      resumeDataPath: join(tempDir, "resume.ts"),
      pdfPath: join(tempDir, "resume.pdf"),
      manifestPath: join(tempDir, "resumePdfManifest.json"),
    };
    writeFileSync(paths.resumeDataPath, resumeContents);
    writeFileSync(paths.pdfPath, pdfContents);
  }

  // Simulates `npm run resume:pdf:sync` recording the current hashes, as if
  // a human had just re-exported the PDF for the data on disk right now.
  function recordCurrentHashesAsSynced(): void {
    writeResumePdfManifest(paths.manifestPath, {
      resumeHash: fingerprintFile(paths.resumeDataPath),
      pdfHash: fingerprintFile(paths.pdfPath),
    });
  }

  it("reports out of date and throws a fix-it message when no marker has ever been recorded", () => {
    setUp("export default { firstName: 'Dan' };");

    expect(isResumePdfUpToDate(paths)).toBe(false);
    expect(() => assertResumePdfUpToDate(paths)).toThrow(
      /resume-pdf-export.*resume:pdf:sync/s,
    );
  });

  it("reports up to date right after the marker is recorded", () => {
    setUp("export default { firstName: 'Dan' };");
    recordCurrentHashesAsSynced();

    expect(isResumePdfUpToDate(paths)).toBe(true);
    expect(() => assertResumePdfUpToDate(paths)).not.toThrow();
  });

  it("fails loud when resume.ts changes without a matching marker update", () => {
    setUp("export default { firstName: 'Dan' };");
    recordCurrentHashesAsSynced();

    // Edit resume.ts (e.g. a new job) without re-running the PDF export.
    writeFileSync(
      paths.resumeDataPath,
      "export default { firstName: 'Danny' };",
    );

    expect(isResumePdfUpToDate(paths)).toBe(false);
    expect(() => assertResumePdfUpToDate(paths)).toThrow(/out of sync/);
  });

  it("fails loud when the PDF changes (or is regenerated) without a marker update", () => {
    setUp("export default { firstName: 'Dan' };");
    recordCurrentHashesAsSynced();

    // The PDF was re-exported (or corrupted) but nobody ran the sync script.
    writeFileSync(paths.pdfPath, "different-pdf-bytes");

    expect(isResumePdfUpToDate(paths)).toBe(false);
  });

  it("fails loud when the PDF is missing entirely", () => {
    setUp("export default { firstName: 'Dan' };");
    recordCurrentHashesAsSynced();
    rmSync(paths.pdfPath);

    expect(isResumePdfUpToDate(paths)).toBe(false);
    expect(() => assertResumePdfUpToDate(paths)).toThrow(/out of sync/);
  });

  it("stays up to date when resume.ts and the PDF are rewritten with identical content", () => {
    setUp("export default { firstName: 'Dan' };");
    recordCurrentHashesAsSynced();

    // Same bytes, different write (e.g. a checkout that touches mtime but
    // not content) must not be flagged as drift.
    writeFileSync(paths.resumeDataPath, "export default { firstName: 'Dan' };");
    writeFileSync(paths.pdfPath, "fake-pdf-bytes");

    expect(isResumePdfUpToDate(paths)).toBe(true);
  });

  it("treats malformed manifest JSON as out of date rather than crashing", () => {
    setUp("export default { firstName: 'Dan' };");
    writeFileSync(paths.manifestPath, "<<<<<<< HEAD\nnot json\n=======\n");

    expect(isResumePdfUpToDate(paths)).toBe(false);
    expect(() => assertResumePdfUpToDate(paths)).toThrow(/out of sync/);
  });

  // The real gate: this is what actually protects main, since it runs
  // against the committed resume.ts and PDF via `npm run test:ci` in CI
  // (GitHub Actions doesn't run `npm run build`, so the build-time check in
  // checkResumePdfSynced.ts alone would never enforce this on a PR).
  it("keeps the committed resumePdfManifest.json in sync with the committed resume.ts and PDF", () => {
    expect(isResumePdfUpToDate(DEFAULT_RESUME_PDF_MANIFEST_PATHS)).toBe(true);
  });
});
