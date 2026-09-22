import { describe, it, expect } from "vitest";
import {
  isProcessableFileName,
  isVariantEligible,
  resolveResponsiveImageSources,
  slugFromFileName,
} from "../../theme/utils/responsiveImage";

describe("resolveResponsiveImageSources", () => {
  it("builds a thumb srcset from the smaller variant widths", () => {
    const sources = resolveResponsiveImageSources(
      "/images/posts/some-post.jpg",
      "thumb",
    );

    expect(sources.avifSrcset).toBe(
      "/images/posts/variants/some-post-thumb-400.avif 400w, " +
        "/images/posts/variants/some-post-thumb-800.avif 800w",
    );
    expect(sources.webpSrcset).toBe(
      "/images/posts/variants/some-post-thumb-400.webp 400w, " +
        "/images/posts/variants/some-post-thumb-800.webp 800w",
    );
  });

  it("builds a hero srcset from the larger variant widths", () => {
    const sources = resolveResponsiveImageSources(
      "/images/posts/some-post.jpg",
      "hero",
    );

    expect(sources.avifSrcset).toBe(
      "/images/posts/variants/some-post-hero-800.avif 800w, " +
        "/images/posts/variants/some-post-hero-1200.avif 1200w",
    );
    expect(sources.webpSrcset).toBe(
      "/images/posts/variants/some-post-hero-800.webp 800w, " +
        "/images/posts/variants/some-post-hero-1200.webp 1200w",
    );
  });

  it("falls back to the original, untouched src", () => {
    const sources = resolveResponsiveImageSources(
      "/images/posts/some-post.jpg",
      "thumb",
    );

    expect(sources.fallbackSrc).toBe("/images/posts/some-post.jpg");
  });

  it("derives the slug from the basename, stripping the extension", () => {
    const sources = resolveResponsiveImageSources(
      "/images/posts/my-post.png",
      "thumb",
    );

    expect(sources.avifSrcset).toContain("/variants/my-post-thumb-400.avif");
  });

  it("percent-encodes a filename with a space so it can't be parsed as a second srcset candidate", () => {
    const sources = resolveResponsiveImageSources(
      "/images/posts/my post.jpg",
      "thumb",
    );

    expect(sources.avifSrcset).toBe(
      "/images/posts/variants/my%20post-thumb-400.avif 400w, " +
        "/images/posts/variants/my%20post-thumb-800.avif 800w",
    );
  });

  it("percent-encodes a comma so it can't be read as the srcset candidate separator", () => {
    const sources = resolveResponsiveImageSources(
      "/images/posts/a,b.jpg",
      "thumb",
    );

    expect(sources.avifSrcset).toBe(
      "/images/posts/variants/a%2Cb-thumb-400.avif 400w, " +
        "/images/posts/variants/a%2Cb-thumb-800.avif 800w",
    );
  });

  it("percent-encodes a # so it can't be read as a url fragment", () => {
    const sources = resolveResponsiveImageSources(
      "/images/posts/a#b.jpg",
      "thumb",
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

describe("isVariantEligible", () => {
  it("accepts a jpg/png cover image directly under /images/posts/", () => {
    expect(isVariantEligible("/images/posts/some-post.jpg")).toBe(true);
    expect(isVariantEligible("/images/posts/some-post.JPG")).toBe(true);
    expect(isVariantEligible("/images/posts/some-post.png")).toBe(true);
  });

  it("rejects a format generateImageVariants.ts doesn't process", () => {
    expect(isVariantEligible("/images/posts/some-post.gif")).toBe(false);
    expect(isVariantEligible("/images/posts/some-post.svg")).toBe(false);
  });

  it("rejects a nested path — the generator only reads the top-level directory", () => {
    expect(isVariantEligible("/images/posts/nested/some-post.jpg")).toBe(false);
  });

  it("rejects a remote/external image url", () => {
    expect(isVariantEligible("https://cdn.example.com/some-post.jpg")).toBe(
      false,
    );
  });

  it("rejects a path outside /images/posts/", () => {
    expect(isVariantEligible("/images/avatars/some-post.jpg")).toBe(false);
  });

  it("rejects an already percent-encoded src instead of risking a double-encoded, 404ing srcset", () => {
    // generateImageVariants.ts derives every slug from the raw filename on
    // disk — it never decodes anything. If a pre-encoded src like this were
    // treated as eligible, buildSrcset would percent-encode it a second
    // time and point at a url no generated file matches.
    expect(isVariantEligible("/images/posts/my%20post.jpg")).toBe(false);
  });
});
