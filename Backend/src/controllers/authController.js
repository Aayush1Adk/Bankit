const userModel = require("../models/user.model.js");
const jwt = require("jsonwebtoken");
const emailService = require("../services/email.service.js");

const TOKEN_TTL_DAYS = 3;

const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000
};

function isNonEmptyString(value) {
    return typeof value === "string" && value.trim().length > 0;
}

async function userRegister(req, res){

    const { email, password, name } = req.body;

    if(!isNonEmptyString(email) || !isNonEmptyString(password) || !isNonEmptyString(name)){
        return res.status(400).json({ message: "Email, password and name are required" });
    }

    if(password.length < 6){
        return res.status(400).json({ message: "Password must be at least 6 characters long" });
    }

    const ifExists = await userModel.findOne({ email: email });

    if(ifExists){
        return res.status(422).json({ message: "User already exists with this email",
            status: "failed"
            });
    }

    const newUser = await userModel.create({
        email: email,
        password: password,
        name: name
    })

    const token = jwt.sign({userId:newUser._id},process.env.JWT_SECRET,{expiresIn:`${TOKEN_TTL_DAYS}d`})

    res.cookie("token", token, cookieOptions)

    res.status(201).json({
        newUser:{
            _id:newUser._id,
            email:newUser.email,
            name:newUser.name
        }
    })

    await emailService.sendRegistrationEmail(newUser.email, newUser.name);
}


async function userLogin(req, res){

    const{email, password} = req.body

    if(!isNonEmptyString(email) || !isNonEmptyString(password)){
        return res.status(400).json({message:"Email and password are required"})
    }

    const user = await userModel.findOne({email}).select("+password")

    if(!user){
        return res.status(401).json({message:"Email and password is invalid"})
    }

    const isValidPassword = await user.comparePassword(password)

    if(!isValidPassword){
        return res.status(401).json({message:"Email and password is invalid"})
    }

    const token = jwt.sign({userId:user._id},process.env.JWT_SECRET,{expiresIn:`${TOKEN_TTL_DAYS}d`})
    res.cookie("token",token, cookieOptions)

        res.status(200).json({
        newUser:{
            _id:user._id,
            email:user.email,
            name:user.name
        }
    })

    await emailService.sendLoginEmail(user.email, user.name);


}

module.exports = { userRegister, userLogin }
