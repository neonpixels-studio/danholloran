// Entry point for `npm run images:static`, run with Node's built-in type
// stripping (no bundler), which is why the imports below use explicit .ts
// extensions. Re-run after replacing the profile photo or adding a project
// screenshot; staticImageFormats.test.ts fails if a copy is missing.
import { readdirSync } from "fs";
import { join } from "path";
import sharp from "sharp";
import { ENCODER_QUALITY } from "../theme/utils/imageVariantManifest.ts";
import {
  PROFILE_PHOTO_SOURCE,
  PROJECT_IMAGES_DIRECTORY,
  PROJECT_IMAGE_MAX_WIDTH,
  STATIC_IMAGE_FORMATS,
  isStaticImageConvertible,
  staticImageFormatSrc,
  type StaticImageSource,
} from "../theme/utils/staticImageFormats.ts";

const PUBLIC_DIR = join(import.meta.dirname, "..", "..", "public");

function publicPath(src: string): string {
  return join(PUBLIC_DIR, src);
}

function listProjectImageSources(): StaticImageSource[] {
  return readdirSync(publicPath(PROJECT_IMAGES_DIRECTORY))
    .filter(isStaticImageConvertible)
    .map((fileName) => ({
      src: `${PROJECT_IMAGES_DIRECTORY}/${fileName}`,
      maxWidth: PROJECT_IMAGE_MAX_WIDTH,
    }));
}

async function encodeSource(source: StaticImageSource): Promise<string[]> {
  const resized = sharp(publicPath(source.src)).resize({
    width: source.maxWidth,
    withoutEnlargement: true,
  });

  return Promise.all(
    STATIC_IMAGE_FORMATS.map(async (format) => {
      const outputSrc = staticImageFormatSrc(source.src, format);
      const encoded =
        format === "avif"
          ? resized.clone().avif({ quality: ENCODER_QUALITY.avif })
          : resized.clone().webp({ quality: ENCODER_QUALITY.webp });
      await encoded.toFile(publicPath(outputSrc));
      return outputSrc;
    }),
  );
}

const sources = [PROFILE_PHOTO_SOURCE, ...listProjectImageSources()];
const written = (await Promise.all(sources.map(encodeSource))).flat();

console.log(`Static image formats: wrote ${written.length} file(s).`);
