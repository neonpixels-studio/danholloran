import {
  writeHeadersFile,
  type UnhashableFile,
} from "@neon-pixels/security/netlify";
import { resolveSentryEnvironment } from "@neon-pixels/sentry";
import { SENTRY_DSN } from "./errorReporting";

// Derived from the DSN (a public value) so a rotated key or moved project
// cannot leave reports going to a dead endpoint.
const SENTRY_DSN_URL = new URL(SENTRY_DSN);
export const CSP_REPORT_ENDPOINT = `${SENTRY_DSN_URL.origin}/api/${SENTRY_DSN_URL.pathname.slice(1)}/security/?sentry_key=${SENTRY_DSN_URL.username}`;

// The same sources public/_headers allows today, minus 'unsafe-inline'. The
// writer's built-in policy already covers default-src, object-src, base-uri,
// form-action, and frame-ancestors.
const GOOGLE_ANALYTICS_ORIGIN = "https://www.google-analytics.com";
const GOOGLE_TAG_MANAGER_ORIGIN = "https://www.googletagmanager.com";
const NEWSLETTER_ORIGIN = "https://app.kit.com";
const SENTRY_ORIGIN = SENTRY_DSN_URL.origin;

export const REPORT_ONLY_DIRECTIVES = {
  "script-src": [GOOGLE_TAG_MANAGER_ORIGIN, GOOGLE_ANALYTICS_ORIGIN],
  "img-src": ["'self'", "data:", "https:"],
  "connect-src": [
    "'self'",
    NEWSLETTER_ORIGIN,
    GOOGLE_ANALYTICS_ORIGIN,
    GOOGLE_TAG_MANAGER_ORIGIN,
    SENTRY_ORIGIN,
  ],
};

export function cspReportEndpoint(netlifyContext: string | undefined): string {
  const environment = resolveSentryEnvironment({ netlifyContext });
  return `${CSP_REPORT_ENDPOINT}&sentry_environment=${environment}`;
}

// Where an inline style attribute comes from, for the attributes whose source
// is known. Anything not listed is printed without a hint.
const ATTRIBUTE_SOURCES: Record<string, string> = {
  "<div style>": "site shell (mobile menu, search dialog, results list)",
  "<input style>": "site shell (search field)",
  "<span style>": "Shiki code highlighting (--shiki-* colors)",
  "<pre style>": "Shiki code highlighting (--shiki-*-bg)",
  "<h1 style>": "page title font size",
  "<h2 style>": "section heading font size",
  "<a style>":
    "post card stagger delay on listings, rainbow buttons on the theme views",
};

function attributesInEveryFile(unhashable: UnhashableFile[]): string[] {
  const [first, ...rest] = unhashable;
  return first.attributes.filter((attribute) =>
    rest.every((entry) => entry.attributes.includes(attribute)),
  );
}

function describeAttributes(attributes: string[]): string {
  return attributes
    .map((attribute) => {
      const source = ATTRIBUTE_SOURCES[attribute];
      return source ? `${attribute} [${source}]` : attribute;
    })
    .join(", ");
}

function groupByExtraAttributes(
  unhashable: UnhashableFile[],
  shared: string[],
): Map<string, string[]> {
  // Keyed by JSON so an attribute label containing any character stays intact.
  const groups = new Map<string, string[]>();
  for (const { file, attributes } of unhashable) {
    const extras = attributes.filter(
      (attribute) => !shared.includes(attribute),
    );
    const key = JSON.stringify(extras);
    groups.set(key, [...(groups.get(key) ?? []), file]);
  }
  return groups;
}

function formatGroup(key: string, files: string[]): string[] {
  const extras: string[] = JSON.parse(key);
  const label = extras.length
    ? describeAttributes(extras)
    : "no further markup";
  return [
    `  ${files.length} file(s): ${label}`,
    ...files.map((file) => `    ${file}`),
  ];
}

export function formatUnhashable(unhashable: UnhashableFile[]): string {
  if (unhashable.length === 0) {
    return "Report-only CSP: no unhashable inline markup.";
  }
  const shared = attributesInEveryFile(unhashable);
  const groups = groupByExtraAttributes(unhashable, shared);
  return [
    `Report-only CSP: ${unhashable.length} file(s) have inline markup no hash can cover (not enforced yet).`,
    `  In every listed file: ${describeAttributes(shared) || "nothing"}`,
    ...[...groups].flatMap(([key, files]) => formatGroup(key, files)),
  ].join("\n");
}

// Appends to the _headers file Vite copied from public/, so the enforced
// policy and every other rule stay as they are.
export async function writeReportOnlyPolicy(
  outDir: string,
  netlifyContext: string | undefined,
) {
  const result = await writeHeadersFile(outDir, {
    directives: REPORT_ONLY_DIRECTIVES,
    reportEndpoint: cspReportEndpoint(netlifyContext),
    reportOnly: true,
    append: true,
  });
  console.log(formatUnhashable(result.unhashable));
  return result;
}
