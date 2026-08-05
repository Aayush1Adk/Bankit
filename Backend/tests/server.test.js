jest.mock("../src/config/db.js", () => jest.fn());
jest.mock("../src/app.js", () => ({ listen: jest.fn() }));

const connectDB = require("../src/config/db.js");
const app = require("../src/app.js");

describe("server bootstrap", () => {
  it("connects to the database and listens on port 3000", () => {
    const log = jest.spyOn(console, "log").mockImplementation(() => {});

    require("../server.js");

    expect(connectDB).toHaveBeenCalled();
    expect(app.listen).toHaveBeenCalledWith(3000, expect.any(Function));

    app.listen.mock.calls[0][1]();
    expect(log).toHaveBeenCalledWith("server is running on 3000");

    log.mockRestore();
  });
});
