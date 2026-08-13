import { Feed } from "feed";
import type { MarkdownRenderer } from "vitepress";
import { loadDatedPosts } from "./loadPublishedPosts";
import { SITE_URL, SITE_DESCRIPTION } from "./constants";

// `]]>` closes a CDATA section. The `feed` library wraps every item title,
// description, and body in CDATA and its XML serializer escapes only the first
// occurrence per field, so any of them containing the sequence twice would
// prematurely close the section and corrupt the whole feed document.
// Neutralize every terminator by entity-encoding its closing bracket. The
// `<description>` and `content:encoded` body are rendered as HTML by feed
// readers, so a spec-compliant reader decodes `]]&gt;` back to the original
// literal text; the RSS `<title>` is plain text, so the entity shows literally
// there — an accepted trade for not breaking the document.
const CDATA_TERMINATOR = "]]>";
const CDATA_TERMINATOR_SAFE = "]]&gt;";

// The `feed` library emits a <title>/<description> element only for a truthy
// value, so returning an empty string is how a field is deliberately omitted.
const OMIT_ELEMENT = "";

// Post bodies use root-relative URLs (e.g. `/images/...`, `/posts/...`) that a
// feed reader resolves against its own origin, 404-ing every image and dead-
// linking every internal reference. Rewrite them to absolute site URLs — the
// same rule the item `image` field already applies. The negative lookahead
// leaves protocol-relative `//host` URLs untouched.
const ROOT_RELATIVE_URL = /(\s(?:src|href)=")\/(?!\/)/g;

function absolutizeUrls(html: string): string {
  return html.replace(ROOT_RELATIVE_URL, `$1${SITE_URL}/`);
}

// `unknown` because frontmatter values arrive from YAML: a `title: 2026` parses
// to a number, which is coerced to text here rather than crashing `split`.
function neutralizeCdata(text: unknown): string {
  return String(text ?? "")
    .split(CDATA_TERMINATOR)
    .join(CDATA_TERMINATOR_SAFE);
}

// Fail loud with the offending slug: a body-less feed item is worse than a
// build that stops and names the post that could not be rendered.
function renderBody(
  renderer: MarkdownRenderer,
  post: Record<string, any>,
): string {
  try {
    const html = absolutizeUrls(renderer.render(post.body ?? ""));
    return neutralizeCdata(html);
  } catch (error) {
    throw new Error(`generateFeed: failed to render "${post.slug}"`, {
      cause: error,
    });
  }
}

// RSS 2.0 requires every <item> to carry at least a <title> or a
// <description>; a post missing both would emit an invalid item. Fall back to
// the slug as the title in that case so the post still ships rather than being
// silently dropped. When a description is present the title element stays
// omitted (a described, titleless item is already valid RSS). `description` is
// pre-trimmed by the caller, so a whitespace-only one already reads as absent
// here — the same trim that decides whether a description element ships. An
// empty slug (no title, description, or slug at all) has nothing to show, so
// fail loud with the post's date like `renderBody` does with the slug, rather
// than shipping an invalid item.
function resolveItemTitle(
  post: Record<string, any>,
  description: string,
): string {
  const title = neutralizeCdata(post.title).trim();
  if (title) {
    return title;
  }
  if (description) {
    return OMIT_ELEMENT;
  }
  const slug = neutralizeCdata(post.slug).trim();
  if (!slug) {
    throw new Error(
      `generateFeed: post dated "${post.date}" has no title, description, or slug`,
    );
  }
  return slug;
}

// The markdown renderer is injected (an external dependency, kept out of this
// module so it stays testable in isolation). The build passes one created from
// the resolved site config (see config.ts `buildEnd`), so feed bodies run
// through the site's own markdown-it — themes, code transformers, and plugins
// included. VitePress's page-level preprocessing (e.g. `<!--@include-->`) is
// not replicated; no post relies on it.
export function generateFeed(renderer: MarkdownRenderer): string {
  const feed = new Feed({
    title: "Dan Holloran",
    description: SITE_DESCRIPTION,
    id: SITE_URL,
    link: SITE_URL,
    language: "en",
    favicon: `${SITE_URL}/favicon.ico`,
    copyright: `© ${new Date().getFullYear()} Dan Holloran`,
    feedLinks: { rss: `${SITE_URL}/feed.xml` },
    author: { name: "Dan Holloran", link: SITE_URL },
  });

  // loadDatedPosts already excludes undated and bad-date posts (which the
  // shared loader warned about), so no `Invalid Date` pubDate ever ships.
  for (const post of loadDatedPosts()) {
    const url = `${SITE_URL}/posts/${post.slug}`;
    const description = neutralizeCdata(post.description).trim();
    feed.addItem({
      title: resolveItemTitle(post, description),
      id: url,
      link: url,
      description,
      content: renderBody(renderer, post),
      date: new Date(post.sortTime),
      category: post.tags?.map((tag: string) => ({ name: tag })) ?? [],
      image: post.image ? `${SITE_URL}${post.image}` : undefined,
    });
  }

  return feed.rss2();
}
