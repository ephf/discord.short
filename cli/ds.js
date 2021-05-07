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
    let bots = JSON.parse(fs.readFileSync(dev ? './cli/bots.json' : './node_modules/discord.short/cli/bots.json', 'utf-8'));
    bots.push(args[1]);
    fs.writeFileSync(dev ? './cli/bots.json' : './node_modules/discord.short/cli/bots.json', JSON.stringify(bots));
    return out.success(`Created file: "${args[1]}.js"`);
}