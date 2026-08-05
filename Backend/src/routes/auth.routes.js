const express = require("express");
const rateLimit = require("express-rate-limit");
const authController = require("../controllers/authController.js");

const router = express.Router();

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 10,
    standardHeaders: "draft-7",
    legacyHeaders: false,
    message: { message: "Too many attempts. Please try again later." }
});

router.post("/register", authLimiter, authController.userRegister);
router.post("/login", authLimiter, authController.userLogin)

module.exports = router;
