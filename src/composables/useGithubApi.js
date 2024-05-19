import { Octokit } from "@octokit/core";
import { createOrUpdateTextFile } from "@octokit/plugin-create-or-update-text-file";

export default ({
  token,
  owner = "dholloran",
  repo = "danholloran-me",
  octokit = undefined,
  branch = "master",
}) => {
  const MyOctokit = Octokit.plugin(createOrUpdateTextFile);
  octokit = octokit ?? new MyOctokit({ auth: token });

  const commitFile = async ({ filePath, content, message }) => {
    try {
      return await octokit.createOrUpdateTextFile({
        owner,
        repo,
        path: filePath,
        content,
        message,
        branch,
      });
    } catch (_error) {
      return null;
    }
  };

  const githubApi = {
    commitFile,
  };

  return githubApi;
};
