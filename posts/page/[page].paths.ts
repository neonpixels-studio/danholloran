import {
  allExtraPagePaths,
  POSTS_WATCH_GLOB,
} from "../../.vitepress/theme/utils/archivePaths";

// Extra pages (2..N) of the unfiltered archive. Page 1 is served by
// posts/index.md, so it is intentionally absent here.
export default {
  watch: [POSTS_WATCH_GLOB],
  paths() {
    return allExtraPagePaths();
  },
};
