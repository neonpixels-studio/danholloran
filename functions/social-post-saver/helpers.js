const logError = console.error;

const validApiKey = key => key === process.env.API_KEY;

const getRequestBody = ({ body }) => {
    try {
        return JSON.parse(body);
    } catch (error) {
        logError(error);
        return {};
    }
};

const errorResponseNotFound = () => {
    return {
        statusCode: 404,
        headers: {
            "Content-Type": "application/json"
        }
    };
};

const errorResponseUnauthorized = () => {
    return {
        statusCode: 401,
        headers: {
            "Content-Type": "application/json"
        }
    };
};

const successResponse = (message = "Post saved successfully!") => {
    return {
        statusCode: 200,
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            message
        })
    };
};

module.exports = {
    logError,
    validApiKey,
    getRequestBody,
    errorResponseNotFound,
    errorResponseUnauthorized,
    successResponse
};
