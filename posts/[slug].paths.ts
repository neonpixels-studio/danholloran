import fs from "node:fs";
import path from "node:path";

export default {
  watch: ["./.vitepress/content/posts/*.md"],
  paths() {
    return fs
      .readdirSync("./.vitepress/content/posts")
      .filter((file) => path.extname(file) === ".md")
      .map((file) => {
        return { params: { slug: path.parse(file).name } };
      });
  },
};
