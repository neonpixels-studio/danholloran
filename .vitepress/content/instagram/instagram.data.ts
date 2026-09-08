import { createContentLoader } from "vitepress";
import type { InstagramContentItem } from "@typedefs";

// VitePress rewrites this module at build time to add the `data` export
// below; nothing here checks it against what `transform` actually returns,
// so this declaration is the only contract consumers get.
declare const data: InstagramContentItem[];
export { data };

export default createContentLoader(".vitepress/content/instagram/*.md", {
  transform(data) {
    return data.sort(
      (a, b) =>
        new Date(b.frontmatter.created_at).getTime() -
        new Date(a.frontmatter.created_at).getTime(),
    );
  },
});
