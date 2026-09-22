// Single source of truth for the responsive post-image naming scheme, shared
// by ResponsiveImage.vue (which renders the srcset urls) and
// generateImageVariants.ts (which produces the files at those same urls).
// Keeping both sides pinned to this one config/helper means the srcset a
// page ships can never drift from the widths and filenames the generator
// actually produces.

// "thumb" backs small list/card contexts (HomeBlog's featured card,
// PostsView's list thumbnails); "hero" backs the larger single-post
// hero image in PostView. Post cover images are sourced at 1200px wide (see
// generateImageVariants.ts), so hero tops out there rather than upscaling.
export type ImageVariant = "thumb" | "hero";

export type ImageFormat = "avif" | "webp";

export const IMAGE_FORMATS: readonly ImageFormat[] = ["avif", "webp"];

export const IMAGE_VARIANT_WIDTHS: Record<ImageVariant, number[]> = {
  thumb: [400, 800],
  hero: [800, 1200],
};

export const IMAGE_VARIANTS_DIR = "/images/posts/variants";

// The only extensions generateImageVariants.ts reads from
// public/images/posts/ and produces variants for. isVariantEligible checks
// a src against this same set, so ResponsiveImage.vue never points a
// <picture> at variant urls that were never generated (see its docstring).
export const PROCESSABLE_SOURCE_EXTENSIONS = new Set([".jpg", ".jpeg", ".png"]);

const SOURCE_EXTENSION_PATTERN = /\.[^./]+$/;

// A post image is referenced by its root-absolute public/ path directly
// under /images/posts/ (e.g. "/images/posts/some-post.jpg"), never nested —
// that's where generateImageVariants.ts looks for source files.
const ELIGIBLE_SRC_PATTERN = /^\/images\/posts\/([^/]+)$/;

export function variantFileName(
  slug: string,
  variant: ImageVariant,
  width: number,
  format: ImageFormat,
): string {
  return `${slug}-${variant}-${width}.${format}`;
}

// True only for a src generateImageVariants.ts actually produces variants
// for. ResponsiveImage.vue uses this to decide whether to render <source>
// elements at all — a differently-hosted cover image, a nested path, or a
// format this pipeline doesn't process (e.g. .gif) renders as a plain <img>
// instead of a <picture> pointing at urls nobody generated. A <picture>
// whose <source> 404s does *not* fall back to the next <source>/<img> the
// way a broken <img src> would, so this check has to happen before we ever
// commit to the <picture> markup, not after.
export function isVariantEligible(src: string): boolean {
  const match = src.match(ELIGIBLE_SRC_PATTERN);
  if (!match) {
    return false;
  }
  const fileName = match[1];
  const extension = fileName.slice(fileName.lastIndexOf(".")).toLowerCase();
  return PROCESSABLE_SOURCE_EXTENSIONS.has(extension);
}

function slugFromFileName(fileName: string): string {
  return fileName.replace(SOURCE_EXTENSION_PATTERN, "");
}

// encodeURI so a source filename with a space or other character that's
// invalid inside an unquoted srcset candidate URL (comma, whitespace)
// doesn't get parsed as part of the following width descriptor / next
// candidate.
function buildSrcset(
  slug: string,
  variant: ImageVariant,
  format: ImageFormat,
): string {
  return IMAGE_VARIANT_WIDTHS[variant]
    .map((width) => {
      const url = encodeURI(
        `${IMAGE_VARIANTS_DIR}/${variantFileName(slug, variant, width, format)}`,
      );
      return `${url} ${width}w`;
    })
    .join(", ");
}

export interface ResponsiveImageSources {
  avifSrcset: string;
  webpSrcset: string;
  // The original, unprocessed image — used as the <img> src inside the
  // <picture> for isVariantEligible sources (every browser modern enough to
  // not support avif/webp still resolves this), and as the whole image for
  // ineligible ones.
  fallbackSrc: string;
}

// Only meaningful for an isVariantEligible src — callers gate on that first
// (see ResponsiveImage.vue).
export function resolveResponsiveImageSources(
  src: string,
  variant: ImageVariant,
): ResponsiveImageSources {
  const fileName = src.split("/").pop() ?? "";
  const slug = slugFromFileName(fileName);
  return {
    avifSrcset: buildSrcset(slug, variant, "avif"),
    webpSrcset: buildSrcset(slug, variant, "webp"),
    fallbackSrc: src,
  };
}
