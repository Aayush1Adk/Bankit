const mongoose = require("mongoose");


function connectDB (){

    mongoose.connect(process.env.MONGO_URI)
    .then(()=>{
        console.log("server is connected to DB")
    })
    .catch(err=>{
        console.log("DATABASE's error");
        process.exit(1) 
    })
}

module.exports = connectDB