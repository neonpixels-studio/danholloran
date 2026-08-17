import fs from "node:fs";
import path from "node:path";
import { parseFrontmatter } from "../.vitepress/theme/utils/frontmatter";
import { isPublished } from "../.vitepress/theme/utils/loadPublishedPosts";

const POSTS_DIR = "./.vitepress/content/posts";
const MARKDOWN_EXTENSION = ".md";

// Primary gate keeping drafts out of the build: a draft generates no route at
// all. Filter on the shared draft policy so drafts are dropped here exactly as
// they are in the content loaders and the SEO transform (pageTransform.ts keeps
// a matching guard as defense-in-depth for any draft reached another way).
function isPublishedPostFile(file: string): boolean {
  if (path.extname(file) !== MARKDOWN_EXTENSION) {
    return false;
  }
  try {
    const { data } = parseFrontmatter(
      fs.readFileSync(path.join(POSTS_DIR, file), "utf-8"),
    );
    return isPublished(data, file);
  } catch (error) {
    // The read/parse are new throw sites in what was a pure extension filter.
    // Fail loud (a broken post shouldn't ship as a missing route) but name the
    // file, or the raw ENOENT/YAML error points at no post.
    throw new Error(`posts/[slug].paths: cannot read frontmatter for ${file}`, {
      cause: error,
    });
  }
}

export default {
  watch: [`${POSTS_DIR}/*${MARKDOWN_EXTENSION}`],
  paths() {
    return fs
      .readdirSync(POSTS_DIR)
      .filter(isPublishedPostFile)
      .map((file) => {
        return { params: { slug: path.parse(file).name } };
      });
  },
};
