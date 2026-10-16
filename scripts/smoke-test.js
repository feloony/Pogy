"use strict";

require("dotenv").config();

const config = require("../config.json");
const PogyClient = require("../Pogy");

async function main() {
  if (!process.env.TOKEN || !process.env.TOKEN.trim()) {
    throw new Error("TOKEN environment variable is missing.");
  }
  if (!process.env.MONGO || !process.env.MONGO.trim()) {
    throw new Error("MONGO environment variable is missing.");
  }
  if (!config || typeof config !== "object" || Array.isArray(config)) {
    throw new Error("config.json must contain a JSON object.");
  }
  if (typeof config.prefix !== "string" || !config.prefix.trim()) {
    throw new Error("config.json must include a non-empty string 'prefix'.");
  }
  if (typeof config.status !== "string" || !config.status.trim()) {
    throw new Error("config.json must include a non-empty string 'status'.");
  }

  console.log("[smoke-test] Configuration validation passed.");
  const bot = new PogyClient(config);

  try {
    console.log("[smoke-test] Starting bot; loading commands/events and connecting to MongoDB...");
    await bot.start(process.env.TOKEN);
    console.log("[smoke-test] SUCCESS: MongoDB initialized and Discord login succeeded.");
  } finally {
    console.log("[smoke-test] Cleaning up connections...");
    try {
      if (typeof bot.destroy === "function") bot.destroy();
    } catch (error) {
      console.error("[smoke-test] Discord cleanup warning:", error.message);
    }
    try {
      const mongoose = require("mongoose");
      await mongoose.disconnect();
    } catch (error) {
      console.error("[smoke-test] MongoDB cleanup warning:", error.message);
    }
  }
}

main()
  .then(() => {
    console.log("[smoke-test] Test completed successfully. Exiting.");
    process.exit(0);
  })
  .catch((error) => {
    console.error("[smoke-test] FAILED:", error && (error.stack || error.message) || String(error));
    process.exit(1);
  });
