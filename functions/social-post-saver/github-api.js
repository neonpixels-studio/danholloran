const { Octokit } = require("@octokit/core");
// /repos/{owner}/{repo}/git/commits/{commit_sha}

module.exports = class {
    constructor(
        branch = "main",
        repo = "social-post-saver-gh-test",
        owner = "DHolloran"
    ) {
        this.owner = owner;
        this.repo = repo;
        this.branch = branch;
        this.octokit = new Octokit({
            auth: process.env.GITHUB_PERSONAL_ACCESS_TOKEN
        });
    }

    /**
     * Sends a request request to the github API.
     */
    async request(type, path, parameters) {
        return await this.octokit.request(`${type.toUpperCase()} ${path}`, {
            owner: this.owner,
            repo: this.repo,
            ref: `heads/${this.branch}`,
            accept: "application/vnd.github.v3+json",
            ...parameters
        });
    }

    /**
     * Sends a POST request to the github API.
     */
    async post(path, parameters) {
        return this.request("post", path, parameters);
    }

    /**
     * Sends a GET request to the github API.
     */
    async get(path, parameters) {
        return this.request("get", path, parameters);
    }

    /**
     * Sends a PATCH request to the github API.
     */
    async patch(path, parameters) {
        return this.request("patch", path, parameters);
    }

    /**
     * Sends a PUT request to the github API.
     */
    async put(path, parameters) {
        return this.request("put", path, parameters);
    }

    /**
     * Sends a DELETE request to the github API.
     */
    async delete(path, parameters) {
        return this.request("delete", path, parameters);
    }

    /**
     * Creates a GitHub file tree
     *
     * @see https://docs.github.com/en/rest/reference/git#create-a-tree
     */
    async createNewFileTree(filePath, content) {
        return await this.post("/repos/{owner}/{repo}/git/trees", {
            tree: [
                {
                    path: filePath,
                    mode: "100644",
                    type: "blob",
                    content
                }
            ]
        });
    }

    /**
     * Retrieves the most recent commit.
     *
     * @see https://docs.github.com/en/rest/reference/git#get-a-reference
     */
    async getMostRecentCommit() {
        return await this.get("/repos/{owner}/{repo}/commits/{ref}");
    }

    /**
     * Creates a new commit.
     *
     * @see https://docs.github.com/en/rest/reference/git#create-a-commit
     */
    async createNewCommit(message, treeSha, parentSha) {
        return await this.post("/repos/{owner}/{repo}/git/commits", {
            message,
            tree: treeSha,
            parents: [parentSha]
        });
    }

    /**
     * Updates the most recent commit.
     *
     * @see https://docs.github.com/en/rest/reference/git#update-a-reference
     */
    async updateMostRecentCommit(commitSha) {
        // @todo How do you not overwrite all of the files?
        return this.patch("/repos/{owner}/{repo}/git/refs/{ref}", {
            sha: commitSha,
            force: true
        });
    }

    /**
     * Commits a file.
     */
    async commitFile(filePath, content, message) {
        const fileTree = await this.createNewFileTree(filePath, content);
        const mostRecentCommit = await this.getMostRecentCommit();
        const newCommit = await this.createNewCommit(
            message,
            fileTree.data.sha,
            mostRecentCommit.data.sha
        );
        return await this.updateMostRecentCommit(newCommit.data.sha);
    }
};
