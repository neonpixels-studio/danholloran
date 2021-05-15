module.exports = class Instagram {
    constructor(requestBody) {
        this.requestBody = requestBody;
    }

    getDirectory() {
        return "source/_instagram";
    }

    getData() {
        const {
            caption,
            type,
            url,
            sourceUrl,
            embedCode,
            createdAt,
            thumbnailUrl,
            mediaType
        } = this.requestBody;

        // @todo Handle videos?

        return {
            frontmatter: {
                title: `Instagram: ${createdAt}`,
                caption,
                url,
                sourceUrl,
                type,
                mediaType,
                collectionName: "instagram",
                thumbnailUrl: thumbnailUrl ? thumbnailUrl : ""
            },
            body: embedCode
        };
    }
};
