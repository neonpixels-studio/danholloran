// Entry point for `npm run images:static`, run with Node's built-in type
// stripping (no bundler), which is why the imports below use explicit .ts
// extensions. Re-run after replacing a source image;
// staticImageFormats.test.ts fails if a copy is missing.
import { join } from "path";
import sharp from "sharp";
import { ENCODER_QUALITY } from "../theme/utils/imageVariantManifest.ts";
import {
  PROFILE_PHOTO_SOURCE,
  STATIC_IMAGE_FORMATS,
  staticImageFormatSrc,
  type StaticImageSource,
} from "../theme/utils/staticImageFormats.ts";

const PUBLIC_DIR = join(import.meta.dirname, "..", "..", "public");

function publicPath(src: string): string {
  return join(PUBLIC_DIR, src);
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

const sources = [PROFILE_PHOTO_SOURCE];
const written = (await Promise.all(sources.map(encodeSource))).flat();

console.log(`Static image formats: wrote ${written.length} file(s).`);
