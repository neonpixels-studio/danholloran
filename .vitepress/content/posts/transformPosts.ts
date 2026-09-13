import type { ContentData } from "vitepress";
import type { Post, PostMeta } from "@typedefs";
import { calculateReadTime } from "../../theme/utils/readTime.ts";
import { normalizeTags } from "../../theme/utils/normalizeTags.ts";

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

// Both the sort key and "is this safe to format" flag for a post's date,
// computed once per post from a single Date parse. search.data.ts and
// transformPosts both need this — sharing one resolver means an unparseable
// date warns exactly once (not once per consumer) and the two call sites
// can't drift on how "invalid" is detected.
export type PublishedDate = {
  sortTime: number;
  isValid: boolean;
};

// A missing or malformed frontmatter date would make the sort comparator
// return NaN, which Array.prototype.sort treats as "equal" — leaving the post
// in its (arbitrary) glob position, possibly the featured slot — and would
// render the literal string "Invalid Date" wherever the date gets formatted.
// Mirror generateFeed's behaviour: warn loudly, sort the post last (oldest),
// and flag the date unusable so callers skip formatting it.
export function resolvePublishedDate(post: ContentData): PublishedDate {
  const time = new Date(post.frontmatter.date).getTime();
  if (Number.isNaN(time)) {
    console.warn(
      `transformPosts: post "${post.url}" has an unparseable date ` +
        `"${post.frontmatter.date}"; sorting it last`,
    );
    return { sortTime: 0, isValid: false };
  }
  return { sortTime: time, isValid: true };
}

export function transformPosts(raw: ContentData[]): Post[] {
  // Decorate each post with its parsed publish time before sorting so
  // resolvePublishedDate (and its warn on a bad date) runs once per post
  // rather than once per comparison.
  return raw
    .filter(({ frontmatter }) => !frontmatter.draft)
    .map((post) => ({
      post,
      publishedAt: resolvePublishedDate(post).sortTime,
    }))
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
          // vitepress types raw frontmatter as `Record<string, any>`, so TS
          // can't verify it matches PostMeta at this spread. Malformed dates
          // already get a loud runtime warning above (resolvePublishedDate);
          // other malformed/missing fields are not yet validated at build
          // time — this cast only silences the type error, it doesn't add
          // safety.
          ...(post.frontmatter as PostMeta),
          slug,
          readTime: calculateReadTime(src ?? ""),
          // Normalize once at this chokepoint so every list/detail consumer
          // downstream can treat `tags` as a guaranteed array.
          tags: normalizeTags(post.frontmatter.tags),
        },
      };
    });
}
