// Single source of truth for the responsive post-image naming scheme, shared
// by ResponsiveImage.vue (which renders the srcset urls) and
// generateImageVariants.ts (which produces the files at those same urls).
// Keeping both sides pinned to this one config means the srcset a page ships
// can never drift from the widths the generator actually produces.

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

const SOURCE_EXTENSION_PATTERN = /\.[^./]+$/;

// Post images are always referenced by their root-absolute public/ path
// (e.g. "/images/posts/some-post.jpg"); the variant filename reuses the
// original basename, minus extension, as its slug.
function slugFromSrc(src: string): string {
  const fileName = src.split("/").pop() ?? "";
  return fileName.replace(SOURCE_EXTENSION_PATTERN, "");
}

function variantFileName(
  slug: string,
  variant: ImageVariant,
  width: number,
  format: ImageFormat,
): string {
  return `${slug}-${variant}-${width}.${format}`;
}

function buildSrcset(
  slug: string,
  variant: ImageVariant,
  format: ImageFormat,
): string {
  return IMAGE_VARIANT_WIDTHS[variant]
    .map(
      (width) =>
        `${IMAGE_VARIANTS_DIR}/${variantFileName(slug, variant, width, format)} ${width}w`,
    )
    .join(", ");
}

export interface ResponsiveImageSources {
  avifSrcset: string;
  webpSrcset: string;
  // The original, unprocessed image. Always a real, already-deployed file,
  // so it is safe as the <img> fallback even if variant generation never ran
  // (e.g. a fresh checkout before the first `vitepress dev`/`build`) — the
  // page degrades to today's plain full-resolution image instead of a
  // broken one.
  fallbackSrc: string;
}

export function resolveResponsiveImageSources(
  src: string,
  variant: ImageVariant,
): ResponsiveImageSources {
  const slug = slugFromSrc(src);
  return {
    avifSrcset: buildSrcset(slug, variant, "avif"),
    webpSrcset: buildSrcset(slug, variant, "webp"),
    fallbackSrc: src,
  };
}
