const express = require("express");
const cookiesParser = require("cookie-parser")
const authRoutes = require("./routes/auth.routes.js");
const accountRoutes = require("./routes/account.routes.js");
const transactionRoutes = require("./routes/transaction.routes.js");


const app = express();

app.use(cookiesParser())
app.use(express.json());


app.get("/", (req, res) => {
    res.send("Ledger Service is up and running")
})


app.use("/api/auth", authRoutes);
app.use("/api/account", accountRoutes);
app.use("/api/transaction", transactionRoutes);



module.exports = app