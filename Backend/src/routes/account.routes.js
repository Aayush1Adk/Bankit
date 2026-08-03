const express = require("express");

const authMiddleware = require("../middleware/authMiddleware.js");
const accountController = require("../controllers/accountController.js");
const router = express.Router();

router.post("/create-account", authMiddleware.authMiddleware, accountController.createAccount);




module.exports = router;