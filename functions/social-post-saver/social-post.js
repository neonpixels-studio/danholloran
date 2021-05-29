const { slugify } = require("./helpers");
const GitHubApi = require("./github-api");
const Instagram = require("./instagram");
const YouTube = require("./youtube");
const Twitter = require("./twitter");
const Goodreads = require("./goodreads");

module.exports = class SocialPost {
    constructor(requestBody) {
        this.requestBody = requestBody;
    }

    getService() {
        switch (this.requestBody.type) {
            case "instagram":
                return new Instagram(this.requestBody);
            case "youtube":
                return new YouTube(this.requestBody);
            case "twitter":
                return new Twitter(this.requestBody);
            case "goodreads":
                return new Goodreads(this.requestBody);
            default:
                return;
        }
    }

    convertFrontmatterData(frontmatter) {
        return Object.entries(frontmatter)
            .filter(([_key, value]) => value !== undefined && value !== "")
            .map(([key, value]) => {
                value = typeof value === "string" ? value.trim() : value;
                value = value.replace(/"/g, '\\\\"');
                return `${key}: "${value}"`;
            });
    }

    getContent() {
        const { body, frontmatter } = this.getService().getData();

        if (!frontmatter.slug) {
            frontmatter.slug = slugify(frontmatter.title);
        }

        return [
            "---",
            ...this.convertFrontmatterData(frontmatter),
            "---",
            "",
            body,
            ""
        ].join("\n");
    }

    getFilePath() {
        const { frontmatter } = this.getService().getData();
        const directory = this.getService().getDirectory();
        const slug = frontmatter.slug
            ? frontmatter.slug
            : slugify(frontmatter.title);

        return `${directory}/${slug}.md`;
    }

    getCommitMessage() {
        return `[Social Post Saver] ${this.getFilePath()}`;
    }

    async persist() {
        if (!this.getService()) {
            return {};
        }

        const response = await new GitHubApi().commitFile(
            this.getFilePath(),
            this.getContent(),
            this.getCommitMessage()
        );

        return {
            response,
            data: this.getService().getData()
        };
    }
};
