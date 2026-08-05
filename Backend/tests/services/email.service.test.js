jest.mock("nodemailer", () => {
  const sendMail = jest.fn();
  const verify = jest.fn();
  return {
    createTransport: jest.fn(() => ({ sendMail, verify })),
    getTestMessageUrl: jest.fn(() => "https://preview.test/message"),
    __sendMail: sendMail,
    __verify: verify,
  };
});

const nodemailer = require("nodemailer");
const emailService = require("../../src/services/email.service.js");

const sendMail = nodemailer.__sendMail;

describe("transport configuration", () => {
  it("builds an OAuth2 gmail transport from the environment", () => {
    expect(nodemailer.createTransport).toHaveBeenCalledWith({
      service: "gmail",
      auth: {
        type: "OAuth2",
        user: process.env.EMAIL_USER,
        clientId: process.env.CLIENT_ID,
        clientSecret: process.env.CLIENT_SECRET,
        refreshToken: process.env.REFRESH_TOKEN,
      },
    });
  });

  it("verifies the transport on load and logs both outcomes", () => {
    const callback = nodemailer.__verify.mock.calls[0][0];
    const error = jest.spyOn(console, "error").mockImplementation(() => {});
    const log = jest.spyOn(console, "log").mockImplementation(() => {});

    callback(new Error("no connection"));
    expect(error).toHaveBeenCalledWith("Error connecting to email server:", expect.any(Error));

    callback(null, true);
    expect(log).toHaveBeenCalledWith("Email server is ready to send messages");

    error.mockRestore();
    log.mockRestore();
  });
});

describe("sendEmail", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, "log").mockImplementation(() => {});
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("sends the message with the Bankit sender address", async () => {
    sendMail.mockResolvedValue({ messageId: "id-1" });

    await emailService.sendEmail("to@bankit.test", "Subject", "text body", "<p>html body</p>");

    expect(sendMail).toHaveBeenCalledWith({
      from: `"Bankit" <${process.env.EMAIL_USER}>`,
      to: "to@bankit.test",
      subject: "Subject",
      text: "text body",
      html: "<p>html body</p>",
    });
  });

  it("swallows transport errors so callers are not interrupted", async () => {
    sendMail.mockRejectedValue(new Error("smtp down"));

    await expect(emailService.sendEmail("to@bankit.test", "Subject", "text")).resolves.toBeUndefined();
    expect(console.error).toHaveBeenCalledWith("Error sending email:", expect.any(Error));
  });
});

describe("templated emails", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, "log").mockImplementation(() => {});
    sendMail.mockResolvedValue({ messageId: "id-1" });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("sends a welcome email addressed to the new user", async () => {
    await emailService.sendRegistrationEmail("new@bankit.test", "New User");

    const message = sendMail.mock.calls[0][0];
    expect(message.to).toBe("new@bankit.test");
    expect(message.subject).toBe("Welcome to Bankit!");
    expect(message.text).toContain("Hello New User");
    expect(message.html).toContain("Hello New User");
  });

  it("sends a login notification addressed to the user", async () => {
    await emailService.sendLoginEmail("user@bankit.test", "User");

    const message = sendMail.mock.calls[0][0];
    expect(message.to).toBe("user@bankit.test");
    expect(message.subject).toBe("Login Notification");
    expect(message.text).toContain("successfully logged in");
    expect(message.html).toContain("successfully logged in");
  });
});
