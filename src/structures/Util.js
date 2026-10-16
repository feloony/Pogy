const fs = require("fs").promises;
const path = require("path");
const Command = require("./Command.js");
const Event = require("./Event.js");

module.exports = class Util {
  constructor(client) {
    this.client = client;
  }

  isClass(input) {
    return (
      typeof input === "function" &&
      typeof input.prototype === "object" &&
      input.toString().substring(0, 5) === "class"
    );
  }

  trimArray(arr, maxLen = 10) {
    if (arr.length > maxLen) {
      const len = arr.length - maxLen;
      arr = arr.slice(0, maxLen);
      arr.push(`${len} more...`);
    }
    return arr;
  }

  get directory() {
    // Prefer the current working directory when it is the repository root.
    // Fall back to this file's location so nested scripts work from any cwd.
    const cwd = process.cwd();
    const cwdHasSource = require("fs").existsSync(path.join(cwd, "src", "commands"));
    const root = cwdHasSource ? cwd : path.resolve(__dirname, "../..");
    return `${root}${path.sep}`;
  }

  removeDuplicates(arr) {
    return [...new Set(arr)];
  }

  capitalise(string) {
    return string
      .split(" ")
      .map((str) => str.slice(0, 1).toUpperCase() + str.slice(1))
      .join(" ");
  }

  async *loadFiles(dir) {
    const files = await fs.readdir(dir);
    for (const file of files) {
      const pathToFile = path.join(dir, file);
      const isDirectory = (await fs.stat(pathToFile)).isDirectory();
      if (isDirectory) {
        yield* this.loadFiles(pathToFile);
      } else {
        yield pathToFile;
      }
    }
  }

  async loadCommands() {
    const commandDir = path.join(this.directory, "src", "commands");
    const errors = [];
    let files;

    try {
      files = [];
      for await (const file of this.loadFiles(commandDir)) files.push(file);
    } catch (error) {
      throw new Error(`Unable to read command directory "${commandDir}": ${error.message}`);
    }

    for (const commandFile of files) {
      const name = path.parse(commandFile).name;
      try {
        delete require.cache[commandFile];
        const File = require(commandFile);
        if (!this.isClass(File)) {
          throw new TypeError(`Command ${name} doesn't export a class.`);
        }
        const command = new File(this.client, name.toLowerCase());
        if (!(command instanceof Command)) {
          throw new TypeError(`Command ${name} does not extend the Command base class.`);
        }
        if (!Array.isArray(command.aliases)) {
          throw new TypeError(`Command ${name} must define aliases as an array.`);
        }
        this.client.botCommands.set(command.name, command);
        for (const alias of command.aliases) {
          this.client.aliases.set(alias, command.name);
        }
      } catch (error) {
        errors.push(`${path.relative(this.directory, commandFile)}: ${error.stack || error.message}`);
      }
    }

    if (errors.length) {
      throw new Error(`Failed to load ${errors.length} command file(s):\n- ${errors.join("\n- ")}`);
    }
    console.log(`[Pogy] Loaded ${this.client.botCommands.size} commands.`);
  }

  async loadEvents() {
    const eventDir = path.join(this.directory, "src", "events");
    const errors = [];
    let files;

    try {
      files = [];
      for await (const file of this.loadFiles(eventDir)) files.push(file);
    } catch (error) {
      throw new Error(`Unable to read event directory "${eventDir}": ${error.message}`);
    }

    for (const eventFile of files) {
      const name = path.parse(eventFile).name;
      try {
        delete require.cache[eventFile];
        const File = require(eventFile);
        if (!this.isClass(File)) {
          throw new TypeError(`Event ${name} doesn't export a class.`);
        }
        const event = new File(this.client, name);
        if (!(event instanceof Event)) {
          throw new TypeError(`Event ${name} doesn't extend the Event base class.`);
        }
        if (!event.emitter || typeof event.emitter[event.type] !== "function") {
          throw new TypeError(`Event ${name} has an invalid emitter/type configuration.`);
        }
        this.client.botEvents.set(event.name, event);
        event.emitter[event.type](name, (...args) => event.run(...args));
      } catch (error) {
        errors.push(`${path.relative(this.directory, eventFile)}: ${error.stack || error.message}`);
      }
    }

    if (errors.length) {
      throw new Error(`Failed to load ${errors.length} event file(s):\n- ${errors.join("\n- ")}`);
    }
    console.log(`[Pogy] Loaded ${this.client.botEvents.size} events.`);
  }
};
