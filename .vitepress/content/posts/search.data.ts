import { createContentLoader } from "vitepress";
import type { ContentData } from "vitepress";
import { PostSearchItem } from "@typedefs";
import { normalizeTags } from "../../theme/utils/normalizeTags.ts";
import { coerceFrontmatterString } from "../../theme/utils/frontmatter.ts";
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
        // frontmatter.topic is optional at runtime even though the Post type
        // marks it required — YAML can omit it, leave it bare (null), or hand
        // back a non-string scalar. Guard to a trimmed string so a topicless
        // post never interpolates the literal "undefined" or launders a
        // number into desc/kw.
        const topic =
          typeof frontmatter.topic === "string" ? frontmatter.topic.trim() : "";
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
        // `title` was previously an unchecked cast, so a post missing/misusing
        // the frontmatter key reached AppSearch's highlight(), which throws on
        // .toLowerCase() once a query is typed. coerceFrontmatterString guards it.
        const title = coerceFrontmatterString(frontmatter.title);
        return {
          type: "post" as const,
          title,
          // Join only the parts that exist rather than special-casing one
          // side — an absent topic must not leave an orphan " · " leading
          // the date, and an absent date must not leave a trailing one.
          desc: [topic, date].filter(Boolean).join(" · "),
          href: `/posts/${slug}`,
          // filter(Boolean) drops an empty description or topic so the join
          // can't leave a leading space ahead of the tags.
          kw: [frontmatter.description ?? "", topic, ...tags]
            .filter(Boolean)
            .join(" "),
        };
      })
  );
}

export default createContentLoader(POSTS_GLOB, {
  transform: transformSearchData,
});
