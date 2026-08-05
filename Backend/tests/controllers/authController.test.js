jest.mock("../../src/models/user.model.js");
jest.mock("../../src/services/email.service.js", () => ({
  sendEmail: jest.fn(),
  sendRegistrationEmail: jest.fn(),
  sendLoginEmail: jest.fn(),
}));

const jwt = require("jsonwebtoken");
const userModel = require("../../src/models/user.model.js");
const emailService = require("../../src/services/email.service.js");
const { userRegister, userLogin } = require("../../src/controllers/authController.js");

function mockResponse() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.cookie = jest.fn().mockReturnValue(res);
  return res;
}

describe("userRegister", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("rejects registration when the email already exists", async () => {
    userModel.findOne.mockResolvedValue({ _id: "existing-id", email: "taken@bankit.test" });
    const req = { body: { email: "taken@bankit.test", password: "secret123", name: "Taken" } };
    const res = mockResponse();

    await userRegister(req, res);

    expect(userModel.findOne).toHaveBeenCalledWith({ email: "taken@bankit.test" });
    expect(userModel.create).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(422);
    expect(res.json).toHaveBeenCalledWith({
      message: "User already exists with this email",
      status: "failed",
    });
    expect(emailService.sendRegistrationEmail).not.toHaveBeenCalled();
  });

  it("creates the user, sets a token cookie and sends the welcome email", async () => {
    userModel.findOne.mockResolvedValue(null);
    userModel.create.mockResolvedValue({
      _id: "new-id",
      email: "new@bankit.test",
      name: "New User",
      password: "hashed",
    });
    const req = { body: { email: "new@bankit.test", password: "secret123", name: "New User" } };
    const res = mockResponse();

    await userRegister(req, res);

    expect(userModel.create).toHaveBeenCalledWith({
      email: "new@bankit.test",
      password: "secret123",
      name: "New User",
    });
    expect(res.status).toHaveBeenCalledWith(201);

    const [cookieName, token] = res.cookie.mock.calls[0];
    expect(cookieName).toBe("token");
    expect(jwt.verify(token, process.env.JWT_SECRET).userId).toBe("new-id");

    expect(res.json).toHaveBeenCalledWith({
      newUser: { _id: "new-id", email: "new@bankit.test", name: "New User" },
      token,
    });
    expect(emailService.sendRegistrationEmail).toHaveBeenCalledWith("new@bankit.test", "New User");
  });

  it("does not leak the password in the response body", async () => {
    userModel.findOne.mockResolvedValue(null);
    userModel.create.mockResolvedValue({
      _id: "new-id",
      email: "new@bankit.test",
      name: "New User",
      password: "hashed",
    });
    const res = mockResponse();

    await userRegister({ body: { email: "new@bankit.test", password: "secret123", name: "New User" } }, res);

    expect(res.json.mock.calls[0][0].newUser).not.toHaveProperty("password");
  });
});

describe("userLogin", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  function mockFindOneSelect(user) {
    userModel.findOne.mockReturnValue({ select: jest.fn().mockResolvedValue(user) });
  }

  it("returns 401 when no user matches the email", async () => {
    mockFindOneSelect(null);
    const res = mockResponse();

    await userLogin({ body: { email: "missing@bankit.test", password: "secret123" } }, res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: "Email and password is invalid" });
    expect(res.cookie).not.toHaveBeenCalled();
  });

  it("returns 401 when the password does not match", async () => {
    mockFindOneSelect({
      _id: "user-id",
      email: "user@bankit.test",
      name: "User",
      comparePassword: jest.fn().mockResolvedValue(false),
    });
    const res = mockResponse();

    await userLogin({ body: { email: "user@bankit.test", password: "wrong" } }, res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: "Email and password is invalid" });
    expect(emailService.sendLoginEmail).not.toHaveBeenCalled();
  });

  it("issues a token and sends the login notification on valid credentials", async () => {
    const comparePassword = jest.fn().mockResolvedValue(true);
    mockFindOneSelect({
      _id: "user-id",
      email: "user@bankit.test",
      name: "User",
      comparePassword,
    });
    const res = mockResponse();

    await userLogin({ body: { email: "user@bankit.test", password: "secret123" } }, res);

    expect(comparePassword).toHaveBeenCalledWith("secret123");
    expect(res.status).toHaveBeenCalledWith(200);

    const [cookieName, token] = res.cookie.mock.calls[0];
    expect(cookieName).toBe("token");
    expect(jwt.verify(token, process.env.JWT_SECRET).userId).toBe("user-id");

    expect(res.json).toHaveBeenCalledWith({
      newUser: { _id: "user-id", email: "user@bankit.test", name: "User" },
      token,
    });
    expect(emailService.sendLoginEmail).toHaveBeenCalledWith("user@bankit.test", "User");
  });
});
