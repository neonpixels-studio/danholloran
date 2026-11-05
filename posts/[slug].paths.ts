import fs from "node:fs";
import path from "node:path";
import { parseFrontmatter } from "../.vitepress/theme/utils/frontmatter";
import { isPublished } from "../.vitepress/theme/utils/loadPublishedPosts";

const POSTS_DIR = "./.vitepress/content/posts";
const MARKDOWN_EXTENSION = ".md";

interface PostFile {
  slug: string;
  data: Record<string, unknown>;
  content: string;
}

function readPostFile(file: string): PostFile {
  try {
    const { data, content } = parseFrontmatter(
      fs.readFileSync(path.join(POSTS_DIR, file), "utf-8"),
    );
    return { slug: path.parse(file).name, data, content };
  } catch (error) {
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
    return (
      fs
        .readdirSync(POSTS_DIR)
        .filter((file) => path.extname(file) === MARKDOWN_EXTENSION)
        .map(readPostFile)
        // Primary gate keeping drafts out of the build: a draft generates no
        // route at all. Filter on the shared draft policy so drafts are
        // dropped here exactly as they are in the content loaders and the SEO
        // transform (pageTransform.ts keeps a matching guard as
        // defense-in-depth for any draft reached another way).
        .filter((post) => isPublished(post.data, `${post.slug}.md`))
        // `content` (the body, frontmatter stripped) replaces the
        // <!-- @content --> marker in [slug].md, so each post page compiles
        // only its own body instead of shipping every post's html.
        .map((post) => ({ params: { slug: post.slug }, content: post.content }))
    );
  },
};
