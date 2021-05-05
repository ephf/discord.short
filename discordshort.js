let Discord = require('discord.js');

let parse = require('./parser');

let schemas = require('./schemas');

function info() {
    console.log('\x1b[36m[discord.short] ' + Array.from(arguments).join('\n[discord.short] ') + '\x1b[0m');
}

function error() {
    let err = new Error('\x1b[31m[discord.short error] ' + Array.from(arguments).join('\n[discord.short error] ') + '\n\x1b[0m');
    throw err;
}

global.ds = {
    data: {
        commands: [],
        connected: false,
        onmessage() {},
        db: {
            user: {},
            server: {}
        }
    },
    bot: new Discord.Client(),
    async login(id) {
        global.ds.data.id = id;
        global.ds.bot.login(id.botToken);
        global.ds.bot.on('message', parse.command);
        global.ds.bot.on('ready', () => info('Your bot is online'));
        if(id.mongo) {
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
                data: global.ds.data.db.user
            }).save();
        }
        let override = await global.ds.getUserData(id);
        for(key of Object.keys(data)) {
            override[key] = data[key];
        }
        await userdat.findOneAndUpdate({_id: id ? id : global.ds.data.config.author.id},{
            _id: id ? id : global.ds.data.config.author.id,
            data: override
        });
    },
    async getUserData(id) {
        let userdat = schemas.user;
        let dat = await userdat.findOne({_id: id ? id : global.ds.data.config.author.id});
        if(!dat.data) dat.data = {};
        return dat ? dat.data : global.ds.data.db.user;
    },
    async getAllUserData() {
        let userdat = schemas.user;
        let res = await userdat.find({});
        return res;
    },
    async defaultUserData(data) {
        global.ds.data.db.user = data;
    },
    async setGuildData(data, id) {
        let serverdat = schemas.server;
        if(typeof data != 'object') error('the "data" param in setGuildData needs to be an object');
        if(!await serverdat.findOne({_id: id ? id : global.ds.data.config.guild.id})) {
            await new serverdat({
                _id: id ? id : global.ds.data.config.guild.id,
                data: global.ds.data.db.server
            }).save();
        }
        let override = await global.ds.getGuildData(id);
        for(key of Object.keys(data)) {
            override[key] = data[key];
        }
        await serverdat.findOneAndUpdate({_id: id ? id : global.ds.data.config.guild.id},{
            _id: id ? id : global.ds.data.config.guild.id,
            data: override
        });
    },
    async getGuildData(id) {
        let serverdat = schemas.server;
        let dat = await serverdat.findOne({_id: id ? id : global.ds.data.config.guild.id});
        if(!dat.data) dat.data = {};
        return dat ? dat.data : global.ds.data.db.server;
    },
    async getAllGuildData() {
        let serverdat = schemas.server;
        let res = await serverdat.find({});
        return res;
    },
    async defaultGuildData(data) {
        global.ds.data.db.server = data;
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