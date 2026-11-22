export interface PostMeta {
  title: string;
  slug: string;
  image: string;
  draft: boolean;
  topic: string;
  date: string;
  description: string;
  tags: string[];
  readTime: number;
  // Snake_case to match the existing legacy WordPress-era frontmatter key.
  // Optional notice shown as a banner above the post body (e.g. a project is
  // no longer maintained).
  alert_message?: string;
  // A post opts into a series with both keys: `series` is the series' display
  // name (shared verbatim by every part) and `series_part` its sort key within
  // the series. The displayed "Part N" is the post's position among published
  // parts, not this raw value, so parts can go live out of order.
  series?: string;
  series_part?: number;
}

export interface Post {
  frontmatter: PostMeta;
  url: string;
  // Decided once at load time by resolvePublishedDate; render surfaces read it
  // via formatPostDateFor instead of re-deriving validity from the raw date.
  dateIsValid: boolean;
  // The ?v= token for the cover image's responsive variants, or null when it
  // has none; resolved at load time by imageVersionFor so the browser never
  // needs the fingerprint manifest. Passed to ResponsiveImage as `version`.
  imageVersion: string | null;
}

// One topic chip on the archive filter row, de-duped by slug.
export interface ArchiveTopic {
  slug: string;
  label: string;
}

// What one archive page renders, computed at build time (see postViews.ts) so
// the page ships only its own slice instead of every post's metadata.
export interface ArchiveView {
  posts: Post[];
  topics: ArchiveTopic[];
  totalPages: number;
}

// The posts on either side of a post in newest-first order. `prevPost` is the
// older neighbor and `nextPost` the newer one, matching PostView's links.
export interface PostNeighbors {
  post: Post;
  prevPost: Post | null;
  nextPost: Post | null;
}

// One linkable part in a post's series, slimmed down from Post so a series
// page doesn't ship every part's full metadata.
export interface PostSeriesPart {
  title: string;
  url: string;
}

// The series a post belongs to, built at build time by findPostSeries. `part`
// is the post's 1-based position in `parts` and `total` counts published parts
// only, so both can shift as drafts in the series go live.
export interface PostSeries {
  name: string;
  part: number;
  total: number;
  parts: PostSeriesPart[];
}

export interface HomePosts {
  latestPosts: Post[];
  nationalParkCount: number;
}
