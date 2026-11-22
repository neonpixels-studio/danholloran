import { readdirSync, readFileSync } from "fs";
import { join } from "path";
import { parseFrontmatter } from "./frontmatter";
import { isScheduledAfter, publishCutoff } from "./publishSchedule";

// Exported so other consumers that need to locate an individual post file by
// slug (e.g. pageTransform.ts's canonical-target lookup) share this one
// definition of where post content lives, rather than re-deriving it.
export const POSTS_DIR = join(process.cwd(), ".vitepress/content/posts");
const MARKDOWN_EXTENSION = ".md";
export const INDEX_FILE = "index.md";

// Newest-first sort key. A missing date, or a date that fails to parse, sorts
// to the end via a finite sentinel (not -Infinity) so `right.sortTime -
// left.sortTime` stays a real number for any pair — including two undated
// posts, which keeps the sort stable rather than producing NaN.
const UNDATED_SORT_TIME = Number.MIN_SAFE_INTEGER;

// A single record for one published post: the parsed frontmatter spread onto
// the object (so `post.title`, `post.date`, `post.topic`, etc. read straight
// through as before), plus a `slug`, the raw markdown `body`, and the
// precomputed `sortTime` used for ordering.
export type PublishedPost = {
  slug: string;
  body: string;
  sortTime: number;
} & Record<string, any>;

type ParsedPost = {
  slug: string;
  body: string;
} & Record<string, any>;

function isPostFile(file: string): boolean {
  return file.endsWith(MARKDOWN_EXTENSION) && file !== INDEX_FILE;
}

function parsePostFile(file: string): ParsedPost {
  const { data, content } = parseFrontmatter(
    readFileSync(join(POSTS_DIR, file), "utf-8"),
  );
  const slug = file.slice(0, -MARKDOWN_EXTENSION.length);
  return { ...data, slug, body: content };
}

// The single publish policy shared by every consumer. Content loaders, route
// generation (`posts/[slug].paths.ts`), and the SEO transform
// (`pageTransform.ts`) all filter on this, so a draft or a scheduled post is
// dropped identically everywhere and never leaks a reachable, indexable page.
// Takes just the frontmatter's draft flag and date (so callers holding raw
// frontmatter, not a full ParsedPost, can reuse it) plus a `source` label
// naming the post, so a warning is traceable to a file. A non-boolean draft
// almost always means a frontmatter typo — a truthy one (e.g. the string
// "false") silently hides the post, a falsy one (bare `draft:` → null,
// `draft: 0`) silently publishes it — so warn loudly either way, stating the
// outcome the value actually produced (mirrors resolveSortTime's fail-loud
// policy).
//
// A post dated after `cutoff` is scheduled and unpublished. The cutoff is the
// build time on Netlify production builds and null (show scheduled posts)
// everywhere else; see publishSchedule.ts for the date semantics.
export function isPublished(
  frontmatter: { draft?: unknown; date?: unknown },
  source: string,
  cutoff: Date | null = publishCutoff(),
): boolean {
  const { draft } = frontmatter;
  const notDraft = !draft;
  if (draft !== undefined && typeof draft !== "boolean") {
    console.warn(
      `isPublished: ${source} has a non-boolean draft value ${JSON.stringify(draft)}; treating the post as ${notDraft ? "published" : "a draft"}`,
    );
  }
  if (!notDraft || cutoff === null) {
    return notDraft;
  }
  return !isScheduledAfter(frontmatter.date, cutoff);
}

// The one date policy shared by every consumer. A missing date is silent — an
// intentionally undated post (e.g. some travel entries) is legitimate. An
// unparseable date warns loudly, since it almost always points at a
// frontmatter typo rather than a deliberate omission. Neither is dropped or
// thrown here; both collapse to the undated sentinel. The warning states only
// the fact, not the consequence, because that differs per consumer (the feed
// drops the post, llms.txt lists it last, the sitemap falls back to mtime).
function resolveSortTime(slug: string, date: unknown): number {
  if (!date) {
    return UNDATED_SORT_TIME;
  }
  const time = new Date(date as string).getTime();
  if (Number.isNaN(time)) {
    console.warn(
      `loadPublishedPosts: post "${slug}" has an unparseable date "${date}"`,
    );
    return UNDATED_SORT_TIME;
  }
  return time;
}

// ParsedPost has declared properties, so passing it whole to isPublished's weak
// `{ draft?: unknown; date?: unknown }` parameter trips TS's weak-type check
// (no properties in common); hand over just the fields it reads.
function isPublishedPost(post: ParsedPost): boolean {
  return isPublished({ draft: post.draft, date: post.date }, post.slug);
}

function withSortTime(post: ParsedPost): PublishedPost {
  return { ...post, sortTime: resolveSortTime(post.slug, post.date) };
}

function byNewestFirst(left: PublishedPost, right: PublishedPost): number {
  return right.sortTime - left.sortTime;
}

// True when the post carries a real, parseable date (as opposed to a missing
// or malformed one, both of which collapse to the undated sentinel). Consumers
// that cannot ship an `Invalid Date` — the RSS feed's pubDate, a sitemap
// lastmod — filter on this.
export function hasUsableDate(post: PublishedPost): boolean {
  return post.sortTime !== UNDATED_SORT_TIME;
}

// The single source of truth for "the published posts, newest first". Reads
// the posts directory, parses frontmatter, drops `index.md`, drafts, and (in
// production) scheduled posts, and orders by the shared date policy above.
// sortTime is computed only for published posts, so a draft with a malformed
// date never triggers a warning.
export function loadPublishedPosts(): PublishedPost[] {
  return readdirSync(POSTS_DIR)
    .filter(isPostFile)
    .map(parsePostFile)
    .filter(isPublishedPost)
    .map(withSortTime)
    .sort(byNewestFirst);
}

// Published posts that carry a real, parseable date. The feed (needs a valid
// pubDate), the blog JSON-LD (needs a valid datePublished), and the latest-
// image lookup all want exactly this set, so it lives here once.
export function loadDatedPosts(): PublishedPost[] {
  return loadPublishedPosts().filter(hasUsableDate);
}

// Slugs of every post this build leaves unpublished: drafts, plus scheduled
// posts on production builds. The build-output leak guard checks that none of
// them shipped a page or a feed/sitemap entry.
export function loadUnpublishedPostSlugs(): string[] {
  return readdirSync(POSTS_DIR)
    .filter(isPostFile)
    .map(parsePostFile)
    .filter((post) => !isPublishedPost(post))
    .map((post) => post.slug);
}
