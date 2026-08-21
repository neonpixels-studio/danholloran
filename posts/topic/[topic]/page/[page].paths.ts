import {
  topicExtraPagePaths,
  POSTS_WATCH_GLOB,
} from "../../../../.vitepress/theme/utils/archivePaths";

// Extra pages (2..N) of each topic filter, e.g. /posts/topic/development/page/2.
export default {
  watch: [POSTS_WATCH_GLOB],
  paths() {
    return topicExtraPagePaths();
  },
};
