module.exports = class Instagram {
    constructor(requestBody) {
        this.requestBody = requestBody;
    }

    getDirectory() {
        return "_instagram";
    }

    getData() {
        const {
            caption,
            type,
            url,
            sourceUrl,
            embedCode,
            createdAt
        } = this.requestBody;

        // @todo Handle videos?

        return {
            frontmatter: {
                title: `Instagram: ${createdAt}`,
                caption,
                url,
                sourceUrl,
                type
            },
            body: embedCode
        };
    }
};
