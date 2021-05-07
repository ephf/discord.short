#!./node

const fs = require('fs');

function error() {
    let err = `\x1b[31m[discord.short error] ${Array.from(arguments).join('\n\x1b[31m[discord.short error] ')}\n\x1b[0m`;
    throw err;
}

function success() {
    console.log(`\x1b[32m[discord.short error] ${Array.from(arguments).join('\n\x1b[32m[discord.short error] ')}\x1b[0m`);
}

const [,, ...args] = process.argv;

if(!args[0]) error('You need to specify a command:', ' * runbot', ' * createbot', ' * addbot', ' * rembot');

if(args[0] == 'createbot') {
    if(!args[1]) error('You need to specify a bot name');
    if(fs.existsSync(args[1] + '.js')) error(`A file with the name of "${args[1]}.js" already exists`);
    fs.writeFileSync(args[1] + '.js', `// create a client\nconst Discord = require('discord.short');\nconst ds = new Discord.Client();\n\n// login\nds.login(${JSON.stringify({
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
    return success(`Created file: "${args[1]}.js"`);
}