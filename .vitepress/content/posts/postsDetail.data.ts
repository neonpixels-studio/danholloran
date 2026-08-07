import { createContentLoader } from "vitepress";
import type { Post } from "@typedefs";
import { POSTS_GLOB, transformPosts } from "./transformPosts.ts";

declare const data: Post[];
export { data };

// Detail loader used only by posts/[slug].md, where PostView renders the post
// body via v-html. render:true so post html is available. VitePress emits one
// chunk per loader, so this carries every post's html and loads on every post
// detail page (not just the one being read); the win is that list surfaces
// (Home, blog index) use posts.data.ts (render:false) and ship no html at all.
// Running a second loader over the same glob reparses/re-renders the posts at
// build time — an accepted cost for keeping html off the list payload.
export default createContentLoader(POSTS_GLOB, {
  // includeSrc is needed only so `transform` can compute readTime; src itself
  // is stripped before the payload leaves `transform`.
  includeSrc: true,
  render: true,
  transform: transformPosts,
});
