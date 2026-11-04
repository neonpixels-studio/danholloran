import { SITE_URL } from "./constants";
import resume from "../../data/resume";
import socialLinks from "../../data/socialLinks";
import {
  readLocalImageDimensions,
  type ImageDimensionReader,
  type ImageDimensions,
} from "./markdownImageHints";

// The public brand ("Dan Holloran") shown in the h1, <title>, and og:site_name.
// The structured-data entity name must match it, with the full legal name
// ("Danny Holloran") carried as alternateName so both resolve to one entity.
export const AUTHOR_NAME = `${resume.shortFirstName} ${resume.lastName}`;
const AUTHOR_ALTERNATE_NAME = `${resume.firstName} ${resume.lastName}`;

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

// The site's X account as an @handle, derived from the linked profile URL so
// it stays in sync with socialLinks. Null when the URL has no handle segment.
export function twitterHandle(profileUrl: string | undefined): string | null {
  if (!profileUrl || !URL.canParse(profileUrl)) {
    return null;
  }
  const handle = new URL(profileUrl).pathname.split("/").filter(Boolean)[0];
  return handle ? `@${handle}` : null;
}

const TWITTER_HANDLE = twitterHandle(socialLinks.X);

function imageDimensionMeta(dimensions: ImageDimensions | null): any[] {
  if (!dimensions) {
    return [];
  }
  return [
    ["meta", { property: "og:image:width", content: String(dimensions.width) }],
    [
      "meta",
      { property: "og:image:height", content: String(dimensions.height) },
    ],
  ];
}

function imageMeta(
  imageUrl: string,
  alt: string,
  dimensions: ImageDimensions | null,
): any[] {
  return [
    ["meta", { property: "og:image", content: imageUrl }],
    ["meta", { property: "og:image:alt", content: alt }],
    ...imageDimensionMeta(dimensions),
    ["meta", { name: "twitter:image", content: imageUrl }],
    ["meta", { name: "twitter:image:alt", content: alt }],
  ];
}

export function pageMeta(opts: {
  title: string;
  description: string;
  url: string;
  image?: string;
  // Defaults to the page title when omitted.
  imageAlt?: string;
  // Injected so tests can avoid reading real files.
  readImageDimensions?: ImageDimensionReader;
  type?: "website" | "article";
  jsonLd?: Record<string, unknown>;
}): any[] {
  const {
    title,
    description,
    url,
    image,
    imageAlt,
    readImageDimensions = readLocalImageDimensions,
    type = "website",
    jsonLd,
  } = opts;
  const meta: any[] = [
    ["meta", { property: "og:type", content: type }],
    ["meta", { property: "og:title", content: title }],
    ["meta", { property: "og:description", content: description }],
    ["meta", { property: "og:url", content: url }],
    ["meta", { property: "og:locale", content: "en_US" }],
    ["meta", { name: "twitter:title", content: title }],
    ["meta", { name: "twitter:description", content: description }],
  ];
  if (TWITTER_HANDLE) {
    meta.push(
      ["meta", { name: "twitter:site", content: TWITTER_HANDLE }],
      ["meta", { name: "twitter:creator", content: TWITTER_HANDLE }],
    );
  }
  if (image) {
    meta.push(
      ...imageMeta(
        `${SITE_URL}${image}`,
        imageAlt?.trim() || title,
        readImageDimensions(image),
      ),
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
  name: AUTHOR_NAME,
  alternateName: AUTHOR_ALTERNATE_NAME,
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
  name: AUTHOR_NAME,
  logo: {
    "@type": "ImageObject",
    url: `${SITE_URL}/images/apple-touch-icon.png`,
  },
};

export const profilePageJsonLd = {
  "@context": "https://schema.org",
  "@type": "ProfilePage",
  name: `${AUTHOR_NAME} – Resume`,
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
      name: AUTHOR_NAME,
      url: SITE_URL,
    },
  };
}
