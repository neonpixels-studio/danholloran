import { createContentLoader } from "vitepress";

export default createContentLoader(".vitepress/content/posts/*.md", {
  transform(data) {
    return data
      .filter(({ frontmatter }) => !frontmatter.draft)
      .sort(
        (a, b) =>
          new Date(b.frontmatter.date).getTime() -
          new Date(a.frontmatter.date).getTime(),
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
