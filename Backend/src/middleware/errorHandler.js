const ApiError = require("../utils/ApiError.js");

function notFoundHandler(req, res, next) {
    next(new ApiError(404, `Route ${req.method} ${req.originalUrl} not found`));
}

function toApiError(error) {
    if (error instanceof ApiError) {
        return error;
    }

    if (error.name === "ValidationError") {
        const message = Object.values(error.errors)
            .map(validationError => validationError.message)
            .join(", ");
        return new ApiError(400, message || "Validation failed");
    }

    if (error.name === "CastError") {
        return new ApiError(400, `Invalid value for ${error.path}`);
    }

    if (error.code === 11000) {
        const field = Object.keys(error.keyValue || {}).join(", ");
        return new ApiError(409, field ? `${field} already exists` : "Duplicate value");
    }

    if (error.name === "TokenExpiredError") {
        return new ApiError(401, "Token expired.");
    }

    if (error.name === "JsonWebTokenError" || error.name === "NotBeforeError") {
        return new ApiError(401, "Invalid token.");
    }

    return new ApiError(500, "Internal server error");
}

function errorHandler(error, req, res, next) {
    const apiError = toApiError(error);

    if (apiError.statusCode >= 500) {
        console.error(`${req.method} ${req.originalUrl} failed:`, error);
    }

    if (res.headersSent) {
        return next(error);
    }

    res.status(apiError.statusCode).json({
        status: "failed",
        message: apiError.message
    });
}

module.exports = { notFoundHandler, errorHandler };
