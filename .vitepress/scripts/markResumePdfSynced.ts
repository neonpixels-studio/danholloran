// Entry point for `npm run resume:pdf:sync`, run with Node's built-in type
// stripping (no bundler), same reason as generateImageVariants.ts: explicit
// .ts extension on the import below.
//
// Run this immediately after re-exporting public/dan_holloran_resume.pdf via
// the Claude skill `resume-pdf-export`, then commit the PDF alongside the
// updated resumePdfManifest.json. This does not touch the PDF itself.
import { existsSync } from "fs";
import {
  DEFAULT_RESUME_PDF_MANIFEST_PATHS,
  checkResumeSyncConsistency,
  fingerprintFile,
  writeResumePdfManifest,
  type ResumePdfManifestPaths,
} from "../theme/utils/resumePdfManifest.ts";

const FORCE_FLAG = "--force";

function assertSourcesExist(paths: ResumePdfManifestPaths): void {
  if (!existsSync(paths.resumeDataPath)) {
    throw new Error(
      `${paths.resumeDataPath} does not exist. Nothing to record.`,
    );
  }
  if (!existsSync(paths.pdfPath)) {
    throw new Error(
      `${paths.pdfPath} does not exist. Export it via the ` +
        "resume-pdf-export skill before running this script.",
    );
  }
}

// resume.ts changed but the PDF's bytes didn't: the export skill most
// likely never ran. Recording the new resume.ts hash next to the stale PDF
// hash here would make the drift guard pass forever with a stale PDF — the
// exact silent failure this feature exists to prevent. Refuse unless the
// caller explicitly overrides (e.g. a resume.ts edit that provably can't
// change the rendered PDF).
function assertExportWasLikelyRun(paths: ResumePdfManifestPaths): void {
  const { resumeChanged, pdfUnchanged } = checkResumeSyncConsistency(paths);
  if (!resumeChanged || !pdfUnchanged || process.argv.includes(FORCE_FLAG)) {
    return;
  }
  throw new Error(
    "resume.ts changed but the PDF's content hash is unchanged since the " +
      "last sync — the resume-pdf-export skill doesn't look like it " +
      "actually re-exported the PDF. Re-export the PDF and try again, or " +
      `re-run with ${FORCE_FLAG} if you're certain this PDF is already ` +
      "correct.",
  );
}

function recordCurrentHashes(paths: ResumePdfManifestPaths): void {
  // Existence was already asserted by assertSourcesExist, so these hashes
  // cannot be null.
  writeResumePdfManifest(paths.manifestPath, {
    resumeHash: fingerprintFile(paths.resumeDataPath) as string,
    pdfHash: fingerprintFile(paths.pdfPath) as string,
  });
}

function markResumePdfSynced(): void {
  const paths = DEFAULT_RESUME_PDF_MANIFEST_PATHS;

  assertSourcesExist(paths);
  assertExportWasLikelyRun(paths);
  recordCurrentHashes(paths);

  console.log(
    "Recorded resume.ts's and the PDF's current content hashes in " +
      "resumePdfManifest.json. Commit this alongside the freshly exported " +
      "PDF.",
  );
}

try {
  markResumePdfSynced();
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}
