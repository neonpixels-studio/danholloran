#!/usr/bin/node

import { read } from "to-vfile";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkFrontmatter from "remark-frontmatter";
import remarkStringify from "remark-stringify";
import posts from "./posts/index.mjs";
import yaml from "js-yaml";
import { info, danger, success } from "./../shared/cli.mjs";

const readMarkdown = async (path) => {
  let frontmatter;
  const file = await unified()
    .use(remarkParse)
    .use(remarkStringify)
    .use(remarkFrontmatter, ["yaml"])
    .use(() => async (tree) => {
      frontmatter = await yaml.load(tree.children.shift()?.value ?? "");
    })
    .process(await read(path));
  console.log(frontmatter);
  // @todo https://www.datocms.com/docs/content-management-api/using-the-nodejs-clients
  return {
    frontmatter,
    content: String(file),
  };
};

// == Setup =============================================
info("Reading in ./data/posts/*.md files...");
const records = Promise.all(posts.map(readMarkdown));
console.log(records);
info("Creating records on Dato...");
// const
