let Discord = require('discord.js');

let parse = require('./parser');

let schemas = require('./schemas');

function info() {
    console.log('[discord.short] ' + Array.from(arguments).join('\n[discord.short] '));
}

function error() {
    let err = new Error('[discord.short error] ' + Array.from(arguments).join('\n[discord.short error] '));
    throw err;
}

global.ds = {
    data: {
        commands: [],
        connected: false,
        onmessage() {}
    },
    bot: new Discord.Client(),
    async login(id) {
        global.ds.data.id = id;
        global.ds.bot.login(id.botToken);
        global.ds.bot.on('message', parse.command);
        global.ds.bot.on('ready', () => info('Your bot is online'));
        if(id.mongo.username) {
            await require('./mongo')(id).then(async item => {
                try {
                    info('Connected to MongoDB');
                    global.ds.data.connected = true;
                }
                catch {
                    info('Couldn\'t connect to MongoDB');
                }
            });
        }
        if(id.heroku) {
            require('./anti-idle')(id);
        }
    },
    Command: class Comamnd {
        constructor(config) {
            if(!config.name) error('Your command is missing a name');
            if(!config.execute) error('Your command is missing an execute function');
            global.ds.data.commands.push(config);
        }
    },
    setPrefix(prefix) {
        global.ds.data.prefix = prefix;
    },
    async setUserData(data, id) {
        let userdat = schemas.user;
        if(typeof data != 'object') error('the "data" param in setUserData needs to be an object');
        if(!await userdat.findOne({_id: id ? id : global.ds.data.config.author.id})) {
            await new userdat({
                _id: id ? id : global.ds.data.config.author.id,
                data
            }).save();
        } else {
            await userdat.findOneAndUpdate({_id: id ? id : global.ds.data.config.author.id},{
                _id: id ? id : global.ds.data.config.author.id,
                data
            });
        }
    },
    async getUserData(id) {
        let userdat = schemas.user;
        let dat = await userdat.findOne({_id: id ? id : global.ds.data.config.author.id})
        return dat ? dat.data : null;
    },
    async setGuildData(data, id) {
        let serverdat = schemas.server;
        if(typeof data != 'object') error('the "data" param in setGuildData needs to be an object');
        if(!await serverdat.findOne({_id: id ? id : global.ds.data.config.guild.id})) {
            await new serverdat({
                _id: id ? id : global.ds.data.config.guild.id,
                data
            }).save();
        } else {
            await serverdat.findOneAndUpdate({_id: id ? id : global.ds.data.config.guild.id},{
                _id: id ? id : global.ds.data.config.guild.id,
                data
            });
        }
    },
    async getGuildData(id) {
        let serverdat = schemas.server;
        let dat = await serverdat.findOne({_id: id ? id : global.ds.data.config.guild.id})
        return dat ? dat.data : null;
    },
    on(id, f) {
        if(id == 'message') {
            global.ds.onmessage = f;
        } else {
            global.ds.bot.on(id, f);
        }
    }
}

module.exports = global.ds;