module.exports = class YouTube {
    constructor(requestBody) {
        this.requestBody = requestBody;
    }

    getDirectory() {
        return "source/_youtube";
    }

    getData() {
        const {
            createdAt,
            title,
            description,
            type,
            url,
            authorName,
            embedCode
        } = this.requestBody;

        return {
            frontmatter: {
                title,
                description,
                url,
                type,
                createdAt,
                authorName,
                collectionName: "youtube"
            },
            body: embedCode
        };
    }
};
