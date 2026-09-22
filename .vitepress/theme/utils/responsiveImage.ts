// Single source of truth for the responsive post-image naming scheme, shared
// by ResponsiveImage.vue (which renders the srcset urls) and
// generateImageVariants.ts (which produces the files at those same urls).
// Keeping both sides pinned to this one config/helper means the srcset a
// page ships can never drift from the widths and filenames the generator
// actually produces. This module is imported from both Node (the generator,
// via config.ts) and the browser (ResponsiveImage.vue's client bundle), so
// it only ever does pure string work — no `fs`/`path` node builtins.

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
// public/images/posts/ and produces variants for. isProcessableFileName (and
// therefore isVariantEligible) checks against this same set, so
// ResponsiveImage.vue never points a <picture> at variant urls that were
// never generated.
export const PROCESSABLE_SOURCE_EXTENSIONS = new Set([".jpg", ".jpeg", ".png"]);

// A post image is referenced by its root-absolute public/ path directly
// under /images/posts/ (e.g. "/images/posts/some-post.jpg"), never nested —
// that's where generateImageVariants.ts looks for source files.
const ELIGIBLE_SRC_PATTERN = /^\/images\/posts\/([^/]+)$/;

// Deliberately not Node's path.extname/basename (unavailable in the browser
// bundle — see the module docstring). A leading-dot name with nothing before
// it (".jpg") is treated as having no extension, matching path.extname's
// behavior for dotfiles, so both sides of the generator/component split stay
// aligned on what counts as "no extension" without either importing `path`.
function splitExtension(fileName: string): { base: string; extension: string } {
  const dotIndex = fileName.lastIndexOf(".");
  if (dotIndex <= 0) {
    return { base: fileName, extension: "" };
  }
  return {
    base: fileName.slice(0, dotIndex),
    extension: fileName.slice(dotIndex).toLowerCase(),
  };
}

// The one place that decides "is this filename one generateImageVariants.ts
// processes" — used by the generator (to pick source files) and by
// isVariantEligible (to decide whether a <picture> is safe to render), so
// the two can never independently drift on what "processable" means.
export function isProcessableFileName(fileName: string): boolean {
  return PROCESSABLE_SOURCE_EXTENSIONS.has(splitExtension(fileName).extension);
}

export function slugFromFileName(fileName: string): string {
  return splitExtension(fileName).base;
}

export function variantFileName(
  slug: string,
  variant: ImageVariant,
  width: number,
  format: ImageFormat,
): string {
  return `${slug}-${variant}-${width}.${format}`;
}

// generateImageVariants.ts derives each slug straight from the raw filename
// on disk — it never decodes anything, since a real filename is never
// percent-encoded to begin with. A frontmatter src that *is* already
// percent-encoded (e.g. "/images/posts/my%20post.jpg", a valid way to
// reference a file literally named "my post.jpg") would, if treated as
// eligible, get percent-encoded a second time by buildSrcset below,
// producing a url ("my%2520post-thumb-400.avif") that doesn't match any
// generated file. Rather than decode-then-re-encode (itself a footgun if the
// value isn't validly encoded), such a src is simply excluded here, the same
// way a nested path or unsupported extension already is — it renders as a
// plain <img> instead of a <picture> pointing at urls nobody produced.
const HAS_PERCENT_ENCODING = /%[0-9a-fA-F]{2}/;

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
  if (HAS_PERCENT_ENCODING.test(match[1])) {
    return false;
  }
  return isProcessableFileName(match[1]);
}

// The generator writes each variant's actual filename from the raw
// (unencoded) source slug — a literal space or comma in a real filename is a
// perfectly valid thing for a file to be named on disk. A srcset candidate
// url is not free-form text, though: an unencoded comma reads as the
// boundary between candidates and an unencoded space/`#` breaks the url, so
// the slug is percent-encoded only when building the url, never when
// building the on-disk filename (see generateImageVariants.ts, which never
// calls this).
function encodedVariantFileName(
  slug: string,
  variant: ImageVariant,
  width: number,
  format: ImageFormat,
): string {
  return variantFileName(encodeURIComponent(slug), variant, width, format);
}

function buildSrcset(
  slug: string,
  variant: ImageVariant,
  format: ImageFormat,
): string {
  return IMAGE_VARIANT_WIDTHS[variant]
    .map((width) => {
      const fileName = encodedVariantFileName(slug, variant, width, format);
      return `${IMAGE_VARIANTS_DIR}/${fileName} ${width}w`;
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
