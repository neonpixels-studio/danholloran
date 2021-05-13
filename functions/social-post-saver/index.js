const logError = console.error;
const crypto = require("crypto");
const slugify = require("slugify");

const getBody = ({ body }) => {
    try {
        return JSON.parse(body);
    } catch (error) {
        logError(error);
        return {};
    }
};

const validApiKey = key => key === process.env.API_KEY;

const handleInstagram = ({
    caption,
    type,
    url,
    sourceUrl,
    embedCode,
    createdAt
}) => {
    // @todo Handle video? Should this be a separate type?
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
};

const generatePageData = body => {
    switch (body.type) {
        case "instagram":
            return handleInstagram(body);

        default:
            return {};
    }
};

const persistPage = body => {
    const pageData = generatePageData(body);
    const fileName = generateFileName(pageData);

    // @todo Some how save the data to GitHub
};

const getDirectory = type => {
    switch (type) {
        case "instagram":
            return "_instagram";

        default:
            return "_social-post";
    }
};

const generateFileName = ({ frontmatter: { title, type } }) => {
    return `${getDirectory(type)}/${slugify(title, {
        lower: true,
        string: true,
        remove: /[^0-9a-zA-Z-\s]/gm
    })}.md`;
};

exports.handler = async function(event) {
    const body = getBody(event);

    if (Object.keys(body).length === 0) {
        return { statusCode: 404 };
    }

    if (!validApiKey(body.key)) {
        return { statusCode: 401 };
    }

    persistPage(body);

    return {
        statusCode: 200,
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            fileName: generateFileName(generatePageData(body)),
            message: "Post saved successfully!"
        })
    };
};
