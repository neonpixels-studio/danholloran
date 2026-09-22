import { existsSync, mkdirSync, readdirSync, renameSync, statSync } from "fs";
import { fileURLToPath } from "node:url";
import { basename, dirname, extname, join } from "path";
import sharp from "sharp";
import {
  IMAGE_FORMATS,
  IMAGE_VARIANT_WIDTHS,
  PROCESSABLE_SOURCE_EXTENSIONS,
  variantFileName,
  type ImageFormat,
  type ImageVariant,
} from "./responsiveImage";

// Absolute path to public/images/posts, anchored to this module (mirrors
// markdownImageHints.ts's PUBLIC_DIR) so it resolves regardless of the
// process working directory.
const SOURCE_DIR = join(
  dirname(fileURLToPath(import.meta.url)),
  "..",
  "..",
  "..",
  "public",
  "images",
  "posts",
);
const OUTPUT_DIR = join(SOURCE_DIR, "variants");

const AVIF_QUALITY = 50;
const WEBP_QUALITY = 68;
// Bounds how many sharp encodes run at once. Unbounded Promise.all across the
// full post-image library (a few hundred files × widths × formats) would
// queue thousands of concurrent file handles/encodes at once; this keeps
// resource use predictable without meaningfully slowing the first run.
const CONCURRENCY = 8;
const TEMP_SUFFIX = ".tmp";

// The actual image-encoding side effect, isolated behind this interface so
// the orchestration logic below (which files, which widths, skip-if-fresh,
// slug collisions) is testable with a fake instead of invoking real image
// encoding.
export interface ImageProcessor {
  resizeToFormat(
    _sourcePath: string,
    _outputPath: string,
    _width: number,
    _format: ImageFormat,
  ): Promise<void>;
}

export const sharpImageProcessor: ImageProcessor = {
  async resizeToFormat(sourcePath, outputPath, width, format) {
    // sharp's toFile writes straight to its target path; a process killed
    // mid-encode (Ctrl-C during `vitepress dev`, a CI timeout) would leave a
    // truncated file whose mtime is already newer than the source, and
    // isUpToDate would treat that corrupt file as fresh forever. Encoding to
    // a temp path and renaming into place makes the write atomic: either the
    // final file is a complete, valid encode, or it doesn't exist.
    const temporaryPath = `${outputPath}${TEMP_SUFFIX}`;
    const pipeline = sharp(sourcePath).resize({
      width,
      // Post images are already at or below the largest variant width, so
      // this is a format-conversion no-op for at-size sources — it never
      // upscales the small legacy assets that are narrower than a given
      // target width.
      withoutEnlargement: true,
    });
    const encoded =
      format === "avif"
        ? pipeline.avif({ quality: AVIF_QUALITY })
        : pipeline.webp({ quality: WEBP_QUALITY });
    await encoded.toFile(temporaryPath);
    renameSync(temporaryPath, outputPath);
  },
};

export interface GenerateImageVariantsOptions {
  sourceDir?: string;
  outputDir?: string;
  processor?: ImageProcessor;
}

function listSourceImages(sourceDir: string): string[] {
  return readdirSync(sourceDir).filter((fileName) =>
    PROCESSABLE_SOURCE_EXTENSIONS.has(extname(fileName).toLowerCase()),
  );
}

// Two source files that share a slug (e.g. "a.jpg" and "a.png") would
// overwrite each other's variant files, so whichever happens to run last
// wins and the other silently serves the wrong photo. Fail loud instead of
// letting that happen quietly.
function assertNoSlugCollisions(fileNames: string[]): void {
  const fileNamesBySlug = new Map<string, string[]>();
  for (const fileName of fileNames) {
    const slug = basename(fileName, extname(fileName));
    fileNamesBySlug.set(slug, [...(fileNamesBySlug.get(slug) ?? []), fileName]);
  }
  for (const [slug, fileNamesForSlug] of fileNamesBySlug) {
    if (fileNamesForSlug.length > 1) {
      throw new Error(
        `generateImageVariants: "${fileNamesForSlug.join('", "')}" all resolve ` +
          `to the same slug "${slug}" — rename one so their variants don't collide`,
      );
    }
  }
}

