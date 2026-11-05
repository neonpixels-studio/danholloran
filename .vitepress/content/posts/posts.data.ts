import { createContentLoader } from "vitepress";
import type { Post } from "@typedefs";
import { POSTS_GLOB, transformPosts } from "./transformPosts.ts";

declare const data: Post[];
export { data };

// Post metadata for Home, the blog index, and each post page's prev/next
// links. render:false so no surface downloads any post's rendered html; each
// post page compiles only its own body (see posts/[slug].paths.ts).
export default createContentLoader(POSTS_GLOB, {
  // includeSrc is needed only so `transform` can compute readTime; src itself
  // is stripped before the payload leaves `transform`.
  includeSrc: true,
  render: false,
  transform: transformPosts,
});
