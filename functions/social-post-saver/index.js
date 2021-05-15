const logError = console.error;
const slugify = require("slugify");
const GitHubApi = require("./github-api");

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

const pageContent = body => {
    const pageData = generatePageData(body);
    const frontmatter = Object.entries(pageData.frontmatter).map(
        ([key, value]) => {
            return `${key}: "${value.replace(/"/g, '\\\\"')}"`;
        }
    );

    return ["---", ...frontmatter, "---", pageData.body, ""].join("\n");
};

const persistPage = async body => {
    const filePath = generateFilePath(body);

    return await new GitHubApi().commitFile(
        filePath,
        pageContent(body),
        `[Social Post Saver] ${filePath}`
    );
};

// class SocialPage {
//     persist() {

//     }
// }

const getDirectory = type => {
    switch (type) {
        case "instagram":
            return "_instagram";

        default:
            return "_social-post";
    }
};

const generateFilePath = body => {
    const {
        frontmatter: { title, type }
    } = generatePageData(body);
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

    await persistPage(body);

    return {
        statusCode: 200,
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            filePath: generateFilePath(body),
            content: pageContent(body),
            message: "Post saved successfully!"
        })
    };
};
