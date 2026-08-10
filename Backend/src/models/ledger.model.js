const mongoose = require("mongoose");

const  ledgerSchema = new mongoose.Schema({
    account:{
        type: mongoose.Schema.Types.ObjectId,
        ref:"Account",
        required:[true, "Ledger must be associated with Account"],
        index:true,
        immutable:true
    },
    amount:{
        type:Number,
        required:[true, "Amount is required before creating Ledger entry"],
        immutable:true
    },
    transaction:{
        type: mongoose.Schema.Types.ObjectId,
        ref:"Transaction",
        required:[true, "Ledger must be associated with Transaction"],
        index:true,
        immutable:true
    },
    type:{
        type: String,
        enum:{
            values:["CREDIT","DEBIT"],
            message:"Type can be either DEBIT or CREDIT",
        },
        required:[true, "Ledger type is required"],
        immutable:true

    },
})

function preventLedgerModification() {
    throw new Error("Ledger entries are immutable and cannot be modified or deleted");
}

ledgerSchema.pre("findOneAndUpdate", preventLedgerModification);
ledgerSchema.pre("findOneAndDelete", preventLedgerModification);
ledgerSchema.pre("updateOne", preventLedgerModification);
ledgerSchema.pre("deleteOne", preventLedgerModification);
ledgerSchema.pre("remove", preventLedgerModification);
ledgerSchema.pre("deleteMany", preventLedgerModification);
ledgerSchema.pre("updateMany", preventLedgerModification);
ledgerSchema.pre("findOneAndReplace", preventLedgerModification)

const ledgerModel = mongoose.model("Ledger", ledgerSchema);

module.exports = ledgerModel;