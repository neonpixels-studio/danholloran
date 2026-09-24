import { describe, it, expect, afterEach } from "vitest";
import { mkdtempSync, rmSync, writeFileSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import { getExperienceLength } from "../../data/resume";
import {
  assertResumePdfUpToDate,
  checkResumeSyncConsistency,
  currentExperienceYears,
  fingerprintFile,
  fingerprintResumeSources,
  isResumePdfUpToDate,
  markResumePdfSynced,
  writeResumePdfManifest,
  DEFAULT_RESUME_PDF_MANIFEST_PATHS,
  type ResumePdfManifestPaths,
} from "../../theme/utils/resumePdfManifest";

function requireHash(path: string): string {
  const hash = fingerprintFile(path);
  if (hash === null) {
    throw new Error(`expected ${path} to exist in this test fixture`);
  }
  return hash;
}

describe("resumePdfManifest", () => {
  let paths: ResumePdfManifestPaths;
  let tempDir = "";

  afterEach(() => {
    if (!tempDir) {
      return;
    }
    rmSync(tempDir, { recursive: true, force: true });
    tempDir = "";
  });

  // A minimal three-file "resume source set" fixture, standing in for the
  // real resume.ts + skills.ts + ... list so tests don't depend on the real
  // data files' contents.
  function setUp(
    sourceContents: string[] = ["resume-v1", "skills-v1", "location-v1"],
    pdfContents = "fake-pdf-bytes",
  ): void {
    tempDir = mkdtempSync(join(tmpdir(), "resume-pdf-manifest-"));
    const resumeSourcePaths = sourceContents.map((contents, index) => {
      const path = join(tempDir, `source-${index}.txt`);
      writeFileSync(path, contents);
      return path;
    });
    const pdfPath = join(tempDir, "resume.pdf");
    writeFileSync(pdfPath, pdfContents);
    paths = {
      resumeSourcePaths,
      pdfPath,
      manifestPath: join(tempDir, "resumePdfManifest.json"),
    };
  }

  // Simulates `npm run resume:pdf:sync` recording the current state, as if
  // a human had just re-exported the PDF for the data on disk right now.
  function recordCurrentStateAsSynced(
    exportedExperienceYears = currentExperienceYears(),
  ): void {
    const resumeHash = fingerprintResumeSources(paths.resumeSourcePaths);
    if (resumeHash === null) {
      throw new Error("expected every resume source fixture file to exist");
    }
    writeResumePdfManifest(paths.manifestPath, {
      resumeHash,
      pdfHash: requireHash(paths.pdfPath),
      exportedExperienceYears,
    });
  }

  describe("isResumePdfUpToDate / assertResumePdfUpToDate", () => {
    it("reports out of date and throws a fix-it message when no marker has ever been recorded", () => {
      setUp();

      expect(isResumePdfUpToDate(paths)).toBe(false);
      expect(() => assertResumePdfUpToDate(paths)).toThrow(
        /resume-pdf-export.*resume:pdf:sync/s,
      );
    });

    it("reports up to date right after the marker is recorded", () => {
      setUp();
      recordCurrentStateAsSynced();

      expect(isResumePdfUpToDate(paths)).toBe(true);
      expect(() => assertResumePdfUpToDate(paths)).not.toThrow();
    });

    it("fails loud when any resume source file changes without a matching marker update", () => {
      setUp();
      recordCurrentStateAsSynced();

      // Edit one of the resume source files (e.g. skills.ts) without
      // re-running the PDF export.
      writeFileSync(paths.resumeSourcePaths[1], "skills-v2");

      expect(isResumePdfUpToDate(paths)).toBe(false);
      expect(() => assertResumePdfUpToDate(paths)).toThrow(/out of sync/);
    });

    it("fails loud when the PDF changes (or is regenerated) without a marker update", () => {
      setUp();
      recordCurrentStateAsSynced();

      // The PDF was re-exported (or corrupted) but nobody ran the sync script.
      writeFileSync(paths.pdfPath, "different-pdf-bytes");

      expect(isResumePdfUpToDate(paths)).toBe(false);
    });

    it("fails loud when the PDF is missing entirely", () => {
      setUp();
      recordCurrentStateAsSynced();
      rmSync(paths.pdfPath);

      expect(isResumePdfUpToDate(paths)).toBe(false);
      expect(() => assertResumePdfUpToDate(paths)).toThrow(/out of sync/);
    });

    it("fails loud when a resume source file is missing", () => {
      setUp();
      recordCurrentStateAsSynced();
      rmSync(paths.resumeSourcePaths[0]);

      expect(isResumePdfUpToDate(paths)).toBe(false);
      expect(() => assertResumePdfUpToDate(paths)).toThrow(/out of sync/);
    });

    it("fails loud when the recorded years of experience no longer match the current year", () => {
      setUp();
      // Simulate a marker recorded before a New Year's Day rollover: every
      // file is untouched, only the computed years-of-experience changed.
      recordCurrentStateAsSynced(currentExperienceYears() - 1);

      expect(isResumePdfUpToDate(paths)).toBe(false);
    });

    it("stays up to date when resume sources and the PDF are rewritten with identical content", () => {
      setUp();
      recordCurrentStateAsSynced();

      // Same bytes, different write (e.g. a checkout that touches mtime but
      // not content) must not be flagged as drift.
      writeFileSync(paths.resumeSourcePaths[0], "resume-v1");
      writeFileSync(paths.pdfPath, "fake-pdf-bytes");

      expect(isResumePdfUpToDate(paths)).toBe(true);
    });

    it("treats malformed manifest JSON as out of date rather than crashing", () => {
      setUp();
      writeFileSync(paths.manifestPath, "<<<<<<< HEAD\nnot json\n=======\n");

      expect(isResumePdfUpToDate(paths)).toBe(false);
      expect(() => assertResumePdfUpToDate(paths)).toThrow(/out of sync/);
    });

    it("treats a manifest with the wrong shape as out of date rather than trusting it", () => {
      setUp();
      // Valid JSON, wrong shape (e.g. a hand-edit or a schema change).
      writeFileSync(paths.manifestPath, JSON.stringify({ resumeHash: 123 }));

      expect(isResumePdfUpToDate(paths)).toBe(false);
    });

    // The real gate: this is what actually protects main, since it runs
    // against the committed resume sources and PDF via `npm run test:ci` in
    // CI (GitHub Actions doesn't run `npm run build`, so the build-time
    // check in checkResumePdfSynced.ts alone would never enforce this on a
    // PR).
    it("keeps the committed resumePdfManifest.json in sync with the committed resume data and PDF", () => {
      expect(isResumePdfUpToDate(DEFAULT_RESUME_PDF_MANIFEST_PATHS)).toBe(true);
    });
  });

  describe("checkResumeSyncConsistency", () => {
    it("flags resume changed + PDF unchanged — the 'export skill never ran' case", () => {
      setUp();
      recordCurrentStateAsSynced();
      writeFileSync(paths.resumeSourcePaths[1], "skills-v2");

      expect(checkResumeSyncConsistency(paths)).toEqual({
        resumeChanged: true,
        pdfUnchanged: true,
      });
    });

    it("does not flag it once the PDF was actually re-exported (different bytes)", () => {
      setUp();
      recordCurrentStateAsSynced();
      writeFileSync(paths.resumeSourcePaths[1], "skills-v2");
      writeFileSync(paths.pdfPath, "freshly-exported-pdf-bytes");

      expect(checkResumeSyncConsistency(paths)).toEqual({
        resumeChanged: true,
        pdfUnchanged: false,
      });
    });

    it("does not flag an unchanged resume even if the PDF also stayed the same", () => {
      setUp();
      recordCurrentStateAsSynced();

      expect(checkResumeSyncConsistency(paths)).toEqual({
        resumeChanged: false,
        pdfUnchanged: true,
      });
    });

    it("flags a stale years-of-experience value even when no file changed", () => {
      setUp();
      recordCurrentStateAsSynced(currentExperienceYears() - 1);

      expect(checkResumeSyncConsistency(paths)).toEqual({
        resumeChanged: true,
        pdfUnchanged: true,
      });
    });
  });

  describe("markResumePdfSynced", () => {
    it("refuses (without writing) when resume changed but the PDF didn't, and force wasn't passed", () => {
      setUp();
      recordCurrentStateAsSynced();
      writeFileSync(paths.resumeSourcePaths[1], "skills-v2");
      const manifestBefore = requireHash(paths.manifestPath);

      expect(() => markResumePdfSynced(paths)).toThrow(
        /doesn't look like it actually re-exported/,
      );
      expect(requireHash(paths.manifestPath)).toBe(manifestBefore);
    });

    it("writes the new state when forced, even though the PDF didn't change", () => {
      setUp();
      recordCurrentStateAsSynced();
      writeFileSync(paths.resumeSourcePaths[1], "skills-v2");

      expect(() => markResumePdfSynced(paths, { force: true })).not.toThrow();
      expect(isResumePdfUpToDate(paths)).toBe(true);
    });

    it("writes the new state without needing force when the PDF actually changed too", () => {
      setUp();
      recordCurrentStateAsSynced();
      writeFileSync(paths.resumeSourcePaths[1], "skills-v2");
      writeFileSync(paths.pdfPath, "freshly-exported-pdf-bytes");

      expect(() => markResumePdfSynced(paths)).not.toThrow();
      expect(isResumePdfUpToDate(paths)).toBe(true);
    });

    it("throws naming the missing file when a resume source doesn't exist", () => {
      setUp();
      rmSync(paths.resumeSourcePaths[0]);

      expect(() => markResumePdfSynced(paths)).toThrow(
        new RegExp(`${paths.resumeSourcePaths[0]}.*does not exist`),
      );
    });

    it("throws naming the missing PDF when it doesn't exist", () => {
      setUp();
      rmSync(paths.pdfPath);

      expect(() => markResumePdfSynced(paths)).toThrow(
        /does not exist.*resume-pdf-export/s,
      );
    });
  });
});

describe("currentExperienceYears", () => {
  // resume.ts's own getExperienceLength() is the source of truth; this
  // module can't import it directly (see the comment on
  // EXPERIENCE_BASE_YEAR in resumePdfManifest.ts), so this test is the only
  // thing standing between the two constants silently drifting apart.
  it("matches resume.ts's getExperienceLength()", () => {
    expect(currentExperienceYears()).toBe(getExperienceLength());
  });
});
