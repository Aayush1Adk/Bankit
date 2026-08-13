const accountModel = require('../models/account.model.js');

async function createAccount(req, res){

    const user = req.user; // Get the authenticated user from the request

    const newAccount = await accountModel.create({
        user: user._id,
    })

    res.status(201).json({newAccount})
}

async function getAccounts(req, res){
    const accounts = await accountModel.find({
        user: req.user._id
    })

    return res.status(200).json({accounts})
}





module.exports = {createAccount}
