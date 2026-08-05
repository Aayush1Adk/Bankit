const mongoose = require("mongoose");
const ledgerModel = require("../../src/models/ledger.model.js");

function newEntry(overrides = {}) {
  return new ledgerModel({
    account: new mongoose.Types.ObjectId(),
    amount: 250,
    transaction: new mongoose.Types.ObjectId(),
    type: "CREDIT",
    ...overrides,
  });
}

describe("ledger schema validation", () => {
  it("accepts a well formed entry", () => {
    expect(newEntry().validateSync()).toBeUndefined();
  });

  it("requires account, amount, transaction and type", () => {
    const errors = new ledgerModel({}).validateSync().errors;

    expect(errors.account.message).toBe("Ledger must be associated with Account");
    expect(errors.amount.message).toBe("Amount is required before creating Ledger entry");
    expect(errors.transaction.message).toBe("Ledger must be associated with Transaction");
    expect(errors.type.message).toBe("Ledger type is required");
  });

  it.each(["CREDIT", "DEBIT"])("accepts the %s type", (type) => {
    expect(newEntry({ type }).validateSync()).toBeUndefined();
  });

  it("rejects an unknown type", () => {
    const errors = newEntry({ type: "TRANSFER" }).validateSync().errors;

    expect(errors.type.message).toBe("Type can be either DEBIT or CREDIT");
  });

  it("marks every field as immutable", () => {
    for (const field of ["account", "amount", "transaction", "type"]) {
      expect(ledgerModel.schema.path(field).options.immutable).toBe(true);
    }
  });
});

describe("ledger immutability hooks", () => {
  const guardedQueryHooks = [
    "findOneAndUpdate",
    "findOneAndDelete",
    "updateOne",
    "deleteOne",
    "deleteMany",
    "updateMany",
    "findOneAndReplace",
  ];

  it.each(guardedQueryHooks)("blocks %s", async (hook) => {
    const query = ledgerModel[hook]({ _id: new mongoose.Types.ObjectId() }, { amount: 1 });

    await expect(query.exec()).rejects.toThrow(
      "Ledger function are immutable and cannot be modified and delete"
    );
  });
});
