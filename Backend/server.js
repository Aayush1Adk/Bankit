require("dotenv").config()
const connectDB = require("./src/config/db.js")
const app = require("./src/app.js");

const PORT = process.env.PORT || 3000;

process.on("unhandledRejection", error => {
    console.error("Unhandled promise rejection:", error);
});

process.on("uncaughtException", error => {
    console.error("Uncaught exception:", error);
    process.exit(1);
});

async function startServer(){
    await connectDB();

    const server = app.listen(PORT, ()=>{
        console.log(`server is running on ${PORT}`);
    })

    server.on("error", error => {
        console.error(`Failed to listen on port ${PORT}:`, error);
        process.exit(1);
    })
}

startServer().catch(error => {
    console.error("Failed to start server:", error);
    process.exit(1);
})
