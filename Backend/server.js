require("dotenv").config()
const connectDB = require("./src/config/db.js")
const app = require("./src/app.js");

const requiredEnv = ["MONGO_URI", "JWT_SECRET"];
const missingEnv = requiredEnv.filter(name => !process.env[name]);

if (missingEnv.length > 0) {
    console.error(`Missing required environment variables: ${missingEnv.join(", ")}`);
    process.exit(1);
}

connectDB();

const port = process.env.PORT || 3000;

app.listen(port, ()=>{
    console.log(`server is running on ${port}`);
})
