// Shared pagination + filter logic for the blog archive. Imported by both the
// browser view (PostsView.vue) and the build-time route generators
// (archivePaths.ts) / SEO transform (pageTransform.ts), so it must stay pure —
// no node-only imports — and be the single source of truth for page sizing and
// filter slugs. Keeping the numbers here means the static routes generated at
// build time and the slices the view renders can never drift apart.

// The first page carries one extra card because its lead post renders as a
// full-width featured card; every later page is a plain 3-column grid.
export const FIRST_PAGE_SIZE = 10;
export const REST_PAGE_SIZE = 9;

export const ALL_TOPIC = "all";
export const ALL_TAG = "all";

export const POSTS_BASE = "/posts";
// The blog index is a directory route (posts/index.html), so a slashless
// /posts 301-redirects to /posts/ on Netlify. Link the trailing-slash form
// directly to skip that hop; POSTS_BASE stays slashless for building the
// filtered/paginated child routes (/posts/topic/x), which are plain .html files.
export const POSTS_INDEX = `${POSTS_BASE}/`;
const PAGE_SEGMENT = "page";
const TOPIC_SEGMENT = "topic";
const TAG_SEGMENT = "tag";
const FIRST_PAGE = 1;

// Combining diacritical marks left behind after NFKD decomposition (é -> e + ´).
const COMBINING_MARKS = /[\u0300-\u036f]/g;

// URL-safe slug for a topic or tag value. Lowercased, accents folded to ASCII,
// non-alphanumeric runs collapsed to a single dash, edges trimmed. Two labels
// can slug to the same value (e.g. "tailwind.css" and "tailwind-css"); the
// archive filters by slug rather than exact label so both land on — and are
// counted by — one page.
export function toFilterSlug(value: string): string {
  return String(value)
    .toLowerCase()
    .normalize("NFKD")
    .replace(COMBINING_MARKS, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// A label only earns a crawlable route when it slugs to a non-empty value that
// isn't the reserved "all" sentinel. A pure-punctuation / non-Latin label slugs
// to "" and gets no page; a label slugging to "all" would collide with the
// no-filter sentinel and render the whole archive under a "Posts tagged #all"
// title, so it's excluded too. Non-string values never route.
export function hasFilterRoute(label: unknown): boolean {
  if (typeof label !== "string") {
    return false;
  }
  const slug = toFilterSlug(label);
  // ALL_TOPIC and ALL_TAG are both "all", so one check covers both dimensions.
  return slug.length > 0 && slug !== ALL_TOPIC;
}

// The single tie-break for labels that collide on one slug (e.g. "tailwind.css"
// and "tailwind-css"): the lexicographically smallest label wins, so the page's
// title/heading is stable regardless of the order posts are added. Shared by
// the build-time route generator and the in-view topic row so they never drift.
export function pickRepresentativeLabel(
  existing: string | undefined,
  candidate: string,
): string {
  if (existing === undefined || candidate < existing) {
    return candidate;
  }
  return existing;
}

// The 1-based page a route resolves to, defaulting to page 1 for a missing or
// malformed value rather than letting NaN silently render an empty archive.
export function toPageNumber(raw: unknown): number {
  const page = Number(raw);
  return Number.isInteger(page) && page >= FIRST_PAGE ? page : FIRST_PAGE;
}

// Total number of pages needed to hold `count` posts under the first-page /
// rest-page split above. Always at least one page, even for zero posts.
export function totalPagesForCount(count: number): number {
  if (count <= FIRST_PAGE_SIZE) {
    return FIRST_PAGE;
  }
  return FIRST_PAGE + Math.ceil((count - FIRST_PAGE_SIZE) / REST_PAGE_SIZE);
}

// The zero-based slice bounds for `page`, matching totalPagesForCount's split.
export function pageSlice<Item>(items: Item[], page: number): Item[] {
  if (page <= FIRST_PAGE) {
    return items.slice(0, FIRST_PAGE_SIZE);
  }
  const start = FIRST_PAGE_SIZE + (page - 2) * REST_PAGE_SIZE;
  return items.slice(start, start + REST_PAGE_SIZE);
}

// The extra page numbers a filter needs beyond page 1 (page 1 is served by its
// own base route: /posts, /posts/topic/x, /posts/tag/x). Returns [2..N].
export function extraPageNumbers(count: number): number[] {
  const total = totalPagesForCount(count);
  const pages: number[] = [];
  for (let page = FIRST_PAGE + 1; page <= total; page += 1) {
    pages.push(page);
  }
  return pages;
}

export interface ArchiveFilter {
  topicSlug?: string | null;
  tagSlug?: string | null;
}

// Builds the href for a given page within a filter context. Page 1 points at
// the filter's base route (no /page/ segment); the unfiltered page 1 is /posts/.
export function archiveHref(page: number, filter: ArchiveFilter = {}): string {
  const segments: string[] = [];
  if (filter.topicSlug) {
    segments.push(TOPIC_SEGMENT, filter.topicSlug);
  } else if (filter.tagSlug) {
    segments.push(TAG_SEGMENT, filter.tagSlug);
  }
  if (page > FIRST_PAGE) {
    segments.push(PAGE_SEGMENT, String(page));
  }
  if (segments.length === 0) {
    return POSTS_INDEX;
  }
  return `${POSTS_BASE}/${segments.join("/")}`;
}
