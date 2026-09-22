import { describe, it, expect, afterEach } from "vitest";
import { mkdtempSync, rmSync, writeFileSync, utimesSync, existsSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import {
  generateImageVariants,
  type ImageProcessor,
} from "../../theme/utils/generateImageVariants";

// generateImageVariants orchestrates real filesystem reads/writes and sharp
// encoding; both are swapped out here (a scratch source/output dir and a
// fake ImageProcessor) so the orchestration logic — which files get planned,
// which are skipped as up to date, slug collisions — is testable without
// touching disk-heavy image encoding.
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

  afterEach(() => {
    if (sourceDir) {
      rmSync(sourceDir, { recursive: true, force: true });
    }
  });

  function setUpSourceDir(fileNames: string[]): void {
    sourceDir = mkdtempSync(join(tmpdir(), "responsive-image-source-"));
    outputDir = join(sourceDir, "variants");
    for (const fileName of fileNames) {
      writeFileSync(join(sourceDir, fileName), "fake-source-bytes");
    }
  }

  it("generates a thumb + hero variant in both formats for every source image", async () => {
    setUpSourceDir(["a.jpg", "b.png"]);
    const processor = makeFakeProcessor();

    await generateImageVariants({ sourceDir, outputDir, processor });

    // 2 variants (thumb, hero) x 2 widths each x 2 formats (avif, webp) = 8
    // files per source image.
    expect(processor.calls).toHaveLength(16);
    expect(existsSync(join(outputDir, "a-thumb-400.avif"))).toBe(true);
    expect(existsSync(join(outputDir, "a-hero-1200.webp"))).toBe(true);
    expect(existsSync(join(outputDir, "b-thumb-800.webp"))).toBe(true);
  });

  it("skips a non-image file in the source directory", async () => {
    setUpSourceDir(["a.jpg", "notes.txt"]);
    const processor = makeFakeProcessor();

    await generateImageVariants({ sourceDir, outputDir, processor });

    expect(processor.calls).toHaveLength(8);
    expect(processor.calls.every((call) => call.includes("a.jpg"))).toBe(true);
  });

  it("skips regenerating a variant that is already newer than its source", async () => {
    setUpSourceDir(["a.jpg"]);
    const processor = makeFakeProcessor();

    await generateImageVariants({ sourceDir, outputDir, processor });
    expect(processor.calls).toHaveLength(8);

    processor.calls.length = 0;
    await generateImageVariants({ sourceDir, outputDir, processor });

    expect(processor.calls).toHaveLength(0);
  });

  it("regenerates a variant when the source is touched after it", async () => {
    setUpSourceDir(["a.jpg"]);
    const processor = makeFakeProcessor();
    await generateImageVariants({ sourceDir, outputDir, processor });

    const future = new Date(Date.now() + 60_000);
    utimesSync(join(sourceDir, "a.jpg"), future, future);
    processor.calls.length = 0;
    await generateImageVariants({ sourceDir, outputDir, processor });

    expect(processor.calls).toHaveLength(8);
  });

  it("regenerates a variant when the source's mtime moves earlier, not just later", async () => {
    // A ">="-style freshness check would miss this (an older mtime still
    // satisfies output >= source), but a source can be replaced by a
    // different file that happens to carry an older mtime (cp -p, rsync -a,
    // some export tools) — exact equality catches that too.
    setUpSourceDir(["a.jpg"]);
    const processor = makeFakeProcessor();
    await generateImageVariants({ sourceDir, outputDir, processor });

    const past = new Date(Date.now() - 60_000);
    utimesSync(join(sourceDir, "a.jpg"), past, past);
    processor.calls.length = 0;
    await generateImageVariants({ sourceDir, outputDir, processor });

    expect(processor.calls).toHaveLength(8);
  });

  it("rejects two source files that resolve to the same slug before encoding anything", async () => {
    setUpSourceDir(["a.jpg", "a.png"]);
    const processor = makeFakeProcessor();

    await expect(
      generateImageVariants({ sourceDir, outputDir, processor }),
    ).rejects.toThrow(/a\.jpg.*a\.png|a\.png.*a\.jpg/);
    expect(processor.calls).toHaveLength(0);
  });

  it("fails the whole run (not just a warning) when an encode fails, naming the file", async () => {
    setUpSourceDir(["a.jpg"]);
    const failingProcessor: ImageProcessor = {
      async resizeToFormat() {
        throw new Error("boom");
      },
    };

    await expect(
      generateImageVariants({
        sourceDir,
        outputDir,
        processor: failingProcessor,
      }),
    ).rejects.toThrow(/a\.jpg/);
  });

  it("stops pulling new jobs from the queue once one has failed", async () => {
    // 2 source images x 8 jobs each = 16, more than CONCURRENCY (8), so the
    // failure has queued work left to *not* pick up. resizeToFormat fails
    // every call, so however many run before the shared "failed" flag is
    // observed, it should be well short of all 16 — proving the other
    // workers stopped pulling instead of draining the whole queue.
    setUpSourceDir(["a.jpg", "b.jpg"]);
    let callCount = 0;
    const failingProcessor: ImageProcessor = {
      async resizeToFormat() {
        callCount += 1;
        throw new Error("boom");
      },
    };

    await expect(
      generateImageVariants({
        sourceDir,
        outputDir,
        processor: failingProcessor,
      }),
    ).rejects.toThrow();

    expect(callCount).toBeLessThan(16);
  });
});
