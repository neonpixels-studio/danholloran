import { createContentLoader } from "vitepress";
import type { ContentData } from "vitepress";
import { PostSearchItem } from "@typedefs";
import { normalizeTags } from "../../theme/utils/normalizeTags.ts";
import { formatPostDate } from "../../theme/utils/formatDate.ts";
import { POSTS_GLOB, resolvePublishedDate, toSlug } from "./transformPosts.ts";

declare const data: PostSearchItem[];
export { data };

// Raw frontmatter `tags` is author-controlled YAML that can arrive as a
// scalar (string/number) or be missing entirely, not just an array — spreading
// that straight into the keyword array either explodes a string into its
// individual characters or throws on a number. `normalizeTags` guards the
// container shape; the string filter then matches archivePaths' `tagBuckets`
// policy of dropping non-string tags rather than coercing them into a
// laundered keyword.
export function transformSearchData(raw: ContentData[]): PostSearchItem[] {
  return (
    raw
      .filter(({ frontmatter }) => !frontmatter.draft)
      // Decorate each post with its resolved publish date before sorting, so
      // resolvePublishedDate (and its warn on a bad date) runs once per post
      // rather than once per comparison — same shape as transformPosts.
      .map((post) => ({ post, published: resolvePublishedDate(post) }))
      .sort((a, b) => b.published.sortTime - a.published.sortTime)
      .map(({ post: { frontmatter, url }, published }) => {
        const slug = toSlug(url);
        const topic = (frontmatter.topic as string | undefined) ?? "";
        // An unparseable date already warned inside resolvePublishedDate;
        // formatting it anyway would render the literal string "Invalid Date"
        // into the search result's desc, so fall back to the topic alone.
        // formatPostDate is the same formatter every other post surface
        // (HomeBlog, PostsView, PostView) uses, so the search index can't
        // drift from them on locale/timezone.
        const date = published.isValid
          ? formatPostDate(frontmatter.date)
          : undefined;
        const tags = normalizeTags(frontmatter.tags).filter(
          (tag): tag is string => typeof tag === "string",
        );
        return {
          type: "post" as const,
          title: frontmatter.title as string,
          desc: date ? `${topic} · ${date}` : topic,
          href: `/posts/${slug}`,
          kw: [frontmatter.description ?? "", topic, ...tags].join(" "),
        };
      })
  );
}

export default createContentLoader(POSTS_GLOB, {
  transform: transformSearchData,
});
