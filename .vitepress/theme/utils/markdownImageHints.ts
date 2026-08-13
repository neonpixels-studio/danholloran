import { readFileSync } from "fs";
import { fileURLToPath } from "node:url";
import { dirname, join, sep } from "path";
import { imageSize } from "image-size";
import type { MarkdownRenderer } from "vitepress";

// VitePress renders markdown <img> tags with no loading/decoding hints and no
// intrinsic width/height, so in-body images download eagerly and reserve no
// space — the browser reflows the article as each one decodes (CLS). This module
// hooks the markdown-it image rule to add loading="lazy", decoding="async", and
// the image's real pixel dimensions, so the box is reserved before the bytes
// arrive. Working at the token level (rather than regexing rendered html) means
// no quote/casing/duplicate-attribute edge cases, and it never overrides an
// attribute the author wrote in markdown.
//
// The intrinsic width/height only avoid distortion because Tailwind's preflight
// sets `img { max-width: 100%; height: auto }`, so the attributes act as an
// aspect-ratio hint rather than a fixed size. Raw <img> tags hand-written in
// markdown arrive as html tokens, not image tokens, so they are not hinted, and
// only root-absolute srcs (/images/...) are measurable — every post uses those.
//
// VitePress ships `markdown.image.lazyLoading` for the loading="lazy" half, but
// this rule already visits each image token to add decoding + dimensions, so it
// sets all three hints in one place rather than splitting the concern.

const LAZY_LOADING = "lazy";
const ASYNC_DECODING = "async";
// Post image srcs are root-absolute paths served from public/ (e.g.
// "/images/posts/foo.jpg"); anything else (remote URLs, bare relative paths) is
// not a local file we can measure.
const LOCAL_SRC_PREFIX = "/";
// Absolute path to the site's public/ dir, anchored to this module (…/
// .vitepress/theme/utils) so it resolves regardless of the process working
// directory. Built from fileURLToPath(import.meta.url) rather than
// `new URL("…", import.meta.url)`, which Vite rewrites for asset handling.
const PUBLIC_DIR = join(
  dirname(fileURLToPath(import.meta.url)),
  "..",
  "..",
  "..",
  "public",
);
// EXIF orientation values 5-8 encode a 90°/270° rotation, so the browser
// presents the photo with width and height swapped from the raw header. Values
// outside 1-8 are invalid, so the swap is bounded to avoid transposing on a
// corrupt tag.
const ROTATED_ORIENTATION_MIN = 5;
const ROTATED_ORIENTATION_MAX = 8;

export interface ImageDimensions {
  width: number;
  height: number;
}

// Injected so the pixel-reading side effect (filesystem + image-size) can be
// swapped for a fake in tests, keeping the hint logic testable in isolation.
export type ImageDimensionReader = (_src: string) => ImageDimensions | null;

// The slice of markdown-it's Token attribute API the hint logic needs. Declaring
// it here lets tests drive the logic with a lightweight fake token instead of a
// full markdown-it instance. (Type-signature parameter names are underscore-
// prefixed to satisfy the repo's no-unused-vars escape hatch.)
export interface ImageToken {
  attrIndex(_name: string): number;
  attrGet(_name: string): string | null;
  attrSet(_name: string, _value: string): void;
}

function setAttributeIfAbsent(
  token: ImageToken,
  name: string,
  value: string,
): void {
  if (token.attrIndex(name) >= 0) {
    return;
  }
  token.attrSet(name, value);
}

function setImageDimensions(
  token: ImageToken,
  readDimensions: ImageDimensionReader,
): void {
  if (token.attrIndex("width") >= 0 || token.attrIndex("height") >= 0) {
    return;
  }
  const src = token.attrGet("src");
  if (!src) {
    return;
  }
  const dimensions = readDimensions(src);
  if (!dimensions) {
    return;
  }
  token.attrSet("width", String(dimensions.width));
  token.attrSet("height", String(dimensions.height));
}

