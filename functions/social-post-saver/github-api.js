const { Octokit } = require("@octokit/core");
// /repos/{owner}/{repo}/git/commits/{commit_sha}

module.exports = class {
    // /repos/{owner}/{repo}/git/commits/{commit_sha}
    constructor(owner = "DHolloran", repo = "danholloran-me") {
        this.owner = owner;
        this.repo = repo;
        this.octokit = new Octokit({
            auth: process.env.GIT_HUB_PERSONAL_ACCESS_TOKEN
        });
    }

    async request(type, path, tokens) {
        return await this.octokit.request(`${type.toUpperCase()} ${path}`, {
            owner: this.owner,
            repo: this.repo,
            ...tokens
        });
    }
};
