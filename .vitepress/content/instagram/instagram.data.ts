import { createContentLoader } from "vitepress";

export default createContentLoader(".vitepress/content/instagram/*.md", {
  transform(data) {
    return data.sort(
      (a, b) =>
        new Date(b.frontmatter.created_at).getTime() -
        new Date(a.frontmatter.created_at).getTime(),
    );
  },
});
