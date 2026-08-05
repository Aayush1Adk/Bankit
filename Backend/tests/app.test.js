jest.mock("../src/controllers/authController.js", () => ({
  userRegister: jest.fn((req, res) => res.status(201).json({ route: "register", body: req.body })),
  userLogin: jest.fn((req, res) => res.status(200).json({ route: "login", body: req.body })),
}));

jest.mock("../src/controllers/accountController.js", () => ({
  createAccount: jest.fn((req, res) => res.status(201).json({ route: "create-account", user: req.user })),
}));

jest.mock("../src/middleware/authMiddleware.js", () => ({
  authMiddleware: jest.fn((req, res, next) => {
    if (!req.cookies.token) {
      return res.status(401).json({ message: "Access denied. No token provided." });
    }
    req.user = { _id: "user-id" };
    next();
  }),
}));

const request = require("supertest");
const app = require("../src/app.js");
const { authMiddleware } = require("../src/middleware/authMiddleware.js");

describe("auth routes", () => {
  it("routes POST /api/auth/register to the register controller with a parsed json body", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({ email: "new@bankit.test", password: "secret123", name: "New User" });

    expect(res.status).toBe(201);
    expect(res.body).toEqual({
      route: "register",
      body: { email: "new@bankit.test", password: "secret123", name: "New User" },
    });
  });

  it("routes POST /api/auth/login to the login controller", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "user@bankit.test", password: "secret123" });

    expect(res.status).toBe(200);
    expect(res.body.route).toBe("login");
  });

  it("does not expose the auth routes over GET", async () => {
    expect((await request(app).get("/api/auth/login")).status).toBe(404);
  });
});

describe("account routes", () => {
  it("rejects an unauthenticated create-account request", async () => {
    const res = await request(app).post("/api/account/create-account");

    expect(res.status).toBe(401);
    expect(authMiddleware).toHaveBeenCalled();
  });

  it("parses the token cookie and reaches the controller when authenticated", async () => {
    const res = await request(app)
      .post("/api/account/create-account")
      .set("Cookie", ["token=a-token"]);

    expect(res.status).toBe(201);
    expect(res.body).toEqual({ route: "create-account", user: { _id: "user-id" } });
  });
});

describe("unknown routes", () => {
  it("returns 404", async () => {
    expect((await request(app).get("/api/does-not-exist")).status).toBe(404);
  });
});
