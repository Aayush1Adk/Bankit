const express = require("express");
const helmet = require("helmet");
const cookiesParser = require("cookie-parser")
const authRoutes = require("./routes/auth.routes.js");
const accountRoutes = require("./routes/account.routes.js");


const app = express();

app.use(helmet());
app.use(cookiesParser())
app.use(express.json({ limit: "10kb" }));
app.use("/api/auth", authRoutes);
app.use("/api/account", accountRoutes);

app.use((err, req, res, next) => {
    console.error(err);

    if (err.name === "ValidationError") {
        return res.status(400).json({ message: "Invalid request data" });
    }

    res.status(500).json({ message: "Internal server error" });
});

module.exports = app
