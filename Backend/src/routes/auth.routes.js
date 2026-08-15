const express = require("express");
const authController = require("../controllers/authController.js");

const router = express.Router();

router.post("/register", authController.userRegister);
router.post("/login",authController.userLogin);
router.post("/logout", authController.userLogout);

module.exports = router;