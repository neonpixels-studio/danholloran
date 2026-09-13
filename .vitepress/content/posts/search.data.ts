import { createContentLoader } from "vitepress";
import type { ContentData } from "vitepress";
import { PostSearchItem } from "@typedefs";
import { normalizeTags } from "../../theme/utils/normalizeTags.ts";
import { POSTS_GLOB } from "./transformPosts.ts";

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
  return raw
    .filter(({ frontmatter }) => !frontmatter.draft)
    .sort(
      (a, b) =>
        new Date(b.frontmatter.date).getTime() -
        new Date(a.frontmatter.date).getTime(),
    )
    .map(({ frontmatter, url }) => {
      const slug = url
        .replace(/\/\.vitepress\/content\/posts\//g, "")
        .replace(/\/posts\//g, "");
      const date = new Date(frontmatter.date).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
      const tags = normalizeTags(frontmatter.tags).filter(
        (tag): tag is string => typeof tag === "string",
      );
      // frontmatter.topic is optional at runtime even though the Post type
      // marks it required — author-controlled YAML can omit it or supply a
      // non-string scalar. Matches the `typeof === "string"` policy already
      // applied to topic in archivePaths.ts and pageTransform.ts: a non-string
      // topic falls back to empty rather than getting laundered into the
      // desc/keyword string as e.g. a stray number. Without this guard a
      // topicless post's desc interpolates the literal string "undefined"
      // ahead of the separator instead of just showing the date.
      const topic =
        typeof frontmatter.topic === "string" ? frontmatter.topic.trim() : "";
      const desc = topic ? `${topic} · ${date}` : date;
      return {
        type: "post" as const,
        title: frontmatter.title as string,
        desc,
        href: `/posts/${slug}`,
        kw: [frontmatter.description ?? "", topic, ...tags]
          .filter(Boolean)
          .join(" "),
      };
    });
}

export default createContentLoader(POSTS_GLOB, {
  transform: transformSearchData,
});
