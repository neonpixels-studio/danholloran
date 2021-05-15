const slugify = require("slugify");
const GitHubApi = require("./github-api");
const Instagram = require("./instagram");

module.exports = class SocialPost {
    constructor(requestBody) {
        this.requestBody = requestBody;
    }

    getService() {
        switch (this.requestBody.type) {
            case "instagram":
                return new Instagram(this.requestBody);

            default:
                return class {
                    getDirectory() {
                        return "_social-post";
                    }

                    handle() {
                        return {};
                    }
                };
        }
    }

    convertFrontmatterData(frontmatter) {
        return Object.entries(frontmatter).map(([key, value]) => {
            return `${key}: "${value.replace(/"/g, '\\\\"')}"`;
        });
    }

    getContent() {
        const { body, frontmatter } = this.getService().getData();

        return [
            "---",
            ...this.convertFrontmatterData(frontmatter),
            "---",
            body,
            ""
        ].join("\n");
    }

    getFilePath() {
        const { frontmatter } = this.getService().getData();
        const directory = this.getService().getDirectory();
        const slug = slugify(frontmatter.title, {
            lower: true,
            string: true,
            remove: /[^0-9a-zA-Z-\s]/gm
        });

        return `${directory}/${slug}.md`;
    }

    getCommitMessage() {
        return `[Social Post Saver] ${this.getFilePath()}`;
    }

    async persist() {
        return await new GitHubApi().commitFile(
            this.getFilePath(),
            this.getContent(),
            this.getCommitMessage()
        );
    }
};
