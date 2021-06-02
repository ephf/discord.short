#!./node

const fs = require("fs");
const out = require("./message");
const [, , ...args] = process.argv;
const { execSync } = require("child_process");

if (!fs.existsSync("./discord.short/bots.json"))
  out.error("You haven't made any bots");
if (!args[0]) out.error("You need to add the name of your bot for settings");

var bots = JSON.parse(fs.readFileSync("./discord.short/bots.json", "utf-8"));
const keys = Object.keys(bots);

let found = false;
for (key of keys) {
  if (key == args[0]) {
    found = true;
    if (!args[1])
      out.error("You need to specify the setting you wish to change");
    if (args[1] == "run") {
      execSync(`node ${key}`, {
        stdio: [process.stdin, process.stdout, process.stderr],
      });
    } else if (args[1] == "add") {
      execSync(`ds addbot ${key}`, {
        stdio: [process.stdin, process.stdout, process.stderr],
      });
    } else if (args[1] == "remove") {
      execSync(`ds rembot ${key}`, {
        stdio: [process.stdin, process.stdout, process.stderr],
      });
    } else {
      out.error("That is not one of the options you can edit");
    }
  }
}

if (!found) out.error("You don't have a bot with that name");

fs.writeFileSync("./discord.short/bots.json", JSON.stringify(bots));
