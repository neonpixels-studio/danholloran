module.exports = class Twitter {
    constructor(requestBody) {
        this.requestBody = requestBody;
    }

    getDirectory() {
        return "source/_twitter";
    }

    getData() {
        const {
            text,
            createdAt,
            type,
            url,
            username,
            embedCode
        } = this.requestBody;

        return {
            frontmatter: {
                title: `Twitter: ${createdAt}`,
                text,
                createdAt,
                type,
                url,
                username,
                collectionName: "twitter"
            },
            body: embedCode
        };
    }
};
