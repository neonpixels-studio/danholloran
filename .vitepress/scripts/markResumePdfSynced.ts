// Entry point for `npm run resume:pdf:sync`, run with Node's built-in type
// stripping (no bundler), same reason as generateImageVariants.ts: explicit
// .ts extension on the import below.
//
// Run this immediately after re-exporting public/dan_holloran_resume.pdf via
// the Claude skill `resume-pdf-export`, then commit the PDF alongside the
// updated resumePdfManifest.json. This does not touch the PDF itself.
import {
  DEFAULT_RESUME_PDF_MANIFEST_PATHS,
  fingerprintResumeData,
  writeResumePdfManifest,
} from "../theme/utils/resumePdfManifest.ts";

const { resumeDataPath, manifestPath } = DEFAULT_RESUME_PDF_MANIFEST_PATHS;

writeResumePdfManifest(manifestPath, {
  resumeHash: fingerprintResumeData(resumeDataPath),
});

console.log(
  "Recorded resume.ts's current content hash in resumePdfManifest.json. " +
    "Commit this alongside the freshly exported PDF.",
);
