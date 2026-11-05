// Modern-format (avif/webp) copies of the site's non-post images, such as
// the profile photo. Post images go
// through the responsive variant pipeline instead (responsiveImage.ts); these
// are a handful of fixed assets, so each gets one avif and one webp written
// next to the original, sharing its basename. The original stays the <img>
// fallback and the canonical url (e.g. resume.photo in JSON-LD).
//
// Imported by client components, so no Node built-ins here; the file
// listing and encoding live in .vitepress/scripts/generateStaticImageFormats.ts.

export type StaticImageFormat = "avif" | "webp";

export const STATIC_IMAGE_FORMATS: StaticImageFormat[] = ["avif", "webp"];

export interface StaticImageSource {
  // Root-absolute public path, e.g. "/images/profile.png".
  src: string;
  // Never upscaled past the original; just caps oversized sources.
  maxWidth: number;
}

// The profile photo renders at 100px CSS at most, so 320px covers 3x DPR.
const PROFILE_PHOTO_MAX_WIDTH = 320;

export const PROFILE_PHOTO_SOURCE: StaticImageSource = {
  src: "/images/profile.png",
  maxWidth: PROFILE_PHOTO_MAX_WIDTH,
};

const CONVERTIBLE_EXTENSION = /\.(png|jpe?g)$/i;

export function isStaticImageConvertible(src: string): boolean {
  return CONVERTIBLE_EXTENSION.test(src);
}

export function staticImageFormatSrc(
  src: string,
  format: StaticImageFormat,
): string {
  return src.replace(CONVERTIBLE_EXTENSION, `.${format}`);
}
