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
  fingerprintFile,
  readResumePdfManifest,
  writeResumePdfManifest,
} from "../theme/utils/resumePdfManifest.ts";

const { resumeDataPath, pdfPath, manifestPath } =
  DEFAULT_RESUME_PDF_MANIFEST_PATHS;

if (!existsSync(pdfPath)) {
  throw new Error(
    `${pdfPath} does not exist. Export it via the resume-pdf-export skill ` +
      "before running this script.",
  );
}

const previousManifest = readResumePdfManifest(manifestPath);
const currentPdfHash = fingerprintFile(pdfPath);

// Recording an unchanged PDF hash means the skill was never actually re-run
// against the current resume.ts — this script only records state, it can't
// verify the PDF's contents actually reflect resume.ts's current data.
if (previousManifest && previousManifest.pdfHash === currentPdfHash) {
  console.warn(
    "Warning: the PDF's content hash is unchanged since the last sync. " +
      "If resume.ts changed, make sure the resume-pdf-export skill actually " +
      "re-exported the PDF before trusting this sync.",
  );
}

writeResumePdfManifest(manifestPath, {
  resumeHash: fingerprintFile(resumeDataPath),
  pdfHash: currentPdfHash,
});

console.log(
  "Recorded resume.ts's and the PDF's current content hashes in " +
    "resumePdfManifest.json. Commit this alongside the freshly exported PDF.",
);
