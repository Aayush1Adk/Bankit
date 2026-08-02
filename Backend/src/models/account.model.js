const mongoose = require("mongoose");

const accountSchema = new mongoose.Schema({
    user:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: [true, "User is required for account creation"]
    },
    status:{
        enums:{
            values: ["active", "frozen", "closed"],
            message: "Status must be either 'active', 'frozen', or 'closed'"
        }
    },
        currency:{
            type: String,
            required: [true, "Currency is required for account creation"],
            default: "RS",
        },
},    
        {
            timestamps: true
        }
)

const accountModel = mongoose.model("Account", accountSchema);

module.exports = accountModel;