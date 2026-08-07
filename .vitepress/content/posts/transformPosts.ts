import type { ContentData } from "vitepress";
import type { Post } from "@typedefs";
import { calculateReadTime } from "../../theme/utils/readTime.ts";

// Both the list loader (posts.data.ts) and the detail loader
// (postsDetail.data.ts) match the same posts and share this transform; the
// only difference between them is the `render` flag they pass to
// createContentLoader. Editing this shared module may need a dev-server
// restart for both loaders to pick up the change.
export const POSTS_GLOB = ".vitepress/content/posts/*.md";

function toSlug(url: string): string {
  return url
    .replace(/\/\.vitepress\/content\/posts\//g, "")
    .replace(/\/posts\//g, "");
}

// A missing or malformed frontmatter date would make the sort comparator
// return NaN, which Array.prototype.sort treats as "equal" — leaving the post
// in its (arbitrary) glob position, possibly the featured slot. Mirror
// generateFeed's behaviour: warn loudly and sort the post last (oldest)
// instead of letting a typo scramble the list order.
function publishedTime(post: ContentData): number {
  const time = new Date(post.frontmatter.date).getTime();
  if (Number.isNaN(time)) {
    console.warn(
      `transformPosts: post "${post.url}" has an unparseable date ` +
        `"${post.frontmatter.date}"; sorting it last`,
    );
    return 0;
  }
  return time;
}

export function transformPosts(raw: ContentData[]): Post[] {
  // Decorate each post with its parsed publish time before sorting so
  // publishedTime (and its warn on a bad date) runs once per post rather than
  // once per comparison.
  return raw
    .filter(({ frontmatter }) => !frontmatter.draft)
    .map((post) => ({ post, publishedAt: publishedTime(post) }))
    .sort((a, b) => b.publishedAt - a.publishedAt)
    .map(({ post: { src, excerpt: _excerpt, ...post } }): Post => {
      const slug = toSlug(post.url);

      // Build a new object rather than mutating `post` in place: VitePress
      // reuses the same cached data object across reloads (e.g. dev server
      // HMR), so writing derived state (slug/readTime) back onto it would
      // leak into the cache and corrupt the next transform pass. This does
      // not deep-copy nested frontmatter values (e.g. `tags`); transform
      // never writes to those, so the shared reference is safe.
      //
      // `html` is spread through `...post` only when the loader ran with
      // render:true (the detail loader); the render:false list loader never
      // receives it, so list surfaces ship no rendered post html.
      return {
        ...post,
        url: `/posts/${slug}`,
        frontmatter: {
          ...post.frontmatter,
          slug,
          readTime: calculateReadTime(src ?? ""),
        },
      };
    });
}
