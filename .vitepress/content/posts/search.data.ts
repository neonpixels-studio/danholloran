import { createContentLoader } from "vitepress";
import { PostSearchItem } from "@typedefs";

declare const data: PostSearchItem[];
export { data };

export default createContentLoader(".vitepress/content/posts/*.md", {
  transform(raw) {
    return raw
      .filter(({ frontmatter }) => !frontmatter.draft)
      .sort(
        (a, b) =>
          new Date(b.frontmatter.date).getTime() -
          new Date(a.frontmatter.date).getTime(),
      )
      .map(({ frontmatter, url }) => {
        const slug = url
          .replace(/\/.vitepress\/content\/posts\//g, "")
          .replace(/\/posts\//g, "");
        const date = new Date(frontmatter.date).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        });
        return {
          type: "post" as const,
          title: frontmatter.title as string,
          desc: `${frontmatter.topic} · ${date}`,
          href: `/posts/${slug}`,
          kw: [
            frontmatter.description ?? "",
            frontmatter.topic ?? "",
            ...(frontmatter.tags ?? []),
          ].join(" "),
        };
      });
  },
});
