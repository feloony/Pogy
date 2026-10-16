require("dotenv").config();
const mongoose = require("mongoose");
const logger = require("./logger");

module.exports = {
  init: async () => {
    if (!process.env.MONGO || !process.env.MONGO.trim()) {
      throw new Error("Missing MONGO environment variable. Set it to your MongoDB connection URI.");
    }

    mongoose.Promise = global.Promise;

    mongoose.connection.on("error", (err) => {
      logger.error(`Mongoose connection error: ${err.message}`, {
        label: "Database",
      });
    });

    mongoose.connection.on("disconnected", () => {
      logger.warn("Mongoose connection lost", { label: "Database" });
    });

    mongoose.connection.on("connected", () => {
      logger.info("Mongoose connected", { label: "Database" });
    });

    // These options are required by the project's pinned Mongoose 5.x version.
    mongoose.set("useNewUrlParser", true);
    mongoose.set("useFindAndModify", false);
    mongoose.set("useCreateIndex", true);

    await mongoose.connect(process.env.MONGO);
    return true;
  },
};
