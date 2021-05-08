#!./node

const fs = require('fs');
const { execSync } = require("child_process");

let dev = false;
if(fs.existsSync('Dev')) dev = true;
const out = require('./message');

const [,, ...args] = process.argv;

if(!args[0]) out.error('You need to specify a command:', ' * runbot', ' * createbot', ' * addbot', ' * rembot');

if(args[0] == 'createbot') {
    if(!args[1]) out.error('You need to specify a bot name');
    if(fs.existsSync(args[1] + '.js')) out.error(`A file with the name of "${args[1]}.js" already exists`);
    fs.writeFileSync(args[1] + '.js', `// create a client\nconst Discord = require('discord.short');\nconst ds = new Discord.Client('${args[1]}');\n\n// login\nds.login(${JSON.stringify({
        botToken: '...',
        mongo: {
            username: '...',
            password: '...',
            database: 'discordshort'
        },
        heroku: {
            name: '...'
        }
    }, null, 2)});`);
    if(!fs.existsSync('./discord.short')) {
        fs.mkdirSync('./discord.short');
    }
    if(!fs.existsSync('./discord.short/bots.json')) {
        fs.writeFileSync('./discord.short/bots.json', '[]');
    }
    let bots = JSON.parse(fs.readFileSync('./discord.short/bots.json', 'utf-8'));
    bots.push(args[1]);
    fs.writeFileSync('./discord.short/bots.json', JSON.stringify(bots));
    out.success(`Created file: "${args[1]}.js"`);
}

if(args[0] == 'runbot') {
    if(!args[1]) out.error('You need to specify a bot to run');
    if(!fs.existsSync(`${args[1]}.js`)) out.error(`Couldn't find the bot: "${args[1]}"`, `looking for: "${args[1]}.js"`);
    execSync(`node ${args[1]}.js`, {stdio: [process.stdin, process.stdout, process.stderr]});
}

if(args[0] == 'addbot') {
    if(!args[1]) out.error('You need to specify a bot to add');
    if(!fs.existsSync('./discord.short')) {
        fs.mkdirSync('./discord.short');
    }
    if(!fs.existsSync('./discord.short/bots.json')) {
        fs.writeFileSync('./discord.short/bots.json', '[]');
    }
    let bots = JSON.parse(fs.readFileSync('./discord.short/bots.json', 'utf-8'));
    bots.push(args[1]);
    fs.writeFileSync('./discord.short/bots.json', JSON.stringify(bots));
    out.success(`Added "${args[1]}"`);
}

if(args[0] == 'rembot') {
    if(!args[1]) out.error('You need to specify a bot to remove');
    if(!fs.existsSync('./discord.short') || !fs.existsSync('./discord.short/bots.json')) out.error('You don\'t have any bots recognized by discord.short');
    let bots = JSON.parse(fs.readFileSync('./discord.short/bots.json', 'utf-8'));
    if(bots.length < 1) out.error('You don\'t have any bots recognized by discord.short');
    let temp = [];
    for(bot of bots) {
        if(bot != args[1]) {
            temp.push(bot);
        }
    }
    if(temp.length == bots.length) out.error('That bot isn\'t currently known by discord.short');
    fs.writeFileSync('./discord.short/bots.json', JSON.stringify(temp));
    out.success(`Removed "${args[1]}"`);
}