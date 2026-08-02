const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    email:{
        type: String,
        required: [true, "Email is required For Registration"],
        trim: true,
        lowercase: true,
        unique: [true, "Email already exists"],
        match: [/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/, "Please fill a valid email address"]
    },
    name:{
        type: String,
        required: [true, "Name is required For Registration"],
        trim: true,
    },
    password:{
        type: String,
        required: [true, "Password is required For Registration"],
        minlength: [6, "Password must be at least 6 characters long"],
        select: false // This will prevent the password from being returned in queries by default
    }
},
{
    timestamps: true
});

userSchema.pre('save', async function(next) {

    if(!this.isModified("password")) {
        return ;
    }

    const hash = await bcrypt.hash(this.password, 10);
    this.password = hash;
    return ;
})

userSchema.methods.comparePassword = async function (password) {

    console.log(password, this.password)

    return await bcrypt.compare(password, this.password)

}

const userModel = mongoose.model('User', userSchema);

module.exports = userModel;