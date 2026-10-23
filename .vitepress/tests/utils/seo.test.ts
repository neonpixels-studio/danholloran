import { describe, it, expect } from "vitest";
import {
  pageMeta,
  personJsonLd,
  profilePageJsonLd,
} from "../../theme/utils/seo";
import { SITE_URL } from "../../theme/utils/constants";

describe("pageMeta", () => {
  it("includes all base OG and Twitter tags", () => {
    const result = pageMeta({
      title: "Test Title",
      description: "Test description",
      url: "https://example.com/page",
    });

    expect(result).toContainEqual([
      "meta",
      { property: "og:title", content: "Test Title" },
    ]);
    expect(result).toContainEqual([
      "meta",
      { property: "og:description", content: "Test description" },
    ]);
    expect(result).toContainEqual([
      "meta",
      { property: "og:url", content: "https://example.com/page" },
    ]);
    expect(result).toContainEqual([
      "meta",
      { name: "twitter:title", content: "Test Title" },
    ]);
    expect(result).toContainEqual([
      "meta",
      { name: "twitter:description", content: "Test description" },
    ]);
    expect(result).toContainEqual([
      "meta",
      { property: "og:locale", content: "en_US" },
    ]);
  });

  it("defaults og:type to website", () => {
    const result = pageMeta({
      title: "T",
      description: "D",
      url: "https://example.com",
    });
    expect(result).toContainEqual([
      "meta",
      { property: "og:type", content: "website" },
    ]);
  });

  it("uses the provided type", () => {
    const result = pageMeta({
      title: "T",
      description: "D",
      url: "https://example.com",
      type: "article",
    });
    expect(result).toContainEqual([
      "meta",
      { property: "og:type", content: "article" },
    ]);
  });

  it("prefixes image with SITE_URL for og:image and twitter:image", () => {
    const result = pageMeta({
      title: "T",
      description: "D",
      url: "https://example.com",
      image: "/images/photo.png",
    });
    expect(result).toContainEqual([
      "meta",
      { property: "og:image", content: `${SITE_URL}/images/photo.png` },
    ]);
    expect(result).toContainEqual([
      "meta",
      { name: "twitter:image", content: `${SITE_URL}/images/photo.png` },
    ]);
  });

  it("omits image tags when no image is provided", () => {
    const result = pageMeta({
      title: "T",
      description: "D",
      url: "https://example.com",
    });
    const tags = result.map((r) => JSON.stringify(r));
    expect(tags.some((t) => t.includes("og:image"))).toBe(false);
    expect(tags.some((t) => t.includes("twitter:image"))).toBe(false);
  });

  it("includes JSON-LD script tag when jsonLd is provided", () => {
    const jsonLd = { "@type": "Person", name: "Dan" };
    const result = pageMeta({
      title: "T",
      description: "D",
      url: "https://example.com",
      jsonLd: jsonLd as Record<string, unknown>,
    });
    expect(result).toContainEqual([
      "script",
      { type: "application/ld+json" },
      JSON.stringify(jsonLd),
    ]);
  });

  it("omits JSON-LD script tag when jsonLd is not provided", () => {
    const result = pageMeta({
      title: "T",
      description: "D",
      url: "https://example.com",
    });
    const tags = result.map((r) => JSON.stringify(r));
    expect(tags.some((t) => t.includes("ld+json"))).toBe(false);
  });

  it("neutralizes </script> and < in the emitted JSON-LD", () => {
    const jsonLd = {
      "@type": "Article",
      headline: "Breakout </script><script>alert(1)</script>",
      keywords: ["a < b", "x & y"],
    };
    const result = pageMeta({
      title: "T",
      description: "D",
      url: "https://example.com",
      jsonLd: jsonLd as Record<string, unknown>,
    });
    const script = result.find((r) => r[0] === "script");
    const payload = script?.[2] as string;

    // No raw HTML-significant characters survive, so nothing can close the
    // <script> element or start a new tag.
    expect(payload.includes("<")).toBe(false);
    expect(payload.includes(">")).toBe(false);
    expect(payload.includes("&")).toBe(false);
    expect(payload).not.toContain("</script>");
    expect(payload).toContain("\\u003c");
    expect(payload).toContain("\\u0026");

    // The payload is still valid JSON and decodes back to the original values.
    const parsed = JSON.parse(payload);
    expect(parsed.headline).toBe(jsonLd.headline);
    expect(parsed.keywords).toEqual(jsonLd.keywords);
  });
});

describe("personJsonLd", () => {
  it("has correct schema type", () => {
    expect(personJsonLd["@context"]).toBe("https://schema.org");
    expect(personJsonLd["@type"]).toBe("Person");
  });

  it("has name, url, image, jobTitle, and description", () => {
    expect(typeof personJsonLd.name).toBe("string");
    expect(personJsonLd.name.length).toBeGreaterThan(0);
    expect(personJsonLd.url).toBe(SITE_URL);
    expect(personJsonLd.image).toContain(SITE_URL);
    expect(typeof personJsonLd.jobTitle).toBe("string");
    expect(typeof personJsonLd.description).toBe("string");
  });

  it("sameAs contains only external https URLs that are not the site URL", () => {
    for (const url of personJsonLd.sameAs) {
      expect(url.startsWith("https://")).toBe(true);
      expect(url).not.toBe(SITE_URL);
    }
  });
});

describe("profilePageJsonLd", () => {
  it("has correct schema type and points to /resume", () => {
    expect(profilePageJsonLd["@context"]).toBe("https://schema.org");
    expect(profilePageJsonLd["@type"]).toBe("ProfilePage");
    expect(profilePageJsonLd.url).toBe(`${SITE_URL}/resume`);
  });

  it("has a Person mainEntity", () => {
    expect(profilePageJsonLd.mainEntity["@type"]).toBe("Person");
    expect(typeof profilePageJsonLd.mainEntity.name).toBe("string");
    expect(profilePageJsonLd.mainEntity.name.length).toBeGreaterThan(0);
  });
});
