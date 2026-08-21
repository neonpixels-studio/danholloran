import {
  tagBasePagePaths,
  POSTS_WATCH_GLOB,
} from "../../.vitepress/theme/utils/archivePaths";

// Page 1 of each tag filter, e.g. /posts/tag/javascript.
export default {
  watch: [POSTS_WATCH_GLOB],
  paths() {
    return tagBasePagePaths();
  },
};
