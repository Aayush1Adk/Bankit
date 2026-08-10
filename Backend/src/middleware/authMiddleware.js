const userModel = require('../models/user.model.js');
const jwt = require('jsonwebtoken');


async function authMiddleware(req, res, next) {

    const token = req.cookies.token || req.headers.authorization?.split(" ")[1];

    if (!token) {
        return res.status(401).json({ message: "Access denied. No token provided." });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const user = await userModel.findById(decoded.userId);
        req.user = user; // Attach the user object to the request for further use in the route handlers
        
        next();
    } catch (error) {
        return res.status(400).json({ message: "Invalid token." });
    }
}

async function authSystemUserMiddleware( req, res, next) {

    const token = req.cookies.token || req.headers.authorization?.split(" ")[1];

    if(!token){
        return res.status(401).json({message:"Access denied. No token provided."});
    }

    try{
        const decoded = jwt.verify(token, process.env.JWT_SECRET);  

        const user = await userModel.findById(decoded.userId).select("+systemUser")

        if(!user.systemUser){
            return res.status(403).json({message:"Access denied. User is not a system user."});
        }

        req.user = user; // Attach the user object to the request for further use in the route handlers
        
        return next();
    }
    catch(err){
        return res.status(401).json({message:"Invalid token."});
    }
}



module.exports = {authMiddleware, authSystemUserMiddleware};