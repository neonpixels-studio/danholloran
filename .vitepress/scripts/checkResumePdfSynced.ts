// Entry point for `npm run resume:pdf:check`, run with Node's built-in type
// stripping (no bundler), same reason as generateImageVariants.ts: explicit
// .ts extension on the import below.
//
// Read-only: verifies resume.ts and public/dan_holloran_resume.pdf match the
// hashes recorded in resumePdfManifest.json, failing (and failing the
// `build` script, which runs this first) if they don't. To fix drift, see
// markResumePdfSynced.ts / `npm run resume:pdf:sync`.
import { assertResumePdfUpToDate } from "../theme/utils/resumePdfManifest.ts";

try {
  assertResumePdfUpToDate();
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}
