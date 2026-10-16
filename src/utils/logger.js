const fs = require("fs");
const path = require("path");
const { createLogger, format, transports } = require("winston");
const { combine, printf } = format;
const Discord = require("discord.js");
const config = require("../../config.json");
const chalk = require("chalk");

const logFile = path.resolve(__dirname, "../assets/logs/Pogy.log");
fs.mkdirSync(path.dirname(logFile), { recursive: true });

const webhookUrl = config.webhooks && config.webhooks.logs;
let webhookClient = null;

if (typeof webhookUrl === "string" && /^https:\/\/discord(?:app)?\.com\/api\/webhooks\//.test(webhookUrl)) {
  try {
    webhookClient = new Discord.WebhookClient({ url: webhookUrl });
  } catch (error) {
    // Logging must remain available even when an optional webhook is misconfigured.
    webhookClient = null;
  }
}

const myFormat = printf((info) => {
  const { level, message, label, timestamp } = info;
  const rawLevel = info[Symbol.for("level")] || level;

  // Keep webhook logging optional and never let a rejected webhook request crash the bot.
  if (webhookClient && (rawLevel === "error" || rawLevel === "warn")) {
    webhookClient
      .send({ content: `${timestamp} [${rawLevel}] [${label || "General"}] ${message}`.slice(0, 2000) })
      .catch(() => {});
  }

  return `${timestamp} [${level}] [${chalk.cyan(label || "General")}] ${message}`;
});

const myCustomLevels = {
  levels: {
    error: 0,
    warn: 1,
    info: 2,
    http: 3,
    verbose: 4,
    debug: 5,
    silly: 6,
  },
};

const logger = createLogger({
  levels: myCustomLevels.levels,
  format: combine(
    format.colorize(),
    format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    myFormat
  ),
  transports: [
    new transports.Console(),
    new transports.File({ filename: logFile }),
  ],
});

module.exports = logger;
