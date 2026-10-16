require("dotenv").config();
const PogyClient = require("./Pogy");
const config = require("./config.json");
const logger = require("./src/utils/logger");
const Pogy = new PogyClient(config);

const color = require("./src/data/colors");
Pogy.color = color;

const emoji = require("./src/data/emoji");
Pogy.emoji = emoji;

const jointocreate = require("./src/structures/jointocreate");
jointocreate(Pogy);

Pogy.react = new Map();
Pogy.fetchforguild = new Map();

process.on("unhandledRejection", (reason) => {
  const error = reason instanceof Error ? reason : new Error(String(reason));
  logger.error(`[unhandledRejection] ${error.stack || error.message}`, { label: "ERROR" });
});

process.on("uncaughtException", (err, origin) => {
  logger.error(`[uncaughtException] ${err.stack || err.message} (origin: ${origin})`, { label: "ERROR" });
  // Continuing after an uncaught exception can leave the bot in an unsafe state.
  process.exit(1);
});

process.on("multipleResolves", (type, promise, reason) => {
  logger.warn(`[multipleResolves] ${type}: ${String(reason)}`, { label: "ERROR" });
});

Pogy.start(process.env.TOKEN).catch((error) => {
  logger.error(`Startup failed: ${error.stack || error.message}`, { label: "Startup" });
  process.exitCode = 1;
});
