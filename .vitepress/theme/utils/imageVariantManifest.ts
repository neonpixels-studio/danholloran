import { createHash } from "node:crypto";
import { existsSync, readFileSync, readdirSync, writeFileSync } from "fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "path";
// Explicit .ts extensions: this module is also loaded by plain `node` (via
// `npm run images`, which uses Node's built-in type stripping), and Node
// doesn't resolve extensionless relative imports the way Vite does.
import {
  IMAGE_FORMATS,
  IMAGE_VARIANT_WIDTHS,
  isProcessableFileName,
  slugFromFileName,
  variantFileName,
  type ImageFormat,
  type ImageVariant,
} from "./responsiveImage.ts";

// Freshness for the committed post-image variants. Each processed source
// image gets a content fingerprint recorded in a committed manifest; a
// variant set is fresh only when the manifest's fingerprint matches the
// source's current one and every variant file exists. Content hashes, not
// mtimes: every fresh git clone (CI, Netlify) stamps every file with the
// checkout time, so an mtime comparison would call everything stale.

const PROJECT_ROOT = join(
  dirname(fileURLToPath(import.meta.url)),
  "..",
  "..",
  "..",
);

const SOURCE_DIR = join(PROJECT_ROOT, "public", "images", "posts");
const OUTPUT_DIR = join(SOURCE_DIR, "variants");
const MANIFEST_PATH = join(
  PROJECT_ROOT,
  ".vitepress",
  "data",
  "imageVariantsManifest.json",
);

export const ENCODER_QUALITY: Record<ImageFormat, number> = {
  avif: 50,
  webp: 68,
};

// Folded into every fingerprint so changing a width, format, or quality
// marks every image stale, not only new ones.
const ENCODER_SETTINGS = JSON.stringify({
  widths: IMAGE_VARIANT_WIDTHS,
  formats: IMAGE_FORMATS,
  quality: ENCODER_QUALITY,
});

// Source file name (e.g. "some-post.jpg") -> fingerprint of the source bytes
// and encoder settings its variants were produced from.
export type ImageVariantManifest = Record<string, string>;

export interface ImageVariantPaths {
  sourceDir: string;
  outputDir: string;
  manifestPath: string;
}

export const DEFAULT_IMAGE_VARIANT_PATHS: ImageVariantPaths = {
  sourceDir: SOURCE_DIR,
  outputDir: OUTPUT_DIR,
  manifestPath: MANIFEST_PATH,
};

export interface VariantCombination {
  variant: ImageVariant;
  width: number;
  format: ImageFormat;
}

// Every (variant, width, format) combination the site ships.
export const VARIANT_COMBINATIONS: VariantCombination[] = (
  Object.keys(IMAGE_VARIANT_WIDTHS) as ImageVariant[]
).flatMap((variant) =>
  IMAGE_VARIANT_WIDTHS[variant].flatMap((width) =>
    IMAGE_FORMATS.map((format) => ({ variant, width, format })),
  ),
);

export function listSourceImages(sourceDir: string): string[] {
  return readdirSync(sourceDir).filter((fileName) =>
    isProcessableFileName(fileName),
  );
}

export function variantFileNamesFor(sourceFileName: string): string[] {
  const slug = slugFromFileName(sourceFileName);
  return VARIANT_COMBINATIONS.map(({ variant, width, format }) =>
    variantFileName(slug, variant, width, format),
  );
}

export function fingerprintSource(sourcePath: string): string {
  return createHash("sha256")
    .update(ENCODER_SETTINGS)
    .update(readFileSync(sourcePath))
    .digest("hex");
}

export function readManifest(manifestPath: string): ImageVariantManifest {
  if (!existsSync(manifestPath)) {
    return {};
  }
  return JSON.parse(readFileSync(manifestPath, "utf8"));
}

// Sorted keys so regenerating in a different order doesn't churn the diff.
export function writeManifest(
  manifestPath: string,
  manifest: ImageVariantManifest,
): void {
  const sorted = Object.fromEntries(
    Object.entries(manifest).sort(([a], [b]) => a.localeCompare(b)),
  );
  writeFileSync(manifestPath, `${JSON.stringify(sorted, null, 2)}\n`);
}

export function isImageFresh(
  sourceFileName: string,
  fingerprint: string,
  manifest: ImageVariantManifest,
  outputDir: string,
): boolean {
  if (manifest[sourceFileName] !== fingerprint) {
    return false;
  }
  return variantFileNamesFor(sourceFileName).every((variantName) =>
    existsSync(join(outputDir, variantName)),
  );
}

export function findStaleSourceImages(
  paths: ImageVariantPaths = DEFAULT_IMAGE_VARIANT_PATHS,
): string[] {
  const manifest = readManifest(paths.manifestPath);
  return listSourceImages(paths.sourceDir).filter(
    (fileName) =>
      !isImageFresh(
        fileName,
        fingerprintSource(join(paths.sourceDir, fileName)),
        manifest,
        paths.outputDir,
      ),
  );
}

// ResponsiveImage.vue points a <picture> at these variants, and a <source>
// that 404s does not fall back to the <img>, so shipping a build with a
// missing variant means a broken image for real visitors. Fail instead.
export function assertImageVariantsUpToDate(
  paths: ImageVariantPaths = DEFAULT_IMAGE_VARIANT_PATHS,
): void {
  const staleFileNames = findStaleSourceImages(paths);
  if (!staleFileNames.length) {
    return;
  }
  throw new Error(
    `${staleFileNames.length} post image(s) have missing or outdated ` +
      `responsive variants: ${staleFileNames.join(", ")}. Run ` +
      "`npm run images` and commit the result (the Image Variants GitHub " +
      "Action does this automatically on pull requests).",
  );
}
