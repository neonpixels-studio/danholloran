import { createContentLoader } from "vitepress";
import type { ContentData } from "vitepress";
import { PostSearchItem } from "@typedefs";
import { normalizeTags } from "../../theme/utils/normalizeTags.ts";
import { coerceFrontmatterString } from "../../theme/utils/frontmatter.ts";
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
      // `title` was previously an unchecked cast, so a post missing/misusing
      // the frontmatter key reached AppSearch's highlight(), which throws on
      // .toLowerCase() once a query is typed. coerceFrontmatterString guards it.
      const title = coerceFrontmatterString(frontmatter.title);
      return {
        type: "post" as const,
        title,
        desc: `${frontmatter.topic} · ${date}`,
        href: `/posts/${slug}`,
        kw: [
          frontmatter.description ?? "",
          frontmatter.topic ?? "",
          ...tags,
        ].join(" "),
      };
    });
}

export default createContentLoader(POSTS_GLOB, {
  transform: transformSearchData,
});
