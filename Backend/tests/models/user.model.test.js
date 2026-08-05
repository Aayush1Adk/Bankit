const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");
const userModel = require("../../src/models/user.model.js");

function newUser(overrides = {}) {
  return new userModel({
    email: "user@bankit.test",
    name: "User",
    password: "secret123",
    ...overrides,
  });
}

describe("user schema validation", () => {
  it("accepts a well formed user", () => {
    expect(newUser().validateSync()).toBeUndefined();
  });

  it("requires email, name and password", () => {
    const errors = new userModel({}).validateSync().errors;

    expect(errors.email.message).toBe("Email is required For Registration");
    expect(errors.name.message).toBe("Name is required For Registration");
    expect(errors.password.message).toBe("Password is required For Registration");
  });

  it("rejects a malformed email", () => {
    const errors = newUser({ email: "not-an-email" }).validateSync().errors;

    expect(errors.email.message).toBe("Please fill a valid email address");
  });

  it("rejects a password shorter than 6 characters", () => {
    const errors = newUser({ password: "12345" }).validateSync().errors;

    expect(errors.password.message).toBe("Password must be at least 6 characters long");
  });

  it("trims and lowercases the email and trims the name", () => {
    const user = newUser({ email: "  USER@Bankit.TEST  ", name: "  User  " });

    expect(user.email).toBe("user@bankit.test");
    expect(user.name).toBe("User");
  });

  it("hides the password from query projections by default", () => {
    expect(userModel.schema.path("password").options.select).toBe(false);
  });
});

describe("password hashing hook", () => {
  async function runPreSave(doc) {
    const hooks = doc.schema.s.hooks._pres.get("save") || [];
    for (const hook of hooks) {
      await hook.fn.call(doc, () => {});
    }
  }

  it("replaces a modified password with a bcrypt hash", async () => {
    const user = newUser();

    await runPreSave(user);

    expect(user.password).not.toBe("secret123");
    expect(await bcrypt.compare("secret123", user.password)).toBe(true);
  });

  it("leaves the password untouched when it was not modified", async () => {
    const user = newUser();
    user.unmarkModified("password");
    jest.spyOn(user, "isModified").mockReturnValue(false);

    await runPreSave(user);

    expect(user.password).toBe("secret123");
  });
});

describe("comparePassword", () => {
  it("returns true for the correct password and false otherwise", async () => {
    const user = newUser({ password: await bcrypt.hash("secret123", 10) });

    await expect(user.comparePassword("secret123")).resolves.toBe(true);
    await expect(user.comparePassword("wrong-password")).resolves.toBe(false);
  });
});

describe("model registration", () => {
  it("registers the User model on the shared mongoose connection", () => {
    expect(mongoose.models.User).toBe(userModel);
  });
});
