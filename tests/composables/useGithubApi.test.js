import { expect, test, describe, vi } from "vitest";
import useGithubApi from "@/composables/useGithubApi.js";

describe("useGithubApi", () => {
  describe("commitFile", () => {
    test("commits the file", async () => {
      const expectedOwner = "owner";
      const expectedBranch = "branch";
      const expectedRepo = "repo";
      const expectedResponse = { test: true };
      const expectedContent = "Content";
      const expectedFilePath = "posts/my-awesome-post.md";
      const expectedMessage = "Commit message";
      const octokit = {
        createOrUpdateTextFile: vi.fn().mockResolvedValue(expectedResponse),
      };

      const { commitFile } = useGithubApi({
        token: "token",
        owner: expectedOwner,
        repo: expectedRepo,
        octokit,
        branch: expectedBranch,
      });

      const response = await commitFile({
        filePath: expectedFilePath,
        content: expectedContent,
        message: expectedMessage,
      });

      expect(response).toMatchObject(expectedResponse);
      expect(octokit.createOrUpdateTextFile).toHaveBeenCalledWith({
        owner: expectedOwner,
        repo: expectedRepo,
        branch: expectedBranch,
        path: expectedFilePath,
        content: expectedContent,
        message: expectedMessage,
      });
    });

    test("handle errors", async () => {
      const expectedOwner = "owner";
      const expectedBranch = "branch";
      const expectedRepo = "repo";
      const expectedContent = "Content";
      const expectedFilePath = "fixtures/post.md";
      const expectedMessage = "Commit message";
      const octokit = {
        createOrUpdateTextFile: vi.fn().mockRejectedValue(),
      };

      const { commitFile } = useGithubApi({
        token: "token",
        owner: expectedOwner,
        repo: expectedRepo,
        octokit,
        branch: expectedBranch,
      });

      const response = await commitFile({
        filePath: expectedFilePath,
        content: expectedContent,
        message: expectedMessage,
      });

      expect(response).toBeNull();
    });
  });
});
