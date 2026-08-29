// The shared "non-array tags means empty" policy. Frontmatter `tags` is
// author-controlled YAML, so a post can carry a scalar, null, or a missing key
// where the list/archive code expects an array.
//
// Two data paths call this:
//   - transformPosts (the list/detail content-loader chokepoint), which makes
//     `tags` a guaranteed array on every Post, so downstream list/detail
//     consumers (PostsView, HomeTravelMap) read it directly without re-guarding.
//   - archivePaths.tagBuckets, which parses frontmatter straight off disk for
//     build-time route generation and never passes through that chokepoint.
// Both previously re-derived `Array.isArray(tags) ? tags : []` locally.
//
// It normalizes only the container shape (list vs. not), not the element types
// — a numeric YAML tag survives, so callers that need string-only tags still
// filter for `typeof tag === "string"` themselves. (SEO keyword building in
// pageTransform keeps its own scalar-wrapping policy and is not a caller.)
export function normalizeTags(tags: unknown): string[] {
  return Array.isArray(tags) ? tags : [];
}
