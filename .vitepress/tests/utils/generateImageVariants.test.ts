import { describe, it, expect, afterEach } from "vitest";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  utimesSync,
  writeFileSync,
} from "fs";
import { tmpdir } from "os";
import { join } from "path";
import {
  generateImageVariants,
  type ImageProcessor,
} from "../../theme/utils/generateImageVariants";

// Long enough for in-flight workers (a few 5ms fake encodes each) to finish.
const WORKER_DRAIN_MS = 300;

// generateImageVariants orchestrates real filesystem reads/writes and sharp
// encoding; both are swapped out here (a scratch source/output dir and a
// fake ImageProcessor) so the orchestration logic — which files get planned,
// which are skipped as up to date, slug collisions, pruning — is testable
// without touching disk-heavy image encoding.
function makeFakeProcessor(): ImageProcessor & { calls: string[] } {
  const calls: string[] = [];
  return {
    calls,
    async resizeToFormat(sourcePath, outputPath, width, format) {
      calls.push(`${sourcePath}->${outputPath} ${width}w.${format}`);
      writeFileSync(outputPath, `fake-${width}-${format}`);
    },
  };
}

describe("generateImageVariants", () => {
  let sourceDir: string;
  let outputDir: string;
  let manifestPath: string;

  afterEach(() => {
    if (sourceDir) {
      rmSync(sourceDir, { recursive: true, force: true });
    }
  });

  function setUpSourceDir(fileNames: string[]): void {
    sourceDir = mkdtempSync(join(tmpdir(), "responsive-image-source-"));
    outputDir = join(sourceDir, "variants");
    manifestPath = join(sourceDir, "manifest.json");
    for (const fileName of fileNames) {
      writeFileSync(join(sourceDir, fileName), `bytes-of-${fileName}`);
    }
  }

  function generate(processor: ImageProcessor) {
    return generateImageVariants({
      sourceDir,
      outputDir,
      manifestPath,
      processor,
    });
  }

  it("generates a thumb + hero variant in both formats for every source image", async () => {
    setUpSourceDir(["a.jpg", "b.png"]);
    const processor = makeFakeProcessor();

    const result = await generate(processor);

    // 2 variants (thumb, hero) x 2 widths each x 2 formats (avif, webp) = 8
    // files per source image.
    expect(processor.calls).toHaveLength(16);
    expect(result.encoded.sort()).toEqual(["a.jpg", "b.png"]);
    expect(existsSync(join(outputDir, "a-thumb-400.avif"))).toBe(true);
    expect(existsSync(join(outputDir, "a-hero-1200.webp"))).toBe(true);
    expect(existsSync(join(outputDir, "b-thumb-800.webp"))).toBe(true);
  });

  it("records a fingerprint per source image in the manifest", async () => {
    setUpSourceDir(["a.jpg"]);

    await generate(makeFakeProcessor());

    const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
    expect(Object.keys(manifest)).toEqual(["a.jpg"]);
    expect(manifest["a.jpg"]).toMatch(/^[0-9a-f]{64}$/);
  });

  it("skips a non-image file in the source directory", async () => {
    setUpSourceDir(["a.jpg", "notes.txt"]);
    const processor = makeFakeProcessor();

    await generate(processor);

    expect(processor.calls).toHaveLength(8);
    expect(processor.calls.every((call) => call.includes("a.jpg"))).toBe(true);
  });

  it("skips an image whose content is unchanged", async () => {
    setUpSourceDir(["a.jpg"]);
    const processor = makeFakeProcessor();

    await generate(processor);
    processor.calls.length = 0;
    await generate(processor);

    expect(processor.calls).toHaveLength(0);
  });

  it("ignores mtime changes, since a fresh git clone resets every mtime", async () => {
    setUpSourceDir(["a.jpg"]);
    const processor = makeFakeProcessor();
    await generate(processor);

    const future = new Date(Date.now() + 60_000);
    utimesSync(join(sourceDir, "a.jpg"), future, future);
    processor.calls.length = 0;
    await generate(processor);

    expect(processor.calls).toHaveLength(0);
  });

  it("regenerates an image whose content changed", async () => {
    setUpSourceDir(["a.jpg"]);
    const processor = makeFakeProcessor();
    await generate(processor);

    writeFileSync(join(sourceDir, "a.jpg"), "different-bytes");
    processor.calls.length = 0;
    await generate(processor);

    expect(processor.calls).toHaveLength(8);
  });

  it("regenerates an image whose variant file went missing", async () => {
    setUpSourceDir(["a.jpg"]);
    const processor = makeFakeProcessor();
    await generate(processor);

    rmSync(join(outputDir, "a-hero-800.avif"));
    processor.calls.length = 0;
    await generate(processor);

    expect(processor.calls).toHaveLength(8);
  });

  it("removes variants and manifest entries for a deleted source image", async () => {
    setUpSourceDir(["a.jpg", "b.jpg"]);
    await generate(makeFakeProcessor());

    rmSync(join(sourceDir, "b.jpg"));
    const result = await generate(makeFakeProcessor());

    expect(result.removed).toHaveLength(8);
    expect(existsSync(join(outputDir, "b-thumb-400.avif"))).toBe(false);
    expect(existsSync(join(outputDir, "a-thumb-400.avif"))).toBe(true);
    const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
    expect(Object.keys(manifest)).toEqual(["a.jpg"]);
  });

  it("removes a leftover .tmp file from an interrupted encode", async () => {
    setUpSourceDir(["a.jpg"]);
    mkdirSync(outputDir);
    writeFileSync(join(outputDir, "a-thumb-400.avif.tmp"), "partial");

    await generate(makeFakeProcessor());

    expect(existsSync(join(outputDir, "a-thumb-400.avif.tmp"))).toBe(false);
  });

  it("rejects two source files that resolve to the same slug before encoding anything", async () => {
    setUpSourceDir(["a.jpg", "a.png"]);
    const processor = makeFakeProcessor();

    await expect(generate(processor)).rejects.toThrow(
      /a\.jpg.*a\.png|a\.png.*a\.jpg/,
    );
    expect(processor.calls).toHaveLength(0);
  });

  it("rejects two source files whose slugs collide only by case", async () => {
    // "Post.jpg" and "post.png" have distinct slugs on a case-sensitive
    // filesystem, but the variant filenames they'd produce are the same file
    // on case-insensitive filesystems.
    setUpSourceDir(["Post.jpg", "post.png"]);
    const processor = makeFakeProcessor();

    await expect(generate(processor)).rejects.toThrow(
      /Post\.jpg.*post\.png|post\.png.*Post\.jpg/,
    );
    expect(processor.calls).toHaveLength(0);
  });

  it("fails the whole run (not just a warning) when an encode fails, naming the file", async () => {
    setUpSourceDir(["a.jpg"]);
    const failingProcessor: ImageProcessor = {
      async resizeToFormat() {
        throw new Error("boom");
      },
    };

    await expect(generate(failingProcessor)).rejects.toThrow(/a\.jpg/);
  });

  it("does not record a failed image in the manifest", async () => {
    setUpSourceDir(["a.jpg"]);
    const failingProcessor: ImageProcessor = {
      async resizeToFormat() {
        throw new Error("boom");
      },
    };

    await expect(generate(failingProcessor)).rejects.toThrow();

    const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
    expect(manifest).toEqual({});
  });

  it("stops pulling new images from the queue once one has failed", async () => {
    // 10 images, more than CONCURRENCY (8). Only the very first encode
    // fails; every other encode succeeds after a short delay. Without the
    // shared "failed" flag, the 7 other workers would move on to the 2
    // queued images after finishing their own (9 images x 8 encodes + the
    // failure = 73 calls); with it they stop after their current image.
    const fileNames = Array.from({ length: 10 }, (_, index) => `${index}.jpg`);
    setUpSourceDir(fileNames);
    let callCount = 0;
    let firstCallHasFailed = false;
    const processor: ImageProcessor = {
      async resizeToFormat(_sourcePath, outputPath, width, format) {
        callCount += 1;
        if (!firstCallHasFailed) {
          firstCallHasFailed = true;
          throw new Error("boom");
        }
        await new Promise((resolve) => setTimeout(resolve, 5));
        writeFileSync(outputPath, `fake-${width}-${format}`);
      },
    };

    await expect(generate(processor)).rejects.toThrow();
    // Promise.all rejects on the first failure while the other workers are
    // still encoding, so let them drain before counting their calls.
    await new Promise((resolve) => setTimeout(resolve, WORKER_DRAIN_MS));

    expect(callCount).toBeLessThan(73);
  });
});
