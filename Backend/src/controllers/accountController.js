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

async function getAccountBalance(req, res){
    
    const{accountId} = req.params;

    const account = await accountModel.findOne({
        _id: accountId,
        user: req.user._id 
    })

    if(!account){
        return res.status(400).json({message:"Invalid account"})
    }

    const balance = await account.getBalance();

    res.status(200).json({
        accountId: account._id,
        balance: balance,
    })
}




module.exports = {createAccount, getAccounts, getAccountBalance}
