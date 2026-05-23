import { SITE_URL } from "./constants";
import resume from "../../data/resume";

export function pageMeta(opts: {
  title: string;
  description: string;
  url: string;
  image?: string;
  type?: "website" | "article";
  jsonLd?: Record<string, unknown>;
}): any[] {
  const { title, description, url, image, type = "website", jsonLd } = opts;
  const imageUrl = image ? `${SITE_URL}${image}` : undefined;
  const meta: any[] = [
    ["meta", { property: "og:type", content: type }],
    ["meta", { property: "og:title", content: title }],
    ["meta", { property: "og:description", content: description }],
    ["meta", { property: "og:url", content: url }],
    ["meta", { property: "og:locale", content: "en_US" }],
    ["meta", { name: "twitter:title", content: title }],
    ["meta", { name: "twitter:description", content: description }],
  ];
  if (imageUrl) {
    meta.push(
      ["meta", { property: "og:image", content: imageUrl }],
      ["meta", { name: "twitter:image", content: imageUrl }],
    );
  }
  if (jsonLd) {
    meta.push([
      "script",
      { type: "application/ld+json" },
      JSON.stringify(jsonLd),
    ]);
  }
  return meta;
}

export const personJsonLd = {
  "@context": "https://schema.org",
  "@type": "Person",
  name: `${resume.firstName} ${resume.lastName}`,
  url: SITE_URL,
  image: `${SITE_URL}${resume.photo}`,
  jobTitle: resume.headline,
  description: resume.intro,
  sameAs: resume.contacts
    .filter((c) => c.link?.startsWith("https://") && c.link !== SITE_URL)
    .map((c) => c.link as string),
};
