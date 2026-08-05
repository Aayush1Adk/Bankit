const mongoose = require("mongoose");
const transactionModel = require("../../src/models/transaction.model.js");

function newTransaction(overrides = {}) {
  return new transactionModel({
    fromAccount: new mongoose.Types.ObjectId(),
    toAccount: new mongoose.Types.ObjectId(),
    amount: 100,
    idempotencyKey: "key-1",
    ...overrides,
  });
}

describe("transaction schema validation", () => {
  it("accepts a well formed transaction and defaults it to PENDING", () => {
    const transaction = newTransaction();

    expect(transaction.validateSync()).toBeUndefined();
    expect(transaction.status).toBe("PENDING");
  });

  it("requires both accounts, an amount and an idempotency key", () => {
    const errors = new transactionModel({}).validateSync().errors;

    expect(errors.fromAccount.message).toBe("Transaction much be associated with a from account");
    expect(errors.toAccount.message).toBe("Transaction much be associated with a to account");
    expect(errors.amount.message).toBe("Amount is required for creating transaction");
    expect(errors.idempotencyKey.message).toBe("Idempotency Key is required for creating Transaction");
  });

  it("rejects a negative amount", () => {
    const errors = newTransaction({ amount: -1 }).validateSync().errors;

    expect(errors.amount.message).toBe("Transaction amount cannot be negative");
  });

  it("allows a zero amount", () => {
    expect(newTransaction({ amount: 0 }).validateSync()).toBeUndefined();
  });

  it.each(["PENDING", "COMPLETED", "FAILED", "REVERSED"])("accepts the %s status", (status) => {
    expect(newTransaction({ status }).validateSync()).toBeUndefined();
  });

  it("rejects an unknown status", () => {
    const errors = newTransaction({ status: "CANCELLED" }).validateSync().errors;

    expect(errors.status.message).toBe("Status must be either PENDING, COMPLETED, FAILED or REVERSED");
  });

  it("requires the idempotency key to be unique", () => {
    expect(transactionModel.schema.path("idempotencyKey").options.unique).toBe(true);
  });
});
