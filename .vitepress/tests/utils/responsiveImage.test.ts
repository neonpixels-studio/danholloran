import { describe, it, expect } from "vitest";
import {
  isProcessableFileName,
  variantVersion,
  isVariantEligible,
  resolveResponsiveImageSources,
  slugFromFileName,
} from "../../theme/utils/responsiveImage";

const FINGERPRINT = "0123456789abcdef".repeat(4);
const VERSION = "0123456789";
const FINGERPRINTS: Record<string, string> = Object.fromEntries(
  [
    "some-post.jpg",
    "some-post.JPG",
    "some-post.png",
    "some-post.gif",
    "my-post.png",
    "my post.jpg",
    "a,b.jpg",
    "a#b.jpg",
  ].map((fileName) => [fileName, FINGERPRINT]),
);

describe("resolveResponsiveImageSources", () => {
  it("appends a content version to every variant url so it can be cached immutably", () => {
    for (const variant of ["thumb", "hero"] as const) {
      const sources = resolveResponsiveImageSources(
        "/images/posts/some-post.jpg",
        variant,
        FINGERPRINTS,
      );
      const urls = [sources.avifSrcset, sources.webpSrcset]
        .flatMap((srcset) => srcset.split(", "))
        .map((candidate) => candidate.split(" ")[0]);

      expect(urls).toHaveLength(4);
      for (const url of urls) {
        expect(url).toMatch(new RegExp(`^/image-variants/.+\\?v=${VERSION}$`));
      }
    }
  });

  it("throws instead of emitting unversioned urls for an image with no fingerprint", () => {
    expect(() =>
      resolveResponsiveImageSources("/images/posts/unknown.jpg", "thumb", {}),
    ).toThrow(/No image variant fingerprint/);
  });

  it("changes the variant urls when the source image content changes", () => {
    const before = resolveResponsiveImageSources(
      "/images/posts/some-post.jpg",
      "thumb",
      FINGERPRINTS,
    );
    const after = resolveResponsiveImageSources(
      "/images/posts/some-post.jpg",
      "thumb",
      { "some-post.jpg": "f".repeat(64) },
    );

    expect(after.avifSrcset).not.toBe(before.avifSrcset);
    expect(after.avifSrcset).toContain("?v=ffffffffff");
  });

  it("builds a thumb srcset from the smaller variant widths", () => {
    const sources = resolveResponsiveImageSources(
      "/images/posts/some-post.jpg",
      "thumb",
      FINGERPRINTS,
    );

    expect(sources.avifSrcset).toBe(
      "/image-variants/some-post-thumb-400.avif?v=0123456789 400w, " +
        "/image-variants/some-post-thumb-800.avif?v=0123456789 800w",
    );
    expect(sources.webpSrcset).toBe(
      "/image-variants/some-post-thumb-400.webp?v=0123456789 400w, " +
        "/image-variants/some-post-thumb-800.webp?v=0123456789 800w",
    );
  });

  it("builds a hero srcset from the larger variant widths", () => {
    const sources = resolveResponsiveImageSources(
      "/images/posts/some-post.jpg",
      "hero",
      FINGERPRINTS,
    );

    expect(sources.avifSrcset).toBe(
      "/image-variants/some-post-hero-800.avif?v=0123456789 800w, " +
        "/image-variants/some-post-hero-1200.avif?v=0123456789 1200w",
    );
    expect(sources.webpSrcset).toBe(
      "/image-variants/some-post-hero-800.webp?v=0123456789 800w, " +
        "/image-variants/some-post-hero-1200.webp?v=0123456789 1200w",
    );
  });

  it("falls back to the original, untouched src", () => {
    const sources = resolveResponsiveImageSources(
      "/images/posts/some-post.jpg",
      "thumb",
      FINGERPRINTS,
    );

    expect(sources.fallbackSrc).toBe("/images/posts/some-post.jpg");
  });

  it("derives the slug from the basename, stripping the extension", () => {
    const sources = resolveResponsiveImageSources(
      "/images/posts/my-post.png",
      "thumb",
      FINGERPRINTS,
    );

    expect(sources.avifSrcset).toContain(
      "/image-variants/my-post-thumb-400.avif",
    );
  });

  it("percent-encodes a filename with a space so it can't be parsed as a second srcset candidate", () => {
    const sources = resolveResponsiveImageSources(
      "/images/posts/my post.jpg",
      "thumb",
      FINGERPRINTS,
    );

    expect(sources.avifSrcset).toBe(
      "/image-variants/my%20post-thumb-400.avif?v=0123456789 400w, " +
        "/image-variants/my%20post-thumb-800.avif?v=0123456789 800w",
    );
  });

  it("percent-encodes a comma so it can't be read as the srcset candidate separator", () => {
    const sources = resolveResponsiveImageSources(
      "/images/posts/a,b.jpg",
      "thumb",
      FINGERPRINTS,
    );

    expect(sources.avifSrcset).toBe(
      "/image-variants/a%2Cb-thumb-400.avif?v=0123456789 400w, " +
        "/image-variants/a%2Cb-thumb-800.avif?v=0123456789 800w",
    );
  });

  it("percent-encodes a # so it can't be read as a url fragment", () => {
    const sources = resolveResponsiveImageSources(
      "/images/posts/a#b.jpg",
      "thumb",
      FINGERPRINTS,
    );

    expect(sources.avifSrcset).toContain("a%23b-thumb-400.avif");
  });
});

