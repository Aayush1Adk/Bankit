jest.mock("../../src/models/user.model.js");

const jwt = require("jsonwebtoken");
const userModel = require("../../src/models/user.model.js");
const { authMiddleware } = require("../../src/middleware/authMiddleware.js");

function mockResponse() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

function signToken(userId, secret = process.env.JWT_SECRET) {
  return jwt.sign({ userId }, secret, { expiresIn: "3d" });
}

describe("authMiddleware", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("rejects the request when no token is present", async () => {
    const res = mockResponse();
    const next = jest.fn();

    await authMiddleware({ cookies: {}, headers: {} }, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: "Access denied. No token provided." });
    expect(next).not.toHaveBeenCalled();
  });

  it("attaches the user and continues for a valid cookie token", async () => {
    const user = { _id: "user-id", email: "user@bankit.test" };
    userModel.findById.mockResolvedValue(user);
    const req = { cookies: { token: signToken("user-id") }, headers: {} };
    const next = jest.fn();

    await authMiddleware(req, mockResponse(), next);

    expect(userModel.findById).toHaveBeenCalledWith("user-id");
    expect(req.user).toBe(user);
    expect(next).toHaveBeenCalled();
  });

  it("accepts a bearer token from the authorization header", async () => {
    userModel.findById.mockResolvedValue({ _id: "user-id" });
    const req = { cookies: {}, headers: { authorization: `Bearer ${signToken("user-id")}` } };
    const next = jest.fn();

    await authMiddleware(req, mockResponse(), next);

    expect(next).toHaveBeenCalled();
    expect(req.user).toEqual({ _id: "user-id" });
  });

  it("rejects a token signed with a different secret", async () => {
    const res = mockResponse();
    const next = jest.fn();
    const req = { cookies: { token: signToken("user-id", "another-secret") }, headers: {} };

    await authMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: "Invalid token." });
    expect(next).not.toHaveBeenCalled();
  });

  it("rejects an expired token", async () => {
    const res = mockResponse();
    const next = jest.fn();
    const expired = jwt.sign({ userId: "user-id" }, process.env.JWT_SECRET, { expiresIn: "-1s" });

    await authMiddleware({ cookies: { token: expired }, headers: {} }, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(next).not.toHaveBeenCalled();
  });

  it("rejects when the user lookup fails", async () => {
    userModel.findById.mockRejectedValue(new Error("db down"));
    const res = mockResponse();
    const next = jest.fn();

    await authMiddleware({ cookies: { token: signToken("user-id") }, headers: {} }, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(next).not.toHaveBeenCalled();
  });
});
