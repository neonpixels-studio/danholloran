const { Octokit } = require("@octokit/core");
// /repos/{owner}/{repo}/git/commits/{commit_sha}

module.exports = class {
    constructor(
        branch = "master",
        repo = "danholloran-me",
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
            branch: this.branch,
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
     * Gets a file.
     *
     * @see https://docs.github.com/en/rest/reference/repos#get-repository-content
     */
    async getFile(filePath) {
        try {
            const file = await this.get(
                "/repos/{owner}/{repo}/contents/{path}",
                {
                    path: filePath
                }
            );
            return file;
        } catch (error) {
            return {};
        }
    }

    /**
     * Commits a file.
     *
     * @see https://docs.github.com/en/rest/reference/repos#create-or-update-file-contents
     */
    async commitFile(filePath, content, message) {
        const file = await this.getFile(filePath);

        await this.put("/repos/{owner}/{repo}/contents/{path}", {
            path: filePath,
            message,
            sha: file.data ? file.data.sha : undefined,
            content: Buffer.from(content).toString("base64")
        });
    }
};
