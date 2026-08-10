const express = require("express");
const authMiddleware = require("../middleware/authMiddleware.js");
const transactionController = require("../controllers/transactionController.js");

const router = express.Router();

router.post("/", authMiddleware.authMiddleware, transactionController.createTransaction);

module.exports = router;