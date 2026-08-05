jest.mock("../../src/models/account.model.js");

const accountModel = require("../../src/models/account.model.js");
const { createAccount } = require("../../src/controllers/accountController.js");

function mockResponse() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

describe("createAccount", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("creates an account for the authenticated user", async () => {
    const newAccount = { _id: "account-id", user: "user-id", status: "active", currency: "RS" };
    accountModel.create.mockResolvedValue(newAccount);
    const req = { user: { _id: "user-id" } };
    const res = mockResponse();

    await createAccount(req, res);

    expect(accountModel.create).toHaveBeenCalledWith({ user: "user-id" });
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({ newAccount });
  });

  it("propagates model errors instead of silently succeeding", async () => {
    accountModel.create.mockRejectedValue(new Error("validation failed"));
    const res = mockResponse();

    await expect(createAccount({ user: { _id: "user-id" } }, res)).rejects.toThrow("validation failed");
    expect(res.status).not.toHaveBeenCalled();
  });
});
