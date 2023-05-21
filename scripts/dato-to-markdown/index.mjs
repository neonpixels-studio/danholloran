#!/usr/bin/node

import fs, { existsSync } from "fs";
import { getModels } from "./dato.mjs";
import { cwd } from "process";
import { join } from "path";
import { info, danger, success } from "./cli.mjs";
import YAML from "json-to-pretty-yaml";
import { DateTime } from "luxon";

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
  const { content, publishedAt } = data;
  const frontmatter = {
    ...data,
    date: new DateTime(publishedAt).toFormat("MM-dd-yyyy"),
    published: true,
  };
  delete frontmatter.content;
  delete frontmatter.id;

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
    models.map(async (data) => {
      return await writeMarkdown({
        data,
        path: join(path, `${data.slug}.md`),
      });
    })
  );
};

// == Start ===========================
try {
  const models = await getModels();
  await writeSiteConfig(models.site);
  await writeModels({ models: models.posts, path: "posts", modelName: "Post" });
  success("Dato to Markdown completed!");
} catch (error) {
  danger(error);
}
