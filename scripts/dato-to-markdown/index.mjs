#!/usr/bin/node

import fs, { existsSync } from "fs";
import { getModels } from "./dato.mjs";
import { cwd } from "process";
import { join } from "path";
import { info, danger, success } from "./cli.mjs";
import YAML from "json-to-pretty-yaml";

const { posts, site } = await getModels();
const { mkdir, writeFile } = fs.promises;

const getFullPath = (path) => {
  return join(cwd(), "./data/", path);
};

const writeJson = async ({ data, path } = { data, path }) => {
  try {
    await writeFile(getFullPath(path), JSON.stringify(data, null, 2));
  } catch (error) {
    danger(error);
    reject();
  }
};

const writeMarkdown = async ({ data, path } = { data, path }) => {
  const { content } = data;
  const frontmatter = { ...data };
  delete frontmatter.content;

  const markdown = [
    "---",
    YAML.stringify(frontmatter).trim(),
    "---",
    content,
  ].join("\n");
  try {
    await writeFile(getFullPath(path), markdown);
  } catch (error) {
    danger(error);
  }
};

const maybeMakeDirectory = async (path) => {
  const directory = getFullPath(path);
  if (existsSync(directory)) {
    return;
  }

  try {
    await mkdir(directory);
  } catch (_error) {
    // Left intentionally empty
  }
};

const writeSiteConfig = async (data) => {
  if (!data) {
    return;
  }

  info(`Writing Site Configuration...`);
  await writeJson({
    data,
    path: "site.json",
  });
  success("Writing Site Configuration complete");
};

const writeModels = async (
  { models = [], modelName, path } = { models, modelName, path }
) => {
  if (models?.length < 1) {
    return;
  }

  info(`Writing ${modelName} models...`);

  await maybeMakeDirectory(path);
  await Promise.all(
    posts.map(async (data) => {
      return await writeMarkdown({
        data,
        path: join(path, `${data.slug}.md`),
      });
    })
  );

  success(`Writing ${modelName} models complete...`);
};

await writeSiteConfig(site);
await writeModels({ models: posts, path: "posts" });
