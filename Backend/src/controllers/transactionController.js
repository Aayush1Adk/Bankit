const transactionModel = require("../models/transaction.model.js");
const ledgerModel = require("../models/ledger.model.js");
const accountModel = require("../models/account.model.js");
const emailService = require('../services/email.service.js');
const mongoose = require("mongoose");

async function createTransaction(req,res){
    const { fromAccount, toAccount, amount, idempotencyKey } = req.body;

    if(!fromAccount || !toAccount || !amount || !idempotencyKey){
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

    if(isTransactionAlreadyExists){
        if(isTransactionAlreadyExists.status === "COMPLETED"){
            return res.status(201).json({message: "Transaction already processed",
                transaction: isTransactionAlreadyExists});
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
    }



    if(fromUserAccount.status !== "active"|| toUserAccount.status !== "active"){
        return res.status(400).json({message:"Both accounts must be active to process transaction"});
    }

    const balance = await fromUserAccount.getBalance()

    if(balance<amount){
        return res.status(400).json({message: `Insufficient balance. Current balance is ${balance}. Requested amount is ${amount}`});
    }

    try{
    
//Open a new database "session" (a temporary workspace window for MongoDB)
    const session = await mongoose.startSession()

 //Begin the transaction inside this session.
// Everything marked with { session } after this line will be held in a draft state.

    session.startTransaction() 
    // this means that either all write operations succeed, or none of them do, and if one of them does, the transaction is rolled back

    //Create a new transaction record set to "PENDING"
    // We wrap the object in an array [...] so Mongoose correctly attaches the { session } option.
    const transaction = await transactionModel.create([{
        fromAccount,
        toAccount,
        amount,
        idempotencyKey,
        status:"PENDING"} ],
        {session}) // Tell MongoDB: "Do not save this publicly yet, keep it inside our draft session"

        const debitLedgerEntry = await ledgerModel.create([{
            account: fromAccount,
            amount: amount,
            transaction: transaction._id,  // Link this ledger entry to the transaction record above
            type:"DEBIT",
        }],
    {session})

        const creditLedgerEntry = await ledgerModel.create([{
            account: toAccount,
            amount: amount,
            transaction: transaction._id,
            type:"CREDIT",
        }],
    {session})

    await transactionModel.findOneAndUpdate(
        {_id: transaction._id}, {status:"COMPLETED"},{session})

    await session.commitTransaction()
    session.endSession()
    }
    catch(err){
        return res.status(400).json({message:"Transaction is pending due to some issue, please try again later"});
    } 
    
    await emailService.sendTransactionEmail(req.user.email, req.user.name, amount, toAccount)

    return res.status(201).json({message:"Transaction created successfully!",
        transaction: transaction 
    });
}
    async function createInitialFundsTransaction(req, res){

        const { toAccount, amount, idempotencyKey} = req.body;

        if(!toAccount || !amount || !idempotencyKey){
            return res.status(422).json({message:"toAccount, amount and idempotencyKey are required"});
        }

        const toAccountUser = await accountModel.findOne({
            _id: toAccount,
        })

        if(!toAccountUser){
            return res.status(400).json({message:"Invalid to account"});
        }

        const fromAccount = await accountModel.findOne({
            user: req.user._id,
        })

        if(!fromAccount){
            return res.status(400).json({message:"Invalid from account, you are not a system user"});
        }

        const session = await mongoose.startSession()

        session.startTransaction()

        const transaction = new transactionModel({
            fromAccount: fromAccount._id,
            toAccount,
            amount,
            idempotencyKey,
            status:"PENDING",
        })

        const debitLedgerEntry = await ledgerModel.create([{
            account: fromAccount._id,
            amount: amount,
            transaction:transaction._id,
            type:"DEBIT",
        }],
    {session})

        const creditLedgerEntry = await ledgerModel.create([{
            account: toAccount,
            amount: amount,
            transaction: transaction._id,
            type:"CREDIT",
        }],  
        {session})

        transaction.status = "COMPLETED";
        await transaction.save({session});

        await session.commitTransaction();
        session.endSession();

        return res.status(201).json({message:"Transaction created successfully!",
        transaction: transaction 
        });

    }





module.exports = {createTransaction, createInitialFundsTransaction}



