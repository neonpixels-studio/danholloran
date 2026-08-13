import { SITE_URL } from "./constants";
import resume from "../../data/resume";
import socialLinks from "../../data/socialLinks";

// Characters that must be neutralized when embedding JSON inside an HTML
// <script> element. Unicode escapes keep the payload valid JSON (a parser
// decodes them back) while preventing a value like "</script>" from breaking
// out of the element. HTML entities can't be used here: script content is raw
// text, so entities are never decoded and would corrupt the JSON-LD.
const SCRIPT_JSON_ESCAPES: Record<string, string> = {
  "<": "\\u003c",
  ">": "\\u003e",
  "&": "\\u0026",
};

function escapeJsonForScript(json: string): string {
  return json.replace(/[<>&]/g, (char) => SCRIPT_JSON_ESCAPES[char]);
}

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
      escapeJsonForScript(JSON.stringify(jsonLd)),
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
  // External profiles from contacts + every linked social account (X, Bluesky,
  // etc.), deduped — keeps sameAs in sync with what the site actually links to.
  sameAs: [
    ...new Set([
      ...resume.contacts
        .filter((c) => c.link?.startsWith("https://") && c.link !== SITE_URL)
        .map((c) => c.link as string),
      ...Object.values(socialLinks),
    ]),
  ],
};

// Publisher Organization for Article rich results (Google requires publisher
// with a logo for Article structured data).
export const publisherJsonLd = {
  "@type": "Organization",
  name: `${resume.firstName} ${resume.lastName}`,
  logo: {
    "@type": "ImageObject",
    url: `${SITE_URL}/images/apple-touch-icon.png`,
  },
};

export const profilePageJsonLd = {
  "@context": "https://schema.org",
  "@type": "ProfilePage",
  name: `${resume.firstName} ${resume.lastName} – Resume`,
  url: `${SITE_URL}/resume`,
  mainEntity: { ...personJsonLd, "@context": undefined },
};

// SoftwareApplication schema for the Grimicorn color themes. The themes are free
// editor/terminal ports, so Google's Software rich results expect a free offer
// and a developer-tools category.
export function themeJsonLd(opts: {
  name: string;
  description: string;
  url: string;
  image: string;
  operatingSystem: string;
  downloadUrl: string;
}): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: opts.name,
    description: opts.description,
    url: opts.url,
    image: `${SITE_URL}${opts.image}`,
    downloadUrl: `${SITE_URL}${opts.downloadUrl}`,
    applicationCategory: "DeveloperApplication",
    applicationSubCategory: "Color Theme",
    operatingSystem: opts.operatingSystem,
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
    author: {
      "@type": "Person",
      name: `${resume.firstName} ${resume.lastName}`,
      url: SITE_URL,
    },
  };
}
