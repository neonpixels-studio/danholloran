import { createContentLoader } from "vitepress";
import { calculateReadTime } from "../../utils/readTime.ts";

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
        item.frontmatter.readTime = calculateReadTime(""); // @todo Make this work

        return item;
      });
  },
});
