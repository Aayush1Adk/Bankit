const mongoose = require("mongoose");


async function connectDB (){

    if(!process.env.MONGO_URI){
        throw new Error("MONGO_URI is not set");
    }

    await mongoose.connect(process.env.MONGO_URI);

    console.log("server is connected to DB");

    mongoose.connection.on("error", error => {
        console.error("Database connection error:", error);
    });
}

module.exports = connectDB
