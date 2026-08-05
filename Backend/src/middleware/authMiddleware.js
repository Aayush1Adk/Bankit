const userModel = require('../models/user.model.js');
const jwt = require('jsonwebtoken');
const ApiError = require('../utils/ApiError.js');


async function authMiddleware(req, res, next) {

    const token = req.cookies.token || req.headers.authorization?.split(" ")[1];

    if (!token) {
        throw new ApiError(401, "Access denied. No token provided.");
    }

    let decoded;

    try {
        decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
        // Only token verification failures mean "unauthenticated"; anything else must propagate.
        throw new ApiError(401, "Invalid token.");
    }

    const user = await userModel.findById(decoded.userId);

    if (!user) {
        throw new ApiError(401, "Invalid token.");
    }

    req.user = user; // Attach the user object to the request for further use in the route handlers

    next();
}

module.exports = {authMiddleware};
