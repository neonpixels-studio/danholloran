import { SITE_URL } from "./constants";

// Root-relative recovery links, kept as data so the markup builder stays a
// single loop. Ordered most- to least-useful for someone (or an agent) that
// landed on a dead URL.
const RECOVERY_LINKS: { href: string; label: string }[] = [
  { href: "/", label: "Home" },
  { href: "/posts", label: "Blog — all posts" },
  { href: "/resume", label: "Resume" },
  { href: "/feed.xml", label: "RSS feed" },
  { href: "/sitemap.xml", label: "Sitemap — every page on the site" },
  {
    href: "/llms.txt",
    label: "llms.txt — structured site overview for AI agents",
  },
];

const HEADING = "Page not found (HTTP 404)";
const INTRO = `That page moved, got renamed, or never existed. Pick a link below to get back on track, or start from ${SITE_URL}.`;

// The styled 404 view is client-rendered, so a no-JS visitor — or an agent that
// reads raw HTML without executing scripts — otherwise sees an empty 404 body.
// This <noscript> block gives them crawlable recovery links in the static
// response. It's wrapped in <noscript> so it never double-renders for the JS
// visitors who get the full NotFoundView.
export function buildNotFoundRecoveryHtml(): string {
  const items = RECOVERY_LINKS.map(
    (link) => `<li><a href="${link.href}">${link.label}</a></li>`,
  ).join("");
  return `<noscript><section><h1>${HEADING}</h1><p>${INTRO}</p><ul>${items}</ul></section></noscript>`;
}

// Splices the recovery block in just before </body> so it lands inside the
// document body of the built 404.html. Returns the HTML unchanged if no closing
// body tag is present, so a VitePress template change can't silently drop the
// block — the caller can assert the output changed.
export function injectNotFoundRecovery(html: string): string {
  const closingBody = "</body>";
  if (!html.includes(closingBody)) {
    return html;
  }
  return html.replace(
    closingBody,
    `${buildNotFoundRecoveryHtml()}${closingBody}`,
  );
}