describe("slugFromFileName / isProcessableFileName", () => {
  it("strips the extension to derive the slug", () => {
    expect(slugFromFileName("some-post.jpg")).toBe("some-post");
    expect(slugFromFileName("some-post.PNG")).toBe("some-post");
  });

  it("treats a dotfile with nothing before the dot as having no extension", () => {
    // Matches Node's path.extname(".jpg") === "" — generateImageVariants.ts
    // reuses this same helper (not path.extname, which the browser bundle
    // can't import) so the generator and isVariantEligible can't drift on
    // this edge case the way they once did.
    expect(isProcessableFileName(".jpg")).toBe(false);
    expect(slugFromFileName(".jpg")).toBe(".jpg");
  });

  it("is case-insensitive on the extension", () => {
    expect(isProcessableFileName("some-post.JPG")).toBe(true);
    expect(isProcessableFileName("some-post.Png")).toBe(true);
  });

  it("rejects a filename with no extension at all", () => {
    expect(isProcessableFileName("some-post")).toBe(false);
  });
});

describe("variantVersion", () => {
  it("is a short prefix of the fingerprint", () => {
    expect(variantVersion(FINGERPRINT)).toBe(VERSION);
  });
});

describe("isVariantEligible", () => {
  it("is not eligible without a manifest fingerprint, since its variant urls could not be versioned", () => {
    expect(isVariantEligible("/images/posts/unknown.jpg", FINGERPRINTS)).toBe(
      false,
    );
    expect(isVariantEligible("/images/posts/toString.jpg", {})).toBe(false);
  });

  it("accepts a jpg/png cover image directly under /images/posts/", () => {
    expect(isVariantEligible("/images/posts/some-post.jpg", FINGERPRINTS)).toBe(
      true,
    );
    expect(isVariantEligible("/images/posts/some-post.JPG", FINGERPRINTS)).toBe(
      true,
    );
    expect(isVariantEligible("/images/posts/some-post.png", FINGERPRINTS)).toBe(
      true,
    );
  });

  it("rejects a format generateImageVariants.ts doesn't process", () => {
    expect(isVariantEligible("/images/posts/some-post.gif", FINGERPRINTS)).toBe(
      false,
    );
    expect(isVariantEligible("/images/posts/some-post.svg", FINGERPRINTS)).toBe(
      false,
    );
  });

  it("rejects a nested path — the generator only reads the top-level directory", () => {
    expect(
      isVariantEligible("/images/posts/nested/some-post.jpg", FINGERPRINTS),
    ).toBe(false);
  });

  it("rejects a remote/external image url", () => {
    expect(
      isVariantEligible("https://cdn.example.com/some-post.jpg", FINGERPRINTS),
    ).toBe(false);
  });

  it("rejects a path outside /images/posts/", () => {
    expect(
      isVariantEligible("/images/avatars/some-post.jpg", FINGERPRINTS),
    ).toBe(false);
  });

  it("rejects an already percent-encoded src instead of risking a double-encoded, 404ing srcset", () => {
    // generateImageVariants.ts derives every slug from the raw filename on
    // disk — it never decodes anything. If a pre-encoded src like this were
    // treated as eligible, buildSrcset would percent-encode it a second
    // time and point at a url no generated file matches.
    expect(isVariantEligible("/images/posts/my%20post.jpg", FINGERPRINTS)).toBe(
      false,
    );
  });
});
