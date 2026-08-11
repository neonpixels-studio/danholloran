import { Feed } from "feed";
import type { MarkdownRenderer } from "vitepress";
import { readdirSync, readFileSync } from "fs";
import { join } from "path";
import { parseFrontmatter } from "./frontmatter";
import { SITE_URL, SITE_DESCRIPTION } from "./constants";

const POSTS_DIR = join(process.cwd(), ".vitepress/content/posts");

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

// Post bodies use root-relative URLs (e.g. `/images/...`, `/posts/...`) that a
// feed reader resolves against its own origin, 404-ing every image and dead-
// linking every internal reference. Rewrite them to absolute site URLs — the
// same rule the item `image` field already applies. The negative lookahead
// leaves protocol-relative `//host` URLs untouched.
const ROOT_RELATIVE_URL = /(\s(?:src|href)=")\/(?!\/)/g;

// A post with no date, or a date that fails to parse, is excluded from the
// feed rather than shipping an `Invalid Date` pubDate to subscribers. Warn
// loudly on the unparseable case (as opposed to simply missing) since it
// points at a frontmatter typo rather than an intentionally undated post.
function hasParseableDate(post: Record<string, any>): boolean {
  if (!post.date) {
    return false;
  }
  const isUnparseable = Number.isNaN(new Date(post.date).getTime());
  if (isUnparseable) {
    console.warn(
      `generateFeed: skipping "${post.slug}" — unparseable date "${post.date}"`,
    );
  }
  return !isUnparseable;
}

function loadPosts(): Record<string, any>[] {
  const files = readdirSync(POSTS_DIR).filter(
    (file) => file.endsWith(".md") && file !== "index.md",
  );

  return files
    .map((file) => {
      const raw = readFileSync(join(POSTS_DIR, file), "utf-8");
      const { data, content } = parseFrontmatter(raw);
      const slug = file.replace(/\.md$/, "");
      return { ...data, slug, body: content } as Record<string, any>;
    })
    .filter((post) => !post.draft && hasParseableDate(post))
    .sort(
      (left, right) =>
        new Date(right.date).getTime() - new Date(left.date).getTime(),
    );
}

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

  for (const post of loadPosts()) {
    const url = `${SITE_URL}/posts/${post.slug}`;
    feed.addItem({
      title: neutralizeCdata(post.title),
      id: url,
      link: url,
      description: neutralizeCdata(post.description),
      content: renderBody(renderer, post),
      date: new Date(post.date),
      category: post.tags?.map((tag: string) => ({ name: tag })) ?? [],
      image: post.image ? `${SITE_URL}${post.image}` : undefined,
    });
  }

  return feed.rss2();
}
