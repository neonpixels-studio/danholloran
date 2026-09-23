import { mkdirSync, readdirSync, renameSync, rmSync } from "fs";
import { join } from "path";
import sharp from "sharp";
// Explicit .ts extensions: see imageVariantManifest.ts.
import {
  DEFAULT_IMAGE_VARIANT_PATHS,
  ENCODER_QUALITY,
  VARIANT_COMBINATIONS,
  fingerprintSource,
  isImageFresh,
  listSourceImages,
  readManifest,
  variantFileNamesFor,
  writeManifest,
  type ImageVariantManifest,
  type ImageVariantPaths,
  type VariantCombination,
} from "./imageVariantManifest.ts";
import {
  slugFromFileName,
  variantFileName,
  type ImageFormat,
} from "./responsiveImage.ts";

// Bounds how many source images encode at once (each runs its variants
// sequentially). Unbounded Promise.all across a few hundred images would
// queue every encode at once; this keeps resource use predictable.
const CONCURRENCY = 8;
const TEMP_SUFFIX = ".tmp";

// The actual image-encoding side effect, isolated behind this interface so
// the orchestration logic below (which files, skip-if-fresh, slug
// collisions, pruning) is testable with a fake instead of invoking real
// image encoding.
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
    // Encoding to a temp path and renaming into place keeps a killed process
    // (Ctrl-C, a CI timeout) from leaving a truncated variant that would get
    // committed and shipped.
    const temporaryPath = `${outputPath}${TEMP_SUFFIX}`;
    try {
      const pipeline = sharp(sourcePath).resize({
        width,
        // Never upscale a source narrower than the target width.
        withoutEnlargement: true,
      });
      const encoded =
        format === "avif"
          ? pipeline.avif({ quality: ENCODER_QUALITY.avif })
          : pipeline.webp({ quality: ENCODER_QUALITY.webp });
      await encoded.toFile(temporaryPath);
      renameSync(temporaryPath, outputPath);
    } catch (error) {
      rmSync(temporaryPath, { force: true });
      throw error;
    }
  },
};

export interface GenerateImageVariantsOptions extends Partial<ImageVariantPaths> {
  processor?: ImageProcessor;
}

export interface GenerateImageVariantsResult {
  encoded: string[];
  removed: string[];
}

interface GenerationContext extends ImageVariantPaths {
  processor: ImageProcessor;
  manifest: ImageVariantManifest;
  encoded: string[];
}

// Two source files that share a slug (e.g. "a.jpg" and "a.png") would
// overwrite each other's variant files. Grouped case-insensitively: "Post.jpg"
// and "post.png" produce the same variant filenames on the case-insensitive
// filesystems this project ships from (macOS/APFS locally).
function groupFileNamesBySlug(fileNames: string[]): Map<string, string[]> {
  const fileNamesBySlug = new Map<string, string[]>();
  for (const fileName of fileNames) {
    const slugKey = slugFromFileName(fileName).toLowerCase();
    fileNamesBySlug.set(slugKey, [
      ...(fileNamesBySlug.get(slugKey) ?? []),
      fileName,
    ]);
  }
  return fileNamesBySlug;
}

function assertNoSlugCollisions(fileNames: string[]): void {
  const collision = [...groupFileNamesBySlug(fileNames)].find(
    ([, fileNamesForSlug]) => fileNamesForSlug.length > 1,
  );
  if (!collision) {
    return;
  }
  const [slug, fileNamesForSlug] = collision;
  throw new Error(
    `generateImageVariants: "${fileNamesForSlug.join('", "')}" all resolve ` +
      `to the same slug "${slug}" — rename one so their variants don't collide`,
  );
}

// Variants are committed, so a deleted or renamed post image would otherwise
// leave its variants (and manifest entry) in the repo and the deploy forever.
function pruneOrphans(
  context: GenerationContext,
  sourceFileNames: string[],
): string[] {
  const expected = new Set(sourceFileNames.flatMap(variantFileNamesFor));
  const orphans = readdirSync(context.outputDir).filter(
    (fileName) => !expected.has(fileName),
  );
  for (const orphan of orphans) {
    rmSync(join(context.outputDir, orphan), { force: true });
  }

  const sourceSet = new Set(sourceFileNames);
  for (const manifestKey of Object.keys(context.manifest)) {
    if (!sourceSet.has(manifestKey)) {
      delete context.manifest[manifestKey];
    }
  }
  return orphans;
}

