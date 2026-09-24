import { createHash } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "path";

// Freshness for the downloadable resume PDF (public/dan_holloran_resume.pdf).
// The PDF is a static export of resume.ts produced by a Claude skill
// (resume-pdf-export) that isn't available in CI, so it can't be
// regenerated automatically here. Instead, content fingerprints of both
// resume.ts and the PDF itself are recorded in a committed marker every
// time the PDF is re-exported (see `npm run resume:pdf:sync`); this check
// fails loud when either fingerprint drifts, so an edit to resume.ts
// without a matching PDF export — or a PDF re-export that never actually
// changed the PDF — can't merge silently. Content hashes, not mtimes: every
// fresh git clone (CI, Netlify) stamps every file with the checkout time,
// so an mtime comparison would call everything stale.

const PROJECT_ROOT = join(
  dirname(fileURLToPath(import.meta.url)),
  "..",
  "..",
  "..",
);

const RESUME_DATA_PATH = join(PROJECT_ROOT, ".vitepress", "data", "resume.ts");
const PDF_PATH = join(PROJECT_ROOT, "public", "dan_holloran_resume.pdf");
const MANIFEST_PATH = join(
  PROJECT_ROOT,
  ".vitepress",
  "data",
  "resumePdfManifest.json",
);

export interface ResumePdfManifest {
  resumeHash: string;
  pdfHash: string;
}

export interface ResumePdfManifestPaths {
  resumeDataPath: string;
  pdfPath: string;
  manifestPath: string;
}

export const DEFAULT_RESUME_PDF_MANIFEST_PATHS: ResumePdfManifestPaths = {
  resumeDataPath: RESUME_DATA_PATH,
  pdfPath: PDF_PATH,
  manifestPath: MANIFEST_PATH,
};

export function fingerprintFile(path: string): string {
  return createHash("sha256").update(readFileSync(path)).digest("hex");
}

function isValidManifest(value: unknown): value is ResumePdfManifest {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.resumeHash === "string" &&
    typeof candidate.pdfHash === "string"
  );
}

// Malformed JSON (e.g. an unresolved merge conflict left in this one-key
// file) must read as "out of date", not crash the build with a bare
// SyntaxError that gives no hint of what to do about it.
export function readResumePdfManifest(
  manifestPath: string,
): ResumePdfManifest | null {
  if (!existsSync(manifestPath)) {
    return null;
  }
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
  if (!manifest || !existsSync(paths.pdfPath)) {
    return false;
  }
  return (
    manifest.resumeHash === fingerprintFile(paths.resumeDataPath) &&
    manifest.pdfHash === fingerprintFile(paths.pdfPath)
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
    "public/dan_holloran_resume.pdf may be out of sync with resume.ts: " +
      "the content hashes recorded in resumePdfManifest.json don't match " +
      "resume.ts's and/or the PDF's current content (or the PDF is " +
      "missing). Re-run the Claude skill `resume-pdf-export` to " +
      "regenerate the PDF, then run `npm run resume:pdf:sync` to record " +
      "the new hashes, and commit both.",
  );
}