function isUpToDate(sourcePath: string, outputPath: string): boolean {
  if (!existsSync(outputPath)) {
    return false;
  }
  return statSync(outputPath).mtimeMs >= statSync(sourcePath).mtimeMs;
}

interface VariantJob {
  sourcePath: string;
  fileName: string;
  outputPath: string;
  variant: ImageVariant;
  width: number;
  format: ImageFormat;
}

// Every (variant, width, format) combination the site ships, built once so
// planJobsForImage can map over it instead of nesting three more loops
// inside the per-file loop in planJobs.
const VARIANT_COMBINATIONS: {
  variant: ImageVariant;
  width: number;
  format: ImageFormat;
}[] = (Object.keys(IMAGE_VARIANT_WIDTHS) as ImageVariant[]).flatMap((variant) =>
  IMAGE_VARIANT_WIDTHS[variant].flatMap((width) =>
    IMAGE_FORMATS.map((format) => ({ variant, width, format })),
  ),
);

function planJobsForImage(
  sourceDir: string,
  outputDir: string,
  fileName: string,
): VariantJob[] {
  const slug = basename(fileName, extname(fileName));
  const sourcePath = join(sourceDir, fileName);
  return VARIANT_COMBINATIONS.map(({ variant, width, format }) => ({
    sourcePath,
    fileName,
    outputPath: join(outputDir, variantFileName(slug, variant, width, format)),
    variant,
    width,
    format,
  }));
}

function planJobs(sourceDir: string, outputDir: string): VariantJob[] {
  const fileNames = listSourceImages(sourceDir);
  assertNoSlugCollisions(fileNames);
  return fileNames.flatMap((fileName) =>
    planJobsForImage(sourceDir, outputDir, fileName),
  );
}

async function runJob(
  processor: ImageProcessor,
  job: VariantJob,
): Promise<void> {
  if (isUpToDate(job.sourcePath, job.outputPath)) {
    return;
  }
  try {
    await processor.resizeToFormat(
      job.sourcePath,
      job.outputPath,
      job.width,
      job.format,
    );
  } catch (error) {
    // ResponsiveImage.vue only points a <picture> at these urls once this
    // whole function has completed without error (see config.ts) — a
    // <picture>'s <source> does not fall back to the next one on a 404, so a
    // silently-skipped variant would ship a broken image to real visitors.
    // Failing the whole run is the honest outcome: fix the source image (or
    // its permissions) and re-run, rather than discovering the gap in
    // production.
    throw new Error(
      `generateImageVariants: failed "${job.fileName}" ` +
        `${job.variant}/${job.width}w.${job.format}`,
      { cause: error },
    );
  }
}

async function runWithConcurrency(
  jobs: VariantJob[],
  concurrency: number,
  run: (_job: VariantJob) => Promise<void>,
): Promise<void> {
  const queue = [...jobs];
  const workers = Array.from({ length: concurrency }, async () => {
    for (let job = queue.shift(); job; job = queue.shift()) {
      await run(job);
    }
  });
  await Promise.all(workers);
}

// Regenerates only what's missing or stale (mtime-compared against the
// source), so a repeat run only (re-)encodes new/changed post images — a
// clean checkout with no cached public/images/posts/variants/ still
// (re-)encodes everything the first time a dev server/build starts, which
// takes real time given the avif encoder's speed; see README for caching
// this directory in CI if that first-run cost matters. Runs at config load
// (see config.ts) rather than in the `buildEnd` hook used by
// generateFeed/generateLlmsTxt: those write post-build artifacts nothing
// downstream reads back, but these variant files back the srcset paths
// ResponsiveImage.vue renders, so they need to exist for `vitepress dev`
// too, not just `vitepress build`.
export async function generateImageVariants(
  options: GenerateImageVariantsOptions = {},
): Promise<void> {
  const sourceDir = options.sourceDir ?? SOURCE_DIR;
  const outputDir = options.outputDir ?? OUTPUT_DIR;
  const processor = options.processor ?? sharpImageProcessor;

  mkdirSync(outputDir, { recursive: true });

  const jobs = planJobs(sourceDir, outputDir);
  await runWithConcurrency(jobs, CONCURRENCY, (job) => runJob(processor, job));
}
