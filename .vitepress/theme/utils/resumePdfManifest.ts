import { createHash } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "path";

// Freshness for the downloadable resume PDF (public/dan_holloran_resume.pdf).
// The PDF is a static export of the live resume data produced by a Claude
// skill (resume-pdf-export) that isn't available in CI, so it can't be
// regenerated automatically here. Instead, a content fingerprint of every
// file that feeds the rendered resume, plus the "years of experience" value
// (computed from the current date, not stored in any file — see
// EXPERIENCE_BASE_YEAR below), is recorded in a committed marker every time
// the PDF is re-exported (see `npm run resume:pdf:sync`); this check fails
// loud when any of it drifts, so an edit to the resume data without a
// matching PDF export — or a PDF re-export that never actually changed the
// PDF, or a plain year rollover — can't merge silently. Content hashes, not
// mtimes: every fresh git clone (CI, Netlify) stamps every file with the
// checkout time, so an mtime comparison would call everything stale.

const PROJECT_ROOT = join(
  dirname(fileURLToPath(import.meta.url)),
  "..",
  "..",
  "..",
);

const DATA_DIR = join(PROJECT_ROOT, ".vitepress", "data");
const THEME_UTILS_DIR = join(PROJECT_ROOT, ".vitepress", "theme", "utils");

// Every file resume.ts reads from, directly or transitively, that changes
// what the rendered resume (and therefore the PDF) shows. Order is fixed so
// the combined fingerprint is reproducible regardless of directory order.
const RESUME_SOURCE_PATHS = [
  join(DATA_DIR, "resume.ts"),
  join(DATA_DIR, "skills.ts"),
  join(DATA_DIR, "past-locations.json"),
  join(THEME_UTILS_DIR, "constants.ts"),
  join(DATA_DIR, "location.json"),
];

const PDF_PATH = join(PROJECT_ROOT, "public", "dan_holloran_resume.pdf");
const MANIFEST_PATH = join(DATA_DIR, "resumePdfManifest.json");

export const FORCE_FLAG = "--force";

// Mirrors getExperienceLength() in .vitepress/data/resume.ts. Duplicated
// rather than imported: resume.ts's own imports are extensionless (resolved
// by Vite/vitest, not by plain `node`), and this module is loaded directly
// by plain-node scripts (checkResumePdfSynced.ts, markResumePdfSynced.ts).
// resumePdfManifest.test.ts runs under vitest, which CAN resolve resume.ts,
// and cross-checks this constant against resume.ts's real one so the two
// copies can't silently drift apart.
const EXPERIENCE_BASE_YEAR = 2012;

export function currentExperienceYears(): number {
  return new Date().getFullYear() - EXPERIENCE_BASE_YEAR;
}

export interface ResumePdfManifest {
  resumeHash: string;
  pdfHash: string;
  exportedExperienceYears: number;
}

export interface ResumePdfManifestPaths {
  resumeSourcePaths: string[];
  pdfPath: string;
  manifestPath: string;
}

export const DEFAULT_RESUME_PDF_MANIFEST_PATHS: ResumePdfManifestPaths = {
  resumeSourcePaths: RESUME_SOURCE_PATHS,
  pdfPath: PDF_PATH,
  manifestPath: MANIFEST_PATH,
};

// Null (not a thrown ENOENT) when the file doesn't exist, so every caller —
// the freshness check, the sync script, the tests — treats a missing
// source file or missing PDF as "not fresh" instead of crashing with a bare
// stack trace.
export function fingerprintFile(path: string): string | null {
  if (!existsSync(path)) {
    return null;
  }
  return createHash("sha256").update(readFileSync(path)).digest("hex");
}

// Combined fingerprint of every file that feeds the rendered resume. Null if
// any of them is missing.
export function fingerprintResumeSources(paths: string[]): string | null {
  const hashes = paths.map(fingerprintFile);
  if (hashes.some((hash) => hash === null)) {
    return null;
  }
  return createHash("sha256").update(hashes.join("\n")).digest("hex");
}

function isValidManifest(value: unknown): value is ResumePdfManifest {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.resumeHash === "string" &&
    typeof candidate.pdfHash === "string" &&
    typeof candidate.exportedExperienceYears === "number"
  );
}

