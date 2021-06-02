#!./node

const fs = require("fs");
const { execSync } = require("child_process");

let dev = false;
if (fs.existsSync("Dev")) dev = true;

const bots = Object.keys(
  JSON.parse(fs.readFileSync("./node_modules/@discord.short/bots.json"))
);
const out = require("./message");

if (bots.length < 1) out.error("You don't have any bots to run");

for (bot of bots) {
  if (!fs.existsSync(`${bot}.js`))
    out.error(`Couldn't find the bot: "${bot}"`, `looking for: "${bot}.js"`);
  execSync(`node ${bot}.js`, {
    stdio: [process.stdin, process.stdout, process.stderr],
  });
}
