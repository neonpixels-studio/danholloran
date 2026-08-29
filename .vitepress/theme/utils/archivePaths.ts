import { loadPublishedPosts, type PublishedPost } from "./loadPublishedPosts";
import {
  extraPageNumbers,
  hasFilterRoute,
  pickRepresentativeLabel,
  toFilterSlug,
} from "./archive";
import { normalizeTags } from "./normalizeTags";

// The posts glob every archive `.paths.ts` declares in its `watch` array,
// mirroring the existing `posts/[slug].paths.ts` convention. Defined once so all
// five routes point at one directory. (Editing a post may still need a dev-server
// restart for the routes to regenerate — same caveat as `[slug].paths.ts`.)
export const POSTS_WATCH_GLOB = "./.vitepress/content/posts/*.md";

// Build-time route generation for the paginated / filtered blog archive. Each
// exported function returns VitePress `paths()` entries — one per static page —
// derived from the same published-post set the content loaders expose to the
// view, so page counts and filter membership match what PostsView renders.
//
// Filter buckets are keyed by slug (not the raw label) so two labels that slug
// to the same value collapse into one page; the bucket keeps a representative
// label for display and the distinct posts that belong to it for page counts.

type ParamsEntry = { params: Record<string, string> };

interface FilterBucket {
  slug: string;
  label: string;
  count: number;
}

interface RawBucket {
  label: string;
  posts: Set<string>;
}

function bucketsFromKeyed(
  posts: PublishedPost[],
  keysForPost: (_post: PublishedPost) => string[],
): FilterBucket[] {
  const bySlug = new Map<string, RawBucket>();
  for (const post of posts) {
    addPostToBuckets(bySlug, post, keysForPost(post));
  }
  return [...bySlug.entries()].map(([slug, bucket]) => ({
    slug,
    label: bucket.label,
    count: bucket.posts.size,
  }));
}

function addPostToBuckets(
  bySlug: Map<string, RawBucket>,
  post: PublishedPost,
  keys: string[],
): void {
  for (const key of keys) {
    addPostToBucket(bySlug, post.slug, key);
  }
}

function addPostToBucket(
  bySlug: Map<string, RawBucket>,
  postSlug: string,
  key: string,
): void {
  if (!hasFilterRoute(key)) {
    return;
  }
  const slug = toFilterSlug(key);
  const bucket = bySlug.get(slug) ?? { label: key, posts: new Set<string>() };
  bucket.posts.add(postSlug);
  bucket.label = pickRepresentativeLabel(bucket.label, key);
  bySlug.set(slug, bucket);
}

function topicBuckets(): FilterBucket[] {
  const posts = loadPublishedPosts();
  return bucketsFromKeyed(posts, (post) =>
    typeof post.topic === "string" ? [post.topic] : [],
  );
}

function tagBuckets(): FilterBucket[] {
  const posts = loadPublishedPosts();
  // Only string tags route, matching PostView's `hasFilterRoute(tag)` gate on
  // the raw value — coercing a numeric YAML tag with String() would launder it
  // past that guard and generate a page no post links to.
  return bucketsFromKeyed(posts, (post) =>
    normalizeTags(post.tags).filter(
      (tag): tag is string => typeof tag === "string",
    ),
  );
}

// Extra pages (2..N) of the unfiltered archive; page 1 is /posts/index.md.
export function allExtraPagePaths(): ParamsEntry[] {
  const posts = loadPublishedPosts();
  return extraPageNumbers(posts.length).map((page) => ({
    params: { page: String(page) },
  }));
}

function basePagePaths(
  buckets: FilterBucket[],
  key: "topic" | "tag",
): ParamsEntry[] {
  return buckets.map((bucket) => ({
    params: {
      [key]: bucket.slug,
      [`${key}Label`]: bucket.label,
      page: "1",
    },
  }));
}

function extraPagePaths(
  buckets: FilterBucket[],
  key: "topic" | "tag",
): ParamsEntry[] {
  return buckets.flatMap((bucket) =>
    extraPageNumbers(bucket.count).map((page) => ({
      params: {
        [key]: bucket.slug,
        [`${key}Label`]: bucket.label,
        page: String(page),
      },
    })),
  );
}

export function topicBasePagePaths(): ParamsEntry[] {
  return basePagePaths(topicBuckets(), "topic");
}

export function topicExtraPagePaths(): ParamsEntry[] {
  return extraPagePaths(topicBuckets(), "topic");
}

export function tagBasePagePaths(): ParamsEntry[] {
  return basePagePaths(tagBuckets(), "tag");
}

export function tagExtraPagePaths(): ParamsEntry[] {
  return extraPagePaths(tagBuckets(), "tag");
}
