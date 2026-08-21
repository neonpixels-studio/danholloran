import {
  tagExtraPagePaths,
  POSTS_WATCH_GLOB,
} from "../../../../.vitepress/theme/utils/archivePaths";

// Extra pages (2..N) of each tag filter, e.g. /posts/tag/javascript/page/2.
export default {
  watch: [POSTS_WATCH_GLOB],
  paths() {
    return tagExtraPagePaths();
  },
};
