const userModel = register("../models/user.model.js");


function userRegister(req, res){

    const { email, password, name } = req.body;


}

module.exports = { userRegister }