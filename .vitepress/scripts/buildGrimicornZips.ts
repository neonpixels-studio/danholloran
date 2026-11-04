// Entry point for `npm run grimicorn:zips`, run with Node's built-in type
// stripping (no bundler), same reason as generateImageVariants.ts: explicit
// .ts extension on the import below.
//
// Rebuilds the "download all" zips from the current files in public/. Run it
// after editing anything under public/grimicorn-themes or
// public/grimicorn-neon-themes; the grimicornThemeLinks test fails until you do.
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { buildZip } from "../theme/utils/grimicornZip.ts";

const PUBLIC_DIR = join(import.meta.dirname, "..", "..", "public");
const THEME_DIRECTORIES = ["grimicorn-themes", "grimicorn-neon-themes"];

for (const themeName of THEME_DIRECTORIES) {
  const themeDirectory = join(PUBLIC_DIR, themeName);
  const zipPath = join(themeDirectory, `${themeName}.zip`);
  writeFileSync(zipPath, buildZip(themeDirectory, themeName));
  console.log(`Rebuilt public/${themeName}/${themeName}.zip`);
}
