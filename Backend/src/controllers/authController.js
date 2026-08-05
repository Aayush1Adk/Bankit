const userModel = require("../models/user.model.js");
const jwt = require("jsonwebtoken");
const emailService = require("../services/email.service.js");
const ApiError = require("../utils/ApiError.js");


async function userRegister(req, res){

    const { email, password, name } = req.body;

    const ifExists = await userModel.findOne({ email: email });

    if(ifExists){
        throw new ApiError(422, "User already exists with this email");
    }

    const newUser = await userModel.create({
        email: email,
        password: password,
        name: name
    })

    const token = jwt.sign({userId:newUser._id},process.env.JWT_SECRET,{expiresIn:"3d"})

    res.cookie("token", token)

    res.status(201).json({
        newUser:{
            _id:newUser._id,
            email:newUser.email,
            name:newUser.name
        },
        token
    })

    // Notification failures must not fail an already successful registration.
    emailService.sendRegistrationEmail(newUser.email, newUser.name)
        .catch(error => console.error(`Failed to send registration email to ${newUser.email}:`, error));
}


async function userLogin(req, res){

    const{email, password} = req.body

    if(!email || !password){
        throw new ApiError(400, "Email and password are required");
    }

    const user = await userModel.findOne({email}).select("+password")

    if(!user){
        throw new ApiError(401, "Email and password is invalid");
    }

    const isValidPassword = await user.comparePassword(password)

    if(!isValidPassword){
        throw new ApiError(401, "Email and password is invalid");
    }

    const token = jwt.sign({userId:user._id},process.env.JWT_SECRET,{expiresIn:"3d"})
    res.cookie("token",token)

        res.status(200).json({
        newUser:{
            _id:user._id,
            email:user.email,
            name:user.name
        },
        token
    })

    // Notification failures must not fail an already successful login.
    emailService.sendLoginEmail(user.email, user.name)
        .catch(error => console.error(`Failed to send login email to ${user.email}:`, error));
}

module.exports = { userRegister, userLogin }
