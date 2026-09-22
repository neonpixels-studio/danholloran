import { describe, it, expect } from "vitest";
import { resolveResponsiveImageSources } from "../../theme/utils/responsiveImage";

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
});
