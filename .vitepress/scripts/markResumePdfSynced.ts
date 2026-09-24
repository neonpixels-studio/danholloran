// Entry point for `npm run resume:pdf:sync`, run with Node's built-in type
// stripping (no bundler), same reason as generateImageVariants.ts: explicit
// .ts extension on the import below. Thin shell — all the logic (including
// the --force refusal) lives in resumePdfManifest.ts so it's directly unit
// testable.
//
// Run this immediately after re-exporting public/dan_holloran_resume.pdf via
// the Claude skill `resume-pdf-export`, then commit the PDF alongside the
// updated resumePdfManifest.json. This does not touch the PDF itself.
import {
  DEFAULT_RESUME_PDF_MANIFEST_PATHS,
  FORCE_FLAG,
  markResumePdfSynced,
} from "../theme/utils/resumePdfManifest.ts";

try {
  markResumePdfSynced(DEFAULT_RESUME_PDF_MANIFEST_PATHS, {
    force: process.argv.includes(FORCE_FLAG),
  });
  console.log(
    "Recorded the resume data's and the PDF's current content hashes in " +
      "resumePdfManifest.json. Commit this alongside the freshly exported " +
      "PDF.",
  );
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}