// Decorate a single image token with loading/decoding hints and, when
// measurable, intrinsic dimensions. Author-declared attributes always win.
export function setMarkdownImageHints(
  token: ImageToken,
  readDimensions: ImageDimensionReader,
): void {
  setAttributeIfAbsent(token, "loading", LAZY_LOADING);
  setAttributeIfAbsent(token, "decoding", ASYNC_DECODING);
  setImageDimensions(token, readDimensions);
}

// Protocol-relative urls ("//cdn.example.com/a.jpg") also start with "/" but
// are remote, not local files.
const PROTOCOL_RELATIVE_PREFIX = "//";

// Resolve a root-absolute image src to a file inside public/, rejecting remote
// urls and any path that escapes public/. Handles url-encoding and cache-busting
// query strings (e.g. "/images/foo.png?v=2"), and returns null (never throws)
// on a malformed percent-escape so one bad reference can't abort the build.
function resolvePublicPath(src: string): string | null {
  if (!src.startsWith(LOCAL_SRC_PREFIX)) {
    return null;
  }
  if (src.startsWith(PROTOCOL_RELATIVE_PREFIX)) {
    return null;
  }
  const [pathWithoutQuery] = src.split(/[?#]/);
  const relativePath = decodePath(pathWithoutQuery);
  if (relativePath === null) {
    return null;
  }
  // A bare "/" or trailing-slash path is a directory, not an image file.
  if (relativePath === "/" || relativePath.endsWith("/")) {
    return null;
  }
  const filePath = join(PUBLIC_DIR, relativePath);
  if (!filePath.startsWith(PUBLIC_DIR + sep)) {
    console.warn(`readLocalImageDimensions: "${src}" resolves outside public/`);
    return null;
  }
  return filePath;
}

function decodePath(path: string): string | null {
  try {
    return decodeURIComponent(path);
  } catch {
    return null;
  }
}

// image-size reports the raw stored dimensions plus the EXIF orientation
// without swapping; browsers apply orientation by default, so a 90°/270°
// rotation (orientation 5-8) means the painted box is width/height swapped.
export function orientedDimensions(
  width: number,
  height: number,
  orientation: number | undefined,
): ImageDimensions {
  const isRotated =
    typeof orientation === "number" &&
    orientation >= ROTATED_ORIENTATION_MIN &&
    orientation <= ROTATED_ORIENTATION_MAX;
  if (isRotated) {
    return { width: height, height: width };
  }
  return { width, height };
}

// Read the intrinsic pixel size of a public/ image, or null when the src is not
// a local file or cannot be measured. Warns loudly (rather than failing the
// build) so a broken image reference is visible without blocking rendering.
// Reads per call by design: this runs only at build time over a bounded set of
// posts, so a short-lived module cache would trade dev-server staleness (a
// replaced image keeps serving old dimensions) for a negligible saving.
export function readLocalImageDimensions(src: string): ImageDimensions | null {
  const filePath = resolvePublicPath(src);
  if (!filePath) {
    return null;
  }
  try {
    const buffer = readFileSync(filePath);
    const { width, height, orientation } = imageSize(buffer);
    if (!width || !height) {
      return null;
    }
    return orientedDimensions(width, height, orientation);
  } catch (error) {
    console.warn(
      `readLocalImageDimensions: could not measure "${src}": ` +
        `${(error as Error).message}`,
    );
    return null;
  }
}

// Wrap markdown-it's image renderer so every rendered image carries the hints,
// delegating to the existing rule (markdown-it always seeds a default `image`
// rule that fills alt text, so it is present).
export function applyMarkdownImageHints(
  md: MarkdownRenderer,
  readDimensions: ImageDimensionReader,
): void {
  const renderImage = md.renderer.rules.image!;
  md.renderer.rules.image = (tokens, index, options, env, self) => {
    setMarkdownImageHints(tokens[index], readDimensions);
    return renderImage(tokens, index, options, env, self);
  };
}
