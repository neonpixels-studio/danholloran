import { describe, it, expect, afterEach } from "vitest";
import { mkdtempSync, rmSync, writeFileSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import {
  assertResumePdfUpToDate,
  fingerprintResumeData,
  isResumePdfUpToDate,
  writeResumePdfManifest,
  type ResumePdfManifestPaths,
} from "../../theme/utils/resumePdfManifest";

describe("resumePdfManifest", () => {
  let paths: ResumePdfManifestPaths;
  let tempDir: string;

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true });
  });

  function setUpResumeData(contents: string): void {
    tempDir = mkdtempSync(join(tmpdir(), "resume-pdf-manifest-"));
    paths = {
      resumeDataPath: join(tempDir, "resume.ts"),
      manifestPath: join(tempDir, "resumePdfManifest.json"),
    };
    writeFileSync(paths.resumeDataPath, contents);
  }

  // Simulates `npm run resume:pdf:sync` recording the current hash, as if a
  // human had just re-exported the PDF for the data on disk right now.
  function recordCurrentHashAsSynced(): void {
    writeResumePdfManifest(paths.manifestPath, {
      resumeHash: fingerprintResumeData(paths.resumeDataPath),
    });
  }

  it("reports out of date when no marker has ever been recorded", () => {
    setUpResumeData("export default { firstName: 'Dan' };");

    expect(isResumePdfUpToDate(paths)).toBe(false);
  });

  it("reports up to date right after the marker is recorded", () => {
    setUpResumeData("export default { firstName: 'Dan' };");
    recordCurrentHashAsSynced();

    expect(isResumePdfUpToDate(paths)).toBe(true);
    expect(() => assertResumePdfUpToDate(paths)).not.toThrow();
  });

  it("fails loud when resume.ts changes without a matching marker update", () => {
    setUpResumeData("export default { firstName: 'Dan' };");
    recordCurrentHashAsSynced();

    // Edit resume.ts (e.g. a new job) without re-running the PDF export.
    writeFileSync(
      paths.resumeDataPath,
      "export default { firstName: 'Danny' };",
    );

    expect(isResumePdfUpToDate(paths)).toBe(false);
    expect(() => assertResumePdfUpToDate(paths)).toThrow(
      /resume-pdf-export.*resume:pdf:sync/s,
    );
  });

  it("stays up to date when resume.ts is rewritten with identical content", () => {
    setUpResumeData("export default { firstName: 'Dan' };");
    recordCurrentHashAsSynced();

    // Same bytes, different write (e.g. a checkout that touches mtime but
    // not content) must not be flagged as drift.
    writeFileSync(paths.resumeDataPath, "export default { firstName: 'Dan' };");

    expect(isResumePdfUpToDate(paths)).toBe(true);
  });

  it("treats a missing marker file as out of date, not a crash", () => {
    setUpResumeData("export default { firstName: 'Dan' };");

    expect(() => assertResumePdfUpToDate(paths)).toThrow(/out of sync/);
  });
});
