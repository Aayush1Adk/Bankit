const userModel = require("../models/user.model.js");
const jwt = require("jsonwebtoken");
const emailService = require("../services/email.service.js");
const TokenBlackList = require("../models/blackList.model.js");


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

    const token = jwt.sign({userId:user._id, email:user.email},process.env.JWT_SECRET,{expiresIn:"3d"})
    res.cookie("token",token)

        res.status(200).json({
        newUser:{
            _id:user._id,
            email:user.email,
            name:user.name
        },
        token
    })

    await emailService.sendLoginEmail(user.email, user.name);
}

async function userLogout(req, res){

    const token = req.cookies.token || req.headers.authorization?.split(" ")[1];

    if(!token){
        return res.status(400).json({message:"User logout successfully"});
    }

    

    const logOut = await TokenBlackList.create({token:token});

    res.clearCookie("token")
    
    res.status(200).json({message:"User log out successfully"});
    }


module.exports = { userRegister, userLogin, userLogout };