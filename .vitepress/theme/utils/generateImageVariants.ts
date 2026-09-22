import { mkdirSync, readdirSync, statSync } from "fs";
import { fileURLToPath } from "node:url";
import { basename, dirname, extname, join } from "path";
import sharp from "sharp";
import {
  IMAGE_FORMATS,
  IMAGE_VARIANT_WIDTHS,
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

const SOURCE_EXTENSIONS = new Set([".jpg", ".jpeg", ".png"]);
const AVIF_QUALITY = 50;
const WEBP_QUALITY = 68;
// Bounds how many sharp encodes run at once. Unbounded Promise.all across the
// full post-image library (a few hundred files × widths × formats) would
// queue thousands of concurrent file handles/encodes at once; this keeps
// resource use predictable without meaningfully slowing the first run.
const CONCURRENCY = 8;

// The actual image-encoding side effect, isolated behind this interface so
// the orchestration logic below (which files, which widths, skip-if-fresh)
// is testable with a fake instead of invoking real image encoding.
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
    await encoded.toFile(outputPath);
  },
};

export interface GenerateImageVariantsOptions {
  sourceDir?: string;
  outputDir?: string;
  processor?: ImageProcessor;
}

function listSourceImages(sourceDir: string): string[] {
  return readdirSync(sourceDir).filter((fileName) =>
    SOURCE_EXTENSIONS.has(extname(fileName).toLowerCase()),
  );
}

function isUpToDate(sourcePath: string, outputPath: string): boolean {
  try {
    return statSync(outputPath).mtimeMs >= statSync(sourcePath).mtimeMs;
  } catch {
    // No existing output (or an unreadable one) is never up to date.
    return false;
  }
}

interface VariantJob {
  sourcePath: string;
  fileName: string;
  outputPath: string;
  variant: ImageVariant;
  width: number;
  format: ImageFormat;
}

function planJobs(sourceDir: string, outputDir: string): VariantJob[] {
  const jobs: VariantJob[] = [];
  for (const fileName of listSourceImages(sourceDir)) {
    const slug = basename(fileName, extname(fileName));
    const sourcePath = join(sourceDir, fileName);
    for (const variant of Object.keys(IMAGE_VARIANT_WIDTHS) as ImageVariant[]) {
      for (const width of IMAGE_VARIANT_WIDTHS[variant]) {
        for (const format of IMAGE_FORMATS) {
          jobs.push({
            sourcePath,
            fileName,
            outputPath: join(
              outputDir,
              `${slug}-${variant}-${width}.${format}`,
            ),
            variant,
            width,
            format,
          });
        }
      }
    }
  }
  return jobs;
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
    // A single bad/corrupt source image shouldn't take down `vitepress
    // dev`/`build` for every other post — warn loudly (matching
    // markdownImageHints.ts's readLocalImageDimensions) and let
    // ResponsiveImage.vue's <picture> fall through to the other format /
    // the original-image <img> fallback for this one file.
    console.warn(
      `generateImageVariants: failed "${job.fileName}" ` +
        `${job.variant}/${job.width}w.${job.format}: ${(error as Error).message}`,
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
// source), so repeat dev-server restarts and CI runs after the first are
// fast. Runs at config load (see config.ts) rather than in the `buildEnd`
// hook used by generateFeed/generateLlmsTxt: those write post-build
// artifacts nothing downstream reads back, but these variant files back the
// srcset paths ResponsiveImage.vue renders, so they need to exist for
// `vitepress dev` too, not just `vitepress build`.
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
