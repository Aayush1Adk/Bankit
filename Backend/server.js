require("dotenv").config()
const connectDB = require("./src/config/db.js")
const app = require("./src/app.js");

connectDB();

app.listen(3000, ()=>{
    console.log("server is running on 3000");
})

