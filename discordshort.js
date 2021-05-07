let Discord = require('discord.js');

let parse = require('./parser');

let schemas = require('./mongodb/schemas');

function info() {
    console.log(`${process.env.PORT ? '' : '\x1b[33m'}[${global.currentDS.name}]${process.env.PORT ? '' : '\x1b[0m'} ${process.env.PORT ? '' : '\x1b[36m'}[discord.short] ` + Array.from(arguments).join('\n[discord.short] ') + (process.env.PORT ? '' : '\x1b[0m'));
}

function error() {
    let err = new Error(`${process.env.PORT ? '' : '\x1b[33m'}[${global.currentDS.name}]${process.env.PORT ? '' : '\x1b[0m'} ${process.env.PORT ? '' : '\x1b[31m'}[discord.short error] ` + Array.from(arguments).join('\n[discord.short error] ') + (process.env.PORT ? '' : '\x1b[0m'));
    throw err;
}

class Client {
    constructor(name) {
        this.data = {
            commands: [],
            connected: false,
            onmessage() {},
            db: {
                user: {},
                server: {}
            }
        }
        this.name = name;
        this.bot = new Discord.Client()
        global.currentDS = this;
        this.Command = class Command {
            constructor(config, ds) {
                if(!config.name) error('Your command is missing a name');
                if(!config.execute) error('Your command is missing an execute function');
                global.currentDS.data.commands.push(config);
            }
        }
    }

    setPrefix(prefix) {
        this.data.prefix = prefix;
    }

    on(type, f) {
        this.bot.on(type, f);
    }

    async setUserData(data, id) {
        let userdat = schemas.user;
        if(typeof data != 'object') error('the "data" param in setUserData needs to be an object');
        if(!await userdat.findOne({_id: id ? id : this.data.config.author.id})) {
            await new userdat({
                _id: id ? id : this.data.config.author.id,
                data: this.data.db.user
            }).save();
        }
        let override = await this.getUserData(id);
        for(key of Object.keys(data)) {
            override[key] = data[key];
        }
        await userdat.findOneAndUpdate({_id: id ? id : this.data.config.author.id},{
            _id: id ? id : this.data.config.author.id,
            data: override
        });
    }

    async getUserData(id) {
        let userdat = schemas.user;
        let dat = await userdat.findOne({_id: id ? id : this.data.config.author.id});
        if(!dat.data) dat.data = {};
        return dat ? dat.data : this.data.db.user;
    }

    async getAllUserData() {
        let userdat = schemas.user;
        let res = await userdat.find({});
        return res;
    }

    async defaultUserData(data) {
        this.data.db.user = data;
    }

    async setGuildData(data, id) {
        let serverdat = schemas.server;
        if(typeof data != 'object') error('the "data" param in setGuildData needs to be an object');
        if(!await serverdat.findOne({_id: id ? id : this.data.config.guild.id})) {
            await new serverdat({
                _id: id ? id : this.data.config.guild.id,
                data: this.data.db.server
            }).save();
        }
        let override = await this.getGuildData(id);
        for(key of Object.keys(data)) {
            override[key] = data[key];
        }
        await serverdat.findOneAndUpdate({_id: id ? id : this.data.config.guild.id},{
            _id: id ? id : this.data.config.guild.id,
            data: override
        });
    }

    async getGuildData(id) {
        let serverdat = schemas.server;
        let dat = await serverdat.findOne({_id: id ? id : this.data.config.guild.id});
        if(!dat.data) dat.data = {};
        return dat ? dat.data : this.data.db.server;
    }

    async getAllGuildData() {
        let serverdat = schemas.server;
        let res = await serverdat.find({});
        return res;
    }

    async defaultGuildData(data) {
        this.data.db.server = data;
    }

    async login(id) {
        this.data.id = id;
        this.bot.login(id.botToken);
        this.bot.on('message', message => {
            parse.command(message, this);
        });
        this.bot.on('ready', () => info('Your bot is online'));
        if(id.mongo) {
            await require('./mongodb/mongo')(id).then(async item => {
                try {
                    info('Connected to MongoDB');
                    this.data.connected = true;
                }
                catch {
                    info('Couldn\'t connect to MongoDB');
                }
            });
        }
        if(id.heroku) {
            require('./heroku/anti-idle')(id);
        }
    }
};

module.exports.Client = Client;