import useGithubApi from "./useGithubApi.js";
import slugify from "slugify";
import { join, basename } from "node:path";

export default ({ token, githubApi = undefined }) => {
  const { commitFile } = githubApi ?? useGithubApi({ token });

  const getFilePath = ({ group, title }) => {
    return join("content", group, `${slugify(title, { lower: true })}.md`);
  };

  const handleWebhook = async ({
    title,
    content,
    tags = [],
    metadata = {},
    published,
    group,
    created_at,
  }) => {
    const filePath = getFilePath({ group, title });
    const fileContent = [
      `===`,
      title === undefined ? undefined : `title: ${title}`,
      tags === undefined ? undefined : `tags: ${tags?.join(",")}`,
      published === undefined ? undefined : `published: ${published}`,
      created_at === undefined ? undefined : `created_at: ${created_at}`,
      Object.entries(metadata).map(([key, value]) => {
        return `${key}: ${value}`;
      }),
      "===",
      content,
    ]
      .filter((item) => !!item)
      .join("\n");

    return await commitFile({
      filePath,
      content: fileContent,
      message: `[Webhook Poster] ${group}/${basename(filePath)}`,
    });
  };

  return {
    handleWebhook,
  };
};
