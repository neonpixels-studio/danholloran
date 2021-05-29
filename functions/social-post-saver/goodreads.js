module.exports = class Instagram {
    constructor(requestBody) {
        this.requestBody = requestBody;
    }

    getDirectory() {
        return "source/_instagram";
    }

    getData() {
        const {
            type,
            shelf,
            title,
            url: sourceUrl,
            authorName,
            description,
            imageUrl,
            createdAt,
            feedTitle,
            feedUrl
        } = this.requestBody;

        return {
            frontmatter: {
                title,
                type,
                shelf,
                sourceUrl,
                authorName,
                imageUrl,
                createdAt,
                feedTitle,
                feedUrl,
                collectionName: "books"
            },
            body: description
        };
    }
};
