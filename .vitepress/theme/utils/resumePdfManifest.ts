import { createHash } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "path";

// Freshness for the downloadable resume PDF (public/dan_holloran_resume.pdf).
// The PDF is a static export of resume.ts produced by a Claude skill
// (resume-pdf-export) that isn't available in CI, so it can't be
// regenerated automatically here. Instead, a content fingerprint of
// resume.ts is recorded in a committed marker every time the PDF is
// re-exported (see `npm run resume:pdf:sync`); this check fails loud when
// the fingerprint drifts, so an edit to resume.ts without a matching PDF
// export can't merge silently. Content hash, not mtime: every fresh git
// clone (CI, Netlify) stamps every file with the checkout time, so an mtime
// comparison would call everything stale.

const PROJECT_ROOT = join(
  dirname(fileURLToPath(import.meta.url)),
  "..",
  "..",
  "..",
);

const RESUME_DATA_PATH = join(PROJECT_ROOT, ".vitepress", "data", "resume.ts");
const MANIFEST_PATH = join(
  PROJECT_ROOT,
  ".vitepress",
  "data",
  "resumePdfManifest.json",
);

export interface ResumePdfManifest {
  resumeHash: string;
}

export interface ResumePdfManifestPaths {
  resumeDataPath: string;
  manifestPath: string;
}

export const DEFAULT_RESUME_PDF_MANIFEST_PATHS: ResumePdfManifestPaths = {
  resumeDataPath: RESUME_DATA_PATH,
  manifestPath: MANIFEST_PATH,
};

export function fingerprintResumeData(resumeDataPath: string): string {
  return createHash("sha256")
    .update(readFileSync(resumeDataPath))
    .digest("hex");
}

export function readResumePdfManifest(
  manifestPath: string,
): ResumePdfManifest | null {
  if (!existsSync(manifestPath)) {
    return null;
  }
  return JSON.parse(readFileSync(manifestPath, "utf8"));
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
  return manifest.resumeHash === fingerprintResumeData(paths.resumeDataPath);
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
      "the content hash recorded in resumePdfManifest.json doesn't match " +
      "resume.ts's current content. Re-run the Claude skill " +
      "`resume-pdf-export` to regenerate the PDF, then run " +
      "`npm run resume:pdf:sync` to record the new hash, and commit both.",
  );
}
