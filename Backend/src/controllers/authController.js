const userModel = require("../models/user.model.js");
const emailService = require("../services/email.service.js");
const { signAuthToken, sendAuthResponse } = require("../utils/auth.util.js");


async function userRegister(req, res){

    const { email, password, name } = req.body;

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

    const token = signAuthToken(newUser._id);

    sendAuthResponse(res, 201, newUser, token);

    await emailService.sendRegistrationEmail(newUser.email, newUser.name);
}


async function userLogin(req, res){

    const{email, password} = req.body

    const user = await userModel.findOne({email}).select("+password")

    if(!user){
        return res.status(401).json({message:"Email and password is invalid"})
    }

    const isValidPassword = await user.comparePassword(password)

    if(!isValidPassword){
        return res.status(401).json({message:"Email and password is invalid"})
    }

    const token = signAuthToken(user._id);

    sendAuthResponse(res, 200, user, token);

    await emailService.sendLoginEmail(user.email, user.name);


}

module.exports = { userRegister, userLogin }
