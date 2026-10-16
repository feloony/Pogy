const { Client, Collection } = require("discord.js");
const Util = require("./src/structures/Util");
const config = require("./config.json");
const { status } = config;

module.exports = class PogyClient extends Client {
  constructor(options = {}) {
    super({
      partials: ["MESSAGE", "CHANNEL", "REACTION", "GUILD_MEMBER", "USER"],
      intents: [
        "GUILDS",
        "GUILD_MEMBERS",
        "GUILD_MESSAGES",
        "GUILD_EMOJIS_AND_STICKERS",
        "GUILD_MESSAGE_REACTIONS",
        "GUILD_VOICE_STATES",
        "GUILD_PRESENCES",
      ],
      allowedMentions: {
        // Avoid accidental mass mentions from command output or user-provided content.
        parse: ["users"],
        repliedUser: false,
      },
      presence: {
        status: "online",
        activities: [
          {
            type: "WATCHING",
            name: status,
          },
        ],
      },
    });

    this.validate(options);
    this.botCommands = new Collection();
    this.botEvents = new Collection();
    this.aliases = new Collection();
    this.mongoose = require("./src/utils/mongoose");
    this.utils = new Util(this);
    this.config = config;
  }

  validate(options) {
    if (!options || typeof options !== "object" || Array.isArray(options)) {
      throw new TypeError("Options should be an object.");
    }

    if (typeof options.prefix !== "string" || !options.prefix.trim()) {
      throw new TypeError("A non-empty string prefix must be provided in config.json.");
    }
    this.prefix = options.prefix;
  }

  async start(token) {
    if (typeof token !== "string" || !token.trim()) {
      throw new Error("Missing Discord bot token. Set TOKEN in your environment.");
    }

    require("./src/utils/prototypes");
    await this.utils.loadCommands();
    await this.utils.loadEvents();
    await this.mongoose.init();
    await this.login(token);
    return this;
  }
};
