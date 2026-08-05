const mongoose = require("mongoose");
const accountModel = require("../../src/models/account.model.js");

describe("account schema validation", () => {
  it("requires a user reference", () => {
    const errors = new accountModel({}).validateSync().errors;

    expect(errors.user.message).toBe("User is required for account creation");
  });

  it("defaults new accounts to an active status in RS", () => {
    const account = new accountModel({ user: new mongoose.Types.ObjectId() });

    expect(account.validateSync()).toBeUndefined();
    expect(account.status).toBe("active");
    expect(account.currency).toBe("RS");
  });

  it("casts a user id string to an ObjectId", () => {
    const id = new mongoose.Types.ObjectId();
    const account = new accountModel({ user: id.toString() });

    expect(account.user).toBeInstanceOf(mongoose.Types.ObjectId);
    expect(account.user.toString()).toBe(id.toString());
  });

  it("rejects a user id that is not a valid ObjectId", () => {
    const errors = new accountModel({ user: "not-an-object-id" }).validateSync().errors;

    expect(errors.user.name).toBe("CastError");
  });

  it("indexes user and the user/status pair", () => {
    const indexed = accountModel.schema.indexes().map(([fields]) => fields);

    expect(indexed).toContainEqual({ user: 1 });
    expect(indexed).toContainEqual({ user: 1, status: 1 });
  });

  it("timestamps documents", () => {
    expect(accountModel.schema.options.timestamps).toBe(true);
  });
});
