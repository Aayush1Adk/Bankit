const jwt = require("jsonwebtoken");

const TOKEN_EXPIRY = "3d";

function signAuthToken(userId) {
    return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: TOKEN_EXPIRY });
}

function verifyAuthToken(token) {
    return jwt.verify(token, process.env.JWT_SECRET);
}

function formatUserResponse(user) {
    return {
        _id: user._id,
        email: user.email,
        name: user.name,
    };
}

function sendAuthResponse(res, statusCode, user, token) {
    res.cookie("token", token);

    return res.status(statusCode).json({
        newUser: formatUserResponse(user),
        token,
    });
}

module.exports = { signAuthToken, verifyAuthToken, formatUserResponse, sendAuthResponse };
