const {
    getRequestBody,
    validApiKey,
    errorResponseNotFound,
    errorResponseUnauthorized,
    successResponse
} = require("./helpers");
const SocialPost = require("./social-post");

exports.handler = async function(event) {
    const requestBody = getRequestBody(event);

    if (Object.keys(requestBody).length === 0) {
        return errorResponseNotFound();
    }

    if (!validApiKey(requestBody.key)) {
        return errorResponseUnauthorized();
    }

    await new SocialPost(requestBody).persist();

    return successResponse();
};
