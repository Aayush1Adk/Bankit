const mongoose = require("mongoose");
const ledgerModel = require("../models/ledger.model.js");

const accountSchema = new mongoose.Schema({
    user:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: [true, "User is required for account creation"],
        index: true // Create an index on the user field for faster queries
    },
    status:{
        type: String,
        enums:{
            values: ["active", "frozen", "closed"],
            message: `Status must be either 'active', 'frozen', or 'closed'`,
            }, 
            default: "active"
    },
        currency:{
            type: String,
            required: [true, "Currency is required for account creation"],
            default: "Rs.",
        },
},    
        {
            timestamps: true
        }
)

accountSchema.index({user: 1, status: 1}); // Compound index on user and status for faster queries


accountSchema.methods.getBalance = async function (){
    
    const balanceData = await ledgerModel.aggregate([
        {  $match:{  account: this._id   }  },
        {
            $group:{
                _id:null,
                totalDebit: {
                    $sum:{$cond:[{$ed: ["$type","DEBIT"]},
                "amount",0]}
                },
                totalCredit:{
                    $sum:{$cond:[{$ed: ["$type","CREDIT"]},
                "amount",0]}
                }
            },

        },
        {
            $project:{
                _id:0,
                balance:{$subtract:["$totalCredit","$totalDebit"]}
            }
        }
    ])

    if(balanceDate.length === 0){
        return 0;
    }

    return balanceData[0].balance
}


const accountModel = mongoose.model("Account", accountSchema);

module.exports = accountModel;