async function encodeVariant(
  context: GenerationContext,
  sourceFileName: string,
  { variant, width, format }: VariantCombination,
): Promise<void> {
  const slug = slugFromFileName(sourceFileName);
  const outputPath = join(
    context.outputDir,
    variantFileName(slug, variant, width, format),
  );
  try {
    await context.processor.resizeToFormat(
      join(context.sourceDir, sourceFileName),
      outputPath,
      width,
      format,
    );
  } catch (error) {
    throw new Error(
      `generateImageVariants: failed "${sourceFileName}" ` +
        `${variant}/${width}w.${format}`,
      { cause: error },
    );
  }
}

// The fingerprint is read before encoding, so a source replaced mid-encode
// records the old fingerprint and gets redone on the next run. The manifest
// is written after every image so an interrupted run keeps its progress.
async function refreshImage(
  context: GenerationContext,
  sourceFileName: string,
): Promise<void> {
  const fingerprint = fingerprintSource(
    join(context.sourceDir, sourceFileName),
  );
  if (
    isImageFresh(
      sourceFileName,
      fingerprint,
      context.manifest,
      context.outputDir,
    )
  ) {
    return;
  }
  for (const combination of VARIANT_COMBINATIONS) {
    await encodeVariant(context, sourceFileName, combination);
  }
  context.manifest[sourceFileName] = fingerprint;
  writeManifest(context.manifestPath, context.manifest);
  context.encoded.push(sourceFileName);
}

// Marks the shared `failed` flag first so every other worker's loop
// condition sees it as soon as possible, then rethrows so Promise.all still
// surfaces the original error.
async function runAndFlagFailureOnError(
  run: (_item: string) => Promise<void>,
  item: string,
  onFailure: () => void,
): Promise<void> {
  try {
    await run(item);
  } catch (error) {
    onFailure();
    throw error;
  }
}

async function runWithConcurrency(
  items: string[],
  concurrency: number,
  run: (_item: string) => Promise<void>,
): Promise<void> {
  const queue = [...items];
  // Once one image fails the whole run fails anyway, so the other workers
  // stop pulling new images instead of encoding files nobody will commit.
  let failed = false;
  const workers = Array.from({ length: concurrency }, async () => {
    for (let item = queue.shift(); item && !failed; item = queue.shift()) {
      await runAndFlagFailureOnError(run, item, () => {
        failed = true;
      });
    }
  });
  await Promise.all(workers);
}

// Encodes only images whose manifest fingerprint is missing or outdated (or
// whose variant files are missing), and prunes variants for deleted images.
// Run via `npm run images` locally and by the Image Variants GitHub Action;
// `vitepress build` never encodes, it only verifies (see config.ts).
export async function generateImageVariants(
  options: GenerateImageVariantsOptions = {},
): Promise<GenerateImageVariantsResult> {
  const context: GenerationContext = {
    sourceDir: options.sourceDir ?? DEFAULT_IMAGE_VARIANT_PATHS.sourceDir,
    outputDir: options.outputDir ?? DEFAULT_IMAGE_VARIANT_PATHS.outputDir,
    manifestPath:
      options.manifestPath ?? DEFAULT_IMAGE_VARIANT_PATHS.manifestPath,
    processor: options.processor ?? sharpImageProcessor,
    manifest: {},
    encoded: [],
  };
  context.manifest = readManifest(context.manifestPath);

  mkdirSync(context.outputDir, { recursive: true });

  const sourceFileNames = listSourceImages(context.sourceDir);
  assertNoSlugCollisions(sourceFileNames);
  const removed = pruneOrphans(context, sourceFileNames);
  writeManifest(context.manifestPath, context.manifest);

  await runWithConcurrency(sourceFileNames, CONCURRENCY, (fileName) =>
    refreshImage(context, fileName),
  );
  return { encoded: context.encoded, removed };
}
