import { describe, it, expect, afterEach } from "vitest";
import { mkdtempSync, rmSync, writeFileSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import {
  assertImageVariantsUpToDate,
  findStaleSourceImages,
  type ImageVariantPaths,
} from "../../theme/utils/imageVariantManifest";
import {
  generateImageVariants,
  type ImageProcessor,
} from "../../theme/utils/generateImageVariants";

const fakeProcessor: ImageProcessor = {
  async resizeToFormat(_sourcePath, outputPath) {
    writeFileSync(outputPath, "fake");
  },
};

describe("imageVariantManifest", () => {
  let paths: ImageVariantPaths;

  afterEach(() => {
    rmSync(paths.sourceDir, { recursive: true, force: true });
  });

  function setUpSourceDir(fileNames: string[]): void {
    const sourceDir = mkdtempSync(join(tmpdir(), "image-manifest-"));
    paths = {
      sourceDir,
      outputDir: join(sourceDir, "variants"),
      manifestPath: join(sourceDir, "manifest.json"),
    };
    for (const fileName of fileNames) {
      writeFileSync(join(sourceDir, fileName), `bytes-of-${fileName}`);
    }
  }

  it("reports every image as stale when no manifest exists", () => {
    setUpSourceDir(["a.jpg", "b.png"]);

    expect(findStaleSourceImages(paths).sort()).toEqual(["a.jpg", "b.png"]);
  });

  it("reports nothing stale right after generation", async () => {
    setUpSourceDir(["a.jpg", "b.png"]);
    await generateImageVariants({ ...paths, processor: fakeProcessor });

    expect(findStaleSourceImages(paths)).toEqual([]);
    expect(() => assertImageVariantsUpToDate(paths)).not.toThrow();
  });

  it("reports only a newly added image as stale", async () => {
    setUpSourceDir(["a.jpg"]);
    await generateImageVariants({ ...paths, processor: fakeProcessor });

    writeFileSync(join(paths.sourceDir, "new-post.jpg"), "new-bytes");

    expect(findStaleSourceImages(paths)).toEqual(["new-post.jpg"]);
  });

  it("fails the build check naming the stale image and the fix", async () => {
    setUpSourceDir(["a.jpg"]);
    await generateImageVariants({ ...paths, processor: fakeProcessor });

    writeFileSync(join(paths.sourceDir, "a.jpg"), "replaced-bytes");

    expect(() => assertImageVariantsUpToDate(paths)).toThrow(
      /a\.jpg.*npm run images/,
    );
  });
});
