const accountModel = require('../models/accountModel.js');

async function createAccount(req, res){

    const user = req.user; // Get the authenticated user from the request

    const newAccount = await accountModel.create({
        user: user._id,
    })

    res.status(201).json({newAccount})


}

module.exports = {createAccount}
