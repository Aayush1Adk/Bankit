const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
    
    fromAccount:{
        type: mongoose.Schema.Types.ObjectId,
        ref:"Account",
        required:[true,"Transaction much be associated with a from account"],
        index:true
    },
    toAccount:{
        type: mongoose.Schema.Types.ObjectId,
        ref:"Account",
        required:[true,"Transaction much be associated with a to account"],
        index:true
    },
    status:{
        type: String,
        enum:{
            values:["PENDING","COMPLETED","FAILED","REVERSED"],
            message:"Status must be either PENDING, COMPLETED, FAILED or REVERSED",
        },
        default:"PENDING"
    },
    amount:{
        type: Number,
        required:[true,"Amount is required for creating transaction"],
        min: [0, "Transaction amount cannot be negative"]
    },
    idempotencyKey:{
        type: String,
        required:[true,"Idempotency Key is required for creating Transaction"],
        index:true,
        unique:true
    }
},
{
    timestamps:true
})

const transactionModel = mongoose.model("transaction", transactionSchema)

module.exports = transactionModel