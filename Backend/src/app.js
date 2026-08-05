const express = require("express");
const cookiesParser = require("cookie-parser")
const authRoutes = require("./routes/auth.routes.js");
const accountRoutes = require("./routes/account.routes.js");
const { notFoundHandler, errorHandler } = require("./middleware/errorHandler.js");


const app = express();

app.use(cookiesParser())
app.use(express.json());
app.use("/api/auth", authRoutes);
app.use("/api/account", accountRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app
