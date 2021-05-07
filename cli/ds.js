#!./node

const fs = require('fs');

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
    return out.success(`Created file: "${args[1]}.js"`);
}