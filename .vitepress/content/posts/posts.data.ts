import { createContentLoader } from "vitepress";

export default createContentLoader(".vitepress/content/posts/*.md", {
  transform(data) {
    return data
      .filter(({ frontmatter }) => !frontmatter.draft)
      .sort(
        (a, b) =>
          new Date(b.frontmatter.created_at).getTime() -
          new Date(a.frontmatter.created_at).getTime(),
      )
      .map((item) => {
        item.frontmatter.slug = item.url
          .replace(/\/.vitepress\/content\/posts\//g, "")
          .replace(/\/posts\//g, "");
        item.url = `/posts/${item.frontmatter.slug}`;

        return item;
      });
  },
});
