const transactionModel = require("../models/transaction.model.js");
const ledgerModel = require("../models/ledger.model.js");
const accountModel = require("../models/account.model.js");
const emailService = require('../services/email.service.js');
const mongoose = require("mongoose");

async function createTransaction(req,res){
    const { fromAccount, toAccount, amount, idempotencyKey } = req.body;

    if(!fromAccount || toAccount || amount || idempotencyKey){
        return res.status(422).json({message:"fromAccount, toAccount, amount and idempotencyKey are required"});
    }

    const fromUserAccount = await accountModel.findOne({
        _id: fromAccount,
    });

    const toUserAccount = await accountModel.findOne({
        _id: toAccount,
    });

    if(!fromUserAccount || !toUserAccount){
        return res.status(400).json({message:"Invalid from or to account"});
    }
    


    const isTransactionAlreadyExists = await transactionModel.findOne({
        idempotencyKey: idempotencyKey
    })

    if(isTransactionAlreadyExists.status === "COMPLETED"){
        return res.status(201).json({message:"Transaction already exists"});
    }

    if(isTransactionAlreadyExists.status ==="PENDING"){
        return res.status(201).json({message:"Transaction is still processing"});
    }

    if(isTransactionAlreadyExists.status === "FAILED"){
        return res.status(201).json({message:"Transaction failed"});
    }
    if(isTransactionAlreadyExists.status === "REVERSED"){
        return res.status(201).json({message:"Transaction reversed"});
    }



    if(fromUserAccount.status !== "active"|| toUserAccount.status !== "active"){
        return res.status(400).json({message:"Both accounts must be active to process transaction"});
    }

    const balance = await fromUserAccount.getBalance()

    if(balance<amount){
        return res.status(400).json({message: `Insufficient balance. Current balance is ${balance}. Requested amount is ${amount}`});
    }
    

    const session = await mongoose.startSession()

    session.startTransaction() 
    // this means that all operations in this block will be executed in a single transaction

    const transaction = await transactionModel.create({
        fromAccount,
        toAccount,
        amount,
        idempotencyKey,
        status:"PENDING"},
        {session})

        const debitLedgerEntry = await ledgerModel.create({
            account: fromAccount,
            amount: amount,
            transaction: transaction._id,
            type:"DEBIT",
        },
    {session})

        const creditLedgerEntry = await ledgerModel.create({
            account: toAccount,
            amount: amount,
            transaction: transaction._id,
            type:"CREDIT",
        },
    {session})

    transaction.status = "COMPLETED"
    await transaction.save({session})

    await session.commitTransaction()
    session.endSession()
}



