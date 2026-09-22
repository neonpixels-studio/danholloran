import { describe, it, expect, vi } from "vitest";
import { existsSync, mkdtempSync, rmSync, writeFileSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";

// sharpImageProcessor is generateImageVariants.ts's one real (non-fake)
// ImageProcessor implementation — the rest of generateImageVariants.test.ts
// deliberately never exercises it, substituting a fake instead so the
// orchestration logic is testable without real image encoding. This file
// isolates *just* sharpImageProcessor's own temp-file-cleanup-on-failure
// behavior, with a mocked `sharp` standing in for the real encoder so the
// failure path is exercised without needing an actual corrupt/unreadable
// image on disk.
const toFile = vi.fn();
const sharpChain = {
  resize: vi.fn(() => sharpChain),
  avif: vi.fn(() => sharpChain),
  webp: vi.fn(() => sharpChain),
  toFile,
};
const sharpFactory = vi.fn(() => sharpChain);

vi.mock("sharp", () => ({
  default: () => sharpFactory(),
}));

// vitest hoists vi.mock calls above imports, so this import resolves against
// the mocked "sharp" module above rather than the real dependency.
import { sharpImageProcessor } from "../../theme/utils/generateImageVariants";

describe("sharpImageProcessor", () => {
  it("removes its .tmp file when the encode fails, so a partial encode never ships", async () => {
    const outputDir = mkdtempSync(join(tmpdir(), "sharp-processor-"));
    const sourcePath = join(outputDir, "source.jpg");
    const outputPath = join(outputDir, "source-thumb-400.avif");
    writeFileSync(sourcePath, "fake-source-bytes");
    toFile.mockRejectedValueOnce(new Error("encode failed"));

    await expect(
      sharpImageProcessor.resizeToFormat(sourcePath, outputPath, 400, "avif"),
    ).rejects.toThrow("encode failed");

    expect(existsSync(`${outputPath}.tmp`)).toBe(false);
    expect(existsSync(outputPath)).toBe(false);

    rmSync(outputDir, { recursive: true, force: true });
  });

  it("renames the temp file into place on a successful encode", async () => {
    const outputDir = mkdtempSync(join(tmpdir(), "sharp-processor-"));
    const sourcePath = join(outputDir, "source.jpg");
    const outputPath = join(outputDir, "source-thumb-400.avif");
    writeFileSync(sourcePath, "fake-source-bytes");
    toFile.mockImplementationOnce(async (temporaryPath: string) => {
      writeFileSync(temporaryPath, "fake-encoded-bytes");
    });

    await sharpImageProcessor.resizeToFormat(
      sourcePath,
      outputPath,
      400,
      "avif",
    );

    expect(existsSync(outputPath)).toBe(true);
    expect(existsSync(`${outputPath}.tmp`)).toBe(false);

    rmSync(outputDir, { recursive: true, force: true });
  });
});