// Malformed JSON (e.g. an unresolved merge conflict left in this file) or a
// wrong-shaped payload must read as "out of date", not crash the build with
// a bare SyntaxError that gives no hint of what to do about it. A missing
// file also lands in this same catch (readFileSync throws ENOENT), so no
// separate existsSync check is needed.
export function readResumePdfManifest(
  manifestPath: string,
): ResumePdfManifest | null {
  try {
    const parsed = JSON.parse(readFileSync(manifestPath, "utf8"));
    return isValidManifest(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function writeResumePdfManifest(
  manifestPath: string,
  manifest: ResumePdfManifest,
): void {
  writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
}

export function isResumePdfUpToDate(
  paths: ResumePdfManifestPaths = DEFAULT_RESUME_PDF_MANIFEST_PATHS,
): boolean {
  const manifest = readResumePdfManifest(paths.manifestPath);
  if (!manifest) {
    return false;
  }
  const resumeHash = fingerprintResumeSources(paths.resumeSourcePaths);
  const pdfHash = fingerprintFile(paths.pdfPath);
  if (resumeHash === null || pdfHash === null) {
    return false;
  }
  return (
    manifest.resumeHash === resumeHash &&
    manifest.pdfHash === pdfHash &&
    manifest.exportedExperienceYears === currentExperienceYears()
  );
}

// ResumeView.vue links straight to the static PDF with no build-time render
// of it, so a stale export is invisible to every other check. Fail instead.
export function assertResumePdfUpToDate(
  paths: ResumePdfManifestPaths = DEFAULT_RESUME_PDF_MANIFEST_PATHS,
): void {
  if (isResumePdfUpToDate(paths)) {
    return;
  }
  throw new Error(
    "public/dan_holloran_resume.pdf may be out of sync with the resume " +
      "data: the content hashes (or the recorded years of experience) in " +
      "resumePdfManifest.json don't match the current resume source " +
      "files, the current date, or the PDF's current content — or one of " +
      "those is missing. Re-run the Claude skill `resume-pdf-export` to " +
      "regenerate the PDF, then run `npm run resume:pdf:sync` to record " +
      "the new state, and commit both.",
  );
}

export interface ResumeSyncConsistency {
  // The recorded state (content hash or experience-years) no longer
  // matches the live resume data, so a fresh export is due.
  resumeChanged: boolean;
  // The PDF's content hash is identical to what the manifest last recorded.
  pdfUnchanged: boolean;
}

// Pure check, isolated from any file-writing side effect so it can be unit
// tested directly: does the live resume data disagree with what was last
// recorded, while the PDF's bytes stayed exactly the same? That combination
// means the resume-pdf-export skill most likely never actually ran (or ran
// before, say, a New Year's Day experience-year bump), and recording new
// resume state next to the stale PDF hash would make the guard pass forever
// with a stale PDF — the exact silent failure this feature exists to
// prevent.
export function checkResumeSyncConsistency(
  paths: ResumePdfManifestPaths = DEFAULT_RESUME_PDF_MANIFEST_PATHS,
): ResumeSyncConsistency {
  const previousManifest = readResumePdfManifest(paths.manifestPath);
  const currentResumeHash = fingerprintResumeSources(paths.resumeSourcePaths);
  const currentPdfHash = fingerprintFile(paths.pdfPath);
  const resumeChanged =
    !previousManifest ||
    previousManifest.resumeHash !== currentResumeHash ||
    previousManifest.exportedExperienceYears !== currentExperienceYears();
  const pdfUnchanged =
    previousManifest !== null && previousManifest.pdfHash === currentPdfHash;
  return { resumeChanged, pdfUnchanged };
}

function assertResumeSourcesExist(paths: string[]): void {
  const missing = paths.find((path) => !existsSync(path));
  if (missing) {
    throw new Error(`${missing} does not exist. Nothing to record.`);
  }
}

function assertPdfExists(pdfPath: string): void {
  if (!existsSync(pdfPath)) {
    throw new Error(
      `${pdfPath} does not exist. Export it via the resume-pdf-export ` +
        "skill before running this script.",
    );
  }
}

function assertExportWasLikelyRun(
  paths: ResumePdfManifestPaths,
  force: boolean,
): void {
  const { resumeChanged, pdfUnchanged } = checkResumeSyncConsistency(paths);
  if (!resumeChanged || !pdfUnchanged || force) {
    return;
  }
  throw new Error(
    "The resume data changed (or the years-of-experience value rolled " +
      "over) but the PDF's content hash is unchanged since the last sync " +
      "— the resume-pdf-export skill doesn't look like it actually " +
      "re-exported the PDF. Re-export the PDF and try again, or re-run " +
      `with ${FORCE_FLAG} (npm run resume:pdf:sync -- ${FORCE_FLAG}) if ` +
      "you're certain this PDF is already correct.",
  );
}

function requireFingerprint(hash: string | null, label: string): string {
  if (hash === null) {
    throw new Error(`${label} could not be fingerprinted (missing file).`);
  }
  return hash;
}

export interface MarkResumePdfSyncedOptions {
  force?: boolean;
}

// Records the live resume data's, and the PDF's, current fingerprints as
// "synced". Call this right after re-exporting the PDF via the
// resume-pdf-export skill — see `npm run resume:pdf:sync`.
export function markResumePdfSynced(
  paths: ResumePdfManifestPaths = DEFAULT_RESUME_PDF_MANIFEST_PATHS,
  { force = false }: MarkResumePdfSyncedOptions = {},
): void {
  assertResumeSourcesExist(paths.resumeSourcePaths);
  assertPdfExists(paths.pdfPath);
  assertExportWasLikelyRun(paths, force);

  writeResumePdfManifest(paths.manifestPath, {
    resumeHash: requireFingerprint(
      fingerprintResumeSources(paths.resumeSourcePaths),
      "resume sources",
    ),
    pdfHash: requireFingerprint(fingerprintFile(paths.pdfPath), paths.pdfPath),
    exportedExperienceYears: currentExperienceYears(),
  });
}
