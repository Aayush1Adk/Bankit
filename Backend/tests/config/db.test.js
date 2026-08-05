jest.mock("mongoose", () => ({ connect: jest.fn() }));

const mongoose = require("mongoose");
const connectDB = require("../../src/config/db.js");

describe("connectDB", () => {
  let log;
  let exit;

  beforeEach(() => {
    jest.clearAllMocks();
    log = jest.spyOn(console, "log").mockImplementation(() => {});
    exit = jest.spyOn(process, "exit").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("connects using MONGO_URI and logs success", async () => {
    mongoose.connect.mockResolvedValue(undefined);

    connectDB();
    await new Promise(process.nextTick);

    expect(mongoose.connect).toHaveBeenCalledWith(process.env.MONGO_URI);
    expect(log).toHaveBeenCalledWith("server is connected to DB");
    expect(exit).not.toHaveBeenCalled();
  });

  it("exits the process when the connection fails", async () => {
    mongoose.connect.mockRejectedValue(new Error("unreachable"));

    connectDB();
    await new Promise(process.nextTick);

    expect(log).toHaveBeenCalledWith("DATABASE's error");
    expect(exit).toHaveBeenCalledWith(1);
  });
});
