import { readdirSync, readFileSync } from "fs";
import { join } from "path";
import { parseFrontmatter } from "./frontmatter";

const POSTS_DIR = join(process.cwd(), ".vitepress/content/posts");
const MARKDOWN_EXTENSION = ".md";
const INDEX_FILE = "index.md";

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

function isPublished(post: ParsedPost): boolean {
  return !post.draft;
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
// the posts directory, parses frontmatter, drops `index.md` and drafts, and
// orders by the shared date policy above. sortTime is computed only for
// published posts, so a draft with a malformed date never triggers a warning.
export function loadPublishedPosts(): PublishedPost[] {
  return readdirSync(POSTS_DIR)
    .filter(isPostFile)
    .map(parsePostFile)
    .filter(isPublished)
    .map(withSortTime)
    .sort(byNewestFirst);
}

// Published posts that carry a real, parseable date. The feed (needs a valid
// pubDate), the blog JSON-LD (needs a valid datePublished), and the latest-
// image lookup all want exactly this set, so it lives here once.
export function loadDatedPosts(): PublishedPost[] {
  return loadPublishedPosts().filter(hasUsableDate);
}
