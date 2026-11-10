import type {
  ArchiveTopic,
  ArchiveView,
  HomePosts,
  Post,
  PostNeighbors,
} from "@typedefs";
import {
  ALL_TAG,
  ALL_TOPIC,
  hasFilterRoute,
  pageSlice,
  pickRepresentativeLabel,
  toFilterSlug,
  toPageNumber,
  totalPagesForCount,
} from "./archive";

// Build-time view models for every surface that lists posts. postPageData.ts
// runs these against the full, newest-first post list and injects the result
// into each page's own data, so the client never downloads the whole list.
// Pure (no node-only imports) so the views' tests can build their props here.

// Home shows one featured post plus eight recent ones.
const HOME_POST_COUNT = 9;
const NATIONAL_PARK_TAG = "national-park";

// `topic`/`tag` are filter *slugs* (matched against toFilterSlug of each
// post's value), as passed through each archive route's params.
export interface ArchiveScope {
  topic?: string;
  tag?: string;
  page?: unknown;
}

// De-duped by slug (not label) and stripped of route-less labels, so the row
// never renders two chips pointing at one route or a dead /posts/topic/ link.
function archiveTopics(posts: Post[]): ArchiveTopic[] {
  const bySlug = new Map<string, string>();
  for (const label of posts.map((post) => post.frontmatter.topic)) {
    registerTopic(bySlug, label);
  }
  return [...bySlug.entries()]
    .map(([slug, label]) => ({ slug, label }))
    .sort((left, right) => left.label.localeCompare(right.label));
}

function registerTopic(bySlug: Map<string, string>, label: string): void {
  if (!hasFilterRoute(label)) {
    return;
  }
  const slug = toFilterSlug(label);
  bySlug.set(slug, pickRepresentativeLabel(bySlug.get(slug), label));
}

function activeSlug(value: string | undefined, all: string): string | null {
  if (!value || value === all) {
    return null;
  }
  return value;
}

function matchesTopic(post: Post, topicSlug: string | null): boolean {
  if (topicSlug === null) {
    return true;
  }
  return toFilterSlug(post.frontmatter.topic) === topicSlug;
}

function matchesTag(post: Post, tagSlug: string | null): boolean {
  if (tagSlug === null) {
    return true;
  }
  return post.frontmatter.tags.some(
    (postTag) => toFilterSlug(postTag) === tagSlug,
  );
}

export function buildArchiveView(
  posts: Post[],
  scope: ArchiveScope = {},
): ArchiveView {
  const topicSlug = activeSlug(scope.topic, ALL_TOPIC);
  const tagSlug = activeSlug(scope.tag, ALL_TAG);
  const filtered = posts.filter(
    (post) => matchesTopic(post, topicSlug) && matchesTag(post, tagSlug),
  );
  return {
    posts: pageSlice(filtered, toPageNumber(scope.page)),
    topics: archiveTopics(posts),
    totalPages: totalPagesForCount(filtered.length),
  };
}

// Null for a slug with no published post (e.g. a draft), so the page renders
// PostView's empty state instead of throwing.
export function findPostNeighbors(
  posts: Post[],
  slug: string,
): PostNeighbors | null {
  const index = posts.findIndex((post) => post.frontmatter.slug === slug);
  if (index === -1) {
    return null;
  }
  return {
    post: posts[index],
    prevPost: posts[index + 1] ?? null,
    nextPost: posts[index - 1] ?? null,
  };
}

export function buildHomePosts(posts: Post[]): HomePosts {
  return {
    latestPosts: posts.slice(0, HOME_POST_COUNT),
    nationalParkCount: posts.filter((post) =>
      post.frontmatter.tags.includes(NATIONAL_PARK_TAG),
    ).length,
  };
}
