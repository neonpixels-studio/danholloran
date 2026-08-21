import {
  topicBasePagePaths,
  POSTS_WATCH_GLOB,
} from "../../.vitepress/theme/utils/archivePaths";

// Page 1 of each topic filter, e.g. /posts/topic/development.
export default {
  watch: [POSTS_WATCH_GLOB],
  paths() {
    return topicBasePagePaths();
  },
};
