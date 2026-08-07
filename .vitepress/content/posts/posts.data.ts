import { createContentLoader } from "vitepress";
import type { Post } from "@typedefs";
import { POSTS_GLOB, transformPosts } from "./transformPosts.ts";

declare const data: Post[];
export { data };

// List loader used by Home and the blog index. render:false so those list
// surfaces never download any post's rendered html; only the detail loader
// (postsDetail.data.ts) carries html, and only post detail pages import it.
export default createContentLoader(POSTS_GLOB, {
  // includeSrc is needed only so `transform` can compute readTime; src itself
  // is stripped before the payload leaves `transform`.
  includeSrc: true,
  render: false,
  transform: transformPosts,
});
