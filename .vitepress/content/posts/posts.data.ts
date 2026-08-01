import { createContentLoader } from "vitepress";
import type { Post } from "@typedefs";
import { calculateReadTime } from "../../theme/utils/readTime.ts";

declare const data: Post[];
export { data };

export default createContentLoader(".vitepress/content/posts/*.md", {
  // includeSrc is needed here only so `transform` can compute readTime below;
  // src itself is stripped before the payload leaves `transform`.
  // @todo split list metadata (this loader) from post detail content (a
  // dedicated render:true loader for posts/[slug].md) so html only ships to
  // the one page that needs it; out of scope here since it's a larger
  // change than trimming already-unused fields.
  includeSrc: true,
  render: true,
  transform(raw) {
    return raw
      .filter(({ frontmatter }) => !frontmatter.draft)
      .sort(
        (a, b) =>
          new Date(b.frontmatter.date).getTime() -
          new Date(a.frontmatter.date).getTime(),
      )
      .map(({ src, excerpt: _excerpt, ...post }): Post => {
        const slug = post.url
          .replace(/\/\.vitepress\/content\/posts\//g, "")
          .replace(/\/posts\//g, "");

        // Build a new object rather than mutating `post` in place: VitePress
        // reuses the same cached data object across reloads (e.g. dev server
        // HMR), so writing derived state (slug/readTime) back onto it would
        // leak into the cache and corrupt the next transform pass. This does
        // not deep-copy nested frontmatter values (e.g. `tags`); transform
        // never writes to those, so the shared reference is safe.
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
  },
});
