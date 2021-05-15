let DiscordJS = require('discord.js');
let fs = require('fs');

let parse = require('./parser');

let schemas = require('./mongodb/schemas');

function info() {
    console.log(`${process.env.PORT ? '' : '\x1b[33m'}[${global.currentDS.name}]${process.env.PORT ? '' : '\x1b[0m'} ${process.env.PORT ? '' : '\x1b[36m'}[discord.short] ` + Array.from(arguments).join('\n[discord.short] ') + (process.env.PORT ? '' : '\x1b[0m'));
}

function error() {
    let err = new Error(`${process.env.PORT ? '' : '\x1b[33m'}[${global.currentDS.name}]${process.env.PORT ? '' : '\x1b[0m'} ${process.env.PORT ? '' : '\x1b[31m'}[discord.short error] ` + Array.from(arguments).join('\n[discord.short error] ') + (process.env.PORT ? '' : '\x1b[0m'));
    throw err;
}

class Command {
    /**
     * ## Command
     * ```
     * new ds.Command({
     *  name: String,
     *  description?: String,
     *  aliases?: String[],
     *  setSlash?: Boolean, // description required
     *  async execute({...}): Promise<void> // has to be async
     * });
     * ```
     * ## Execute
     * ```
     * await execute({
     *  message: DiscordJS.Message,
     *  author: DiscordJS.User,
     *  channel: DiscordJS.Channel,
     *  guild: DiscordJS.Guild,
     *  label: String,
     *  args: String[],
     *  send(text: String): Promise<void>
     * });
     * ```
     * **Docs: {@link https://ephf.gitbook.io/discord-short/creating-bot-commands Creating Bot Commands}**
     * @param {{
     *  name: String,
     *  description?: String,
     *  aliases?: String[],
     *  setSlash?: Boolean,
     *  execute({information}: {
     *      message: DiscordJS.Message,
     *      author: DiscordJS.User,
     *      channel: DiscordJS.Channel,
     *      guild: DiscordJS.Guild,
     *      label: String,
     *      args: String[],
     *      send(text: String): Promise<void>
     *  }): Promise<void>
     * }} config - **Argument:** `Command Configuration`
     */
    constructor(config) {
        if(!config.name) error('Your command is missing a name');
        if(!config.execute) error('Your command is missing an execute function');

        if(config.setSlash) {
            if(!config.description) error('Your command is missing a description');

            global.currentDS.bot.on('ready', async () => {
                await global.currentDS.bot.api.applications(global.currentDS.bot.user.id).guilds(config.guild).commands.post({
                    data: {
                        name: config.name,
                        description: config.description,
                        options: [
                            {
                                name: 'arguments',
                                description: 'The arguments after the command',
                                required: false,
                                type: 3
                            }
                        ]
                    }
                });
                global.currentDS.bot.ws.on('INTERACTION_CREATE', async interaction => {
                    const command = interaction.data.name;
                    const options = interaction.data.options;

                    let args = [];
                    if(options) {
                        args = options[0].value.split(' ');
                    }

                    if(command === config.name) {
                        await config.execute({
                            slashSend(content) {
                                global.currentDS.bot.api.interactions(interaction.id, interaction.token).callback.post({
                                    data: {
                                        type: 4,
                                        data: {
                                            content
                                        }
                                    }
                                });
                            },
                            interaction,
                            channel: global.currentDS.bot.channels.cache.get(interaction.channel_id),
                            guild: global.currentDS.bot.guilds.cache.get(interaction.guild_id),
                            author: interaction.member.user,
                            args,
                            send(content) {
                                global.currentDS.bot.channels.cache.get(interaction.channel_id).send(content);
                            }
                        });
                    }
                });
            });
        } else {
            global.currentDS.data.commands.push(config);
        }
    }
}

/**
 * ## Discord.Short ShortClient
 * ```
 * const ds = new Discord.ShortClient(name: String, settings?: Object);
 * ```
 * **Docs: {@link https://ephf.gitbook.io/discord-short/terminal-commands-creating-a-bot Terminal Commands / Creating a bot}**
 */
class ShortClient {
    /** @private */
    _reactEvents = [];
    /** @private */
    _unreactEvents = [];
    /** @private */
    data = {
        commands: [],
        connected: false,
        onmessage() {},
        db: {
            user: {},
            server: {}
        }
    }
    /**
     * ## Discord.Short Command
     * ```
     * new ds.Command(config: Object);
     * ```
     * **Docs: {@link https://ephf.gitbook.io/discord-short/creating-bot-commands Creating Bot Commands}**
     */
    Command = Command;
    /**
     * ## Discord.js Client
     * ```
     * new DiscordJS.Client(token: String);
     * ```
     */
    bot = new DiscordJS.Client();
    /**
     * ## ShortClient
     * ```
     * const ds = new Discord.ShortClient(name: String, options?: Object): ShortClient
     * ```
     * ## Options
     * ```
     * options = {
     *  antiIdle: Boolean, // default: true
     *  mongoConnect: Boolean // default: true
     * }
     * ```
     * **Docs: {@link https://ephf.gitbook.io/discord-short/terminal-commands-creating-a-bot/creating-and-removing-bots Creating and Removing Bots}**
     * @param {String} name - **Argument:** `Bot Name`
     * @param {Object?} settings - **Argument:** `Bot Settings` [Optional]
     */
    constructor(name, settings) {
        this.settings = settings || {
            antiIdle: true,
            mongoConnect: true
        }
        this.name = name;
        global.currentDS = this;
    }

    /**
     * ## Get Reply
     * ```
     * const reply = await ds.getNextReply();
     * ```
     * @returns {Promise<DiscordJS.Message>}
     * **Docs: {@link https://ephf.gitbook.io/discord-short/creating-bot-commands/reactions-command-replies Reactions / Command Replies}**
     */
    async getNextReply() {
        global.reply = false;
        return await new Promise(function(resolve, reject) {
            let interval = setInterval(function() {
                if(global.reply) {
                    clearInterval(interval);
                    resolve(global.reply);
                }
            }, 1);
        });
    }

    /**
     * ## Reaction Event
     * ```
     * ds.reactEvent(message: DiscordJS.Message, reaction: String, callback: Function);
     * ```
     * ## Reaction Event Callback
     * ```
     * callback({
     *  user: DiscordJS.User
     *  channel: DiscordJS.Channel,
     *  message: DiscordJS.Message,
     *  send(text: String): Promise<void>
     * });
     * ```
     * **Docs: {@link https://ephf.gitbook.io/discord-short/creating-bot-commands/reactions-command-replies Reactions / Command Replies}**
     * @param {DiscordJS.Message} message - **Argument:** `Message To Add Event To`
     * @param {String} reaction - **Argument:** `Emoji / ID Of Reaction`
     * @param {function({
     *  user: DiscordJS.User,
     *  channel: DiscordJS.Channel
     *  message: DiscordJS.Message
     *  send(text: String): Promise<void>
     * })} callback - **Argument:** `Callback Function When Reaction Is Added`
     * @returns {void}
     */
    reactEvent(message, reaction, callback) {
        message.react(reaction);
        this._reactEvents.push({
            message,
            reaction,
            callback
        });
    }

    /**
     * ## Remove Reaction Event
     * ```
     * ds.unreactEvent(message: DiscordJS.Message, reaction: String, callback: Function);
     * ```
     * ## Remove Reaction Event Callback
     * ```
     * callback({
     *  user: DiscordJS.User
     *  channel: DiscordJS.Channel,
     *  message: DiscordJS.Message,
     *  send(text: String): Promise<void>
     * });
     * ```
     * **Docs: {@link https://ephf.gitbook.io/discord-short/creating-bot-commands/reactions-command-replies Reactions / Command Replies}**
     * @param {DiscordJS.Message} message - **Argument:** `Message To Add Event To`
     * @param {String} reaction - **Argument:** `Emoji / ID Of Reaction`
     * @param {function({
     *  user: DiscordJS.User,
     *  channel: DiscordJS.Channel
     *  message: DiscordJS.Message
     *  send(text: String): Promise<void>
     * })} callback - **Argument:** `Callback Function When Reaction Is Removed`
     * @returns {void}
     */
    unreactEvent(message, reaction, callback) {
        this._unreactEvents.push({
            message,
            reaction,
            callback
        })
    }

    /**
     * ## Delete Slash Command
     * ```
     * await ds.deleteSlashCommand(id: String, guild?: DiscordJS.Guild);
     * ```
     * **Docs: {@link https://ephf.gitbook.io/discord-short/creating-bot-commands/slash-commands Slash Commands}**
     * @param {String} id - **Argument:** `ID Of Slash Command`
     * @param {String?} guild - **Argument:** `Guild ID Where Slash Command Was Made` [Optional]
     * @returns {Promise<void>}
     */
    async deleteSlashCommand(id, guild) {
        await this.bot.api.applications(this.bot.user.id).guilds(guild).commands(id).delete();
    }

    /**
     * ## Get Slash Commands
     * ```
     * const slashCommands = ds.getSlashCommands(guild?: String);
     * ```
     * **Docs: {@link https://ephf.gitbook.io/discord-short/creating-bot-commands/slash-commands Slash Commands}**
     * @param {String?} guild - **Argument:** `ID Of Guild Where Slash Command Was Made` [Optional]
     * @returns {Promise<Object[]>}
     */
    async getSlashCommands(guild) {
        return await this.bot.api.applications(this.bot.user.id).guilds(guild).commands.get();
    }

    /**
     * ## Set Command Prefix
     * ```
     * ds.setPrefix(prefix: String);
     * ```
     * **Docs: {@link https://ephf.gitbook.io/discord-short/creating-bot-commands Creating Bot Commands}**
     * @param {String} prefix - **Argument:** `Command Prefix`
     * @returns {void}
     */
    setPrefix(prefix) {
        this.data.prefix = prefix;
    }

    /**
     * ## On Event
     * ```
     * ds.on(event: DiscordJS.WSEventType, callback: Function);
     * ```
     * ### Alternative
     * ```
     * ds.bot.on(event: DiscordJS.WSEventType, callback: Function);
     * ```
     * @param {DiscordJS.WSEventType} event - **Argument:** `Discord Event (Listed)`
     * @param {Function} callback - **Argument:** `Callback Function When Event Is Triggered`
     * @returns {void}
     */
    on(event, callback) {
        this.bot.on(event, callback);
    }

    /**
     * ## Set User's Data
     * ```
     * await ds.setUserData(data: Object, id?: String);
     * ```
     * **Docs: {@link https://ephf.gitbook.io/discord-short/mongodb/user-data User Data}**
     * @param {Object} data - **Argument:** `New Data (Object)`
     * @param {String?} id - **Argument:** `User's ID Whos Data Is Being Set` [optional]
     * @returns {void}
     */
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

    /**
     * ## Get User's Data
     * ```
     * const userData = await ds.getUserData(id?: String);
     * ```
     * **Docs: {@link https://ephf.gitbook.io/discord-short/mongodb/user-data User Data}**
     * @param {String?} id  - **Argument:** `User ID Of Data You Are Getting` [Optional]
     * @returns {Promise<Object>}
     */
    async getUserData(id) {
        let userdat = schemas.user;
        let dat = await userdat.findOne({_id: id ? id : this.data.config.author.id});
        if(!dat.data) dat.data = {};
        return dat ? dat.data : this.data.db.user;
    }

    /**
     * ## Get All User Data
     * ```
     * const allUserData = await ds.getAllUserData();
     * ```
     * **Docs: {@link https://ephf.gitbook.io/discord-short/mongodb/user-data User Data}**
     * @returns {Promise<Object[]>}
     */
    async getAllUserData() {
        let userdat = schemas.user;
        let res = await userdat.find({});
        return res;
    }

    /**
     * ## Set Default User Data
     * ```
     * ds.defaultUserData(data: Object);
     * ```
     * **Docs: {@link https://ephf.gitbook.io/discord-short/mongodb/user-data User Data}**
     * @param {Object} data - **Argument:** `Default Data (Object)`
     * @returns {void}
     */
    defaultUserData(data) {
        this.data.db.user = data;
    }

    /**
     * ## Set Guild's Data
     * ```
     * await ds.setGuildData(data: Object, id?: String);
     * ```
     * **Docs: {@link https://ephf.gitbook.io/discord-short/mongodb/server-data Server Data}**
     * @param {Object} data - **Argument:** `New Data (Object)`
     * @param {String?} id - **Argument:** `Guild's ID Whos Data Is Being Set` [Optional]
     * @returns {Promise<void>}
     */
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

    /**
     * ## Get Guild's Data
     * ```
     * const guildData = await ds.getGuildData(id?: String);
     * ```
     * **Docs: {@link https://ephf.gitbook.io/discord-short/mongodb/server-data Server Data}**
     * @param {String?} id - **Argument:** `Guild ID Of Data You Are Getting` [Optional]
     * @returns {Promise<Object>}
     */
    async getGuildData(id) {
        let serverdat = schemas.server;
        let dat = await serverdat.findOne({_id: id ? id : this.data.config.guild.id});
        if(!dat.data) dat.data = {};
        return dat ? dat.data : this.data.db.server;
    }

    /**
     * ## Get All Guild Data
     * ```
     * const allGuildData = await ds.getAllGuildData();
     * ```
     * **Docs: {@link https://ephf.gitbook.io/discord-short/mongodb/server-data Server Data}**
     * @returns {Promise<Object[]>}
     */
    async getAllGuildData() {
        let serverdat = schemas.server;
        let res = await serverdat.find({});
        return res;
    }

    /**
     * ## Set Default Guild Data
     * ```
     * defaultGuildData(data: Object);
     * ```
     * **Docs: {@link https://ephf.gitbook.io/discord-short/mongodb/server-data Server Data}**
     * @param {Object} data - **Argument:** `Default Data (Object)`
     * @returns {void}
     */
    defaultGuildData(data) {
        this.data.db.server = data;
    }

    /**
     * ## Discord.Short Login
     * ```
     * await login({
     *  botToken: String,
     *  mongo?: {
     *   username: String,
     *   password: String,
     *   database?: String
     *  },
     *  heroku?: {
     *   name: String
     *  }
     * })
     * ```
     * **Docs {@link https://ephf.gitbook.io/discord-short/terminal-commands-creating-a-bot/creating-and-removing-bots Creating and Removing Bots}**
     * @param {{
     *  botToken: String,
     *  mongo?: {
     *      username: String,
     *      password: String,
     *      database?: String
     *  },
     *  heroku?: {
     *      name: String
     *  }
     * }} config 
     * @returns {void}
     */
    async login(config) {
        this.data.config = config;
        this.bot.login(config.botToken);
        this.bot.on('message', message => {
            if(message.author.id == this.bot.user.id) global.reply = message;
            parse.command(message, this);
        });
        this.bot.on('messageReactionAdd', (reaction, user) => {
            this._reactEvents.forEach(react => {
                if(react.reaction == reaction.emoji.name && reaction.message.id == react.message.id && user.id != this.bot.user.id) {
                    react.f({
                        user,
                        channel: react.message.channel,
                        message: react.message,
                        send(text) {
                            react.message.channel.send(text);
                        } 
                    });
                }
            });
        });
        this.bot.on('messageReactionRemove', (reaction, user) => {
            this._unreactEvents.forEach(react => {
                if(react.reaction == reaction.emoji.name && reaction.message.id == react.message.id && user.id != this.bot.user.id) {
                    react.f({
                        user,
                        channel: react.message.channel,
                        message: react.message,
                        send(text) {
                            react.message.channel.send(text);
                        } 
                    });
                }
            });
        });
        this.bot.on('ready', async () => { info('Your bot is online'); if(this.ready) await this.ready(); });
        if(config.mongo && this.settings.mongoConnect) {
            await require('./mongodb/mongo')(config).then(async item => {
                try {
                    info('Connected to MongoDB');
                    this.data.connected = true;
                }
                catch {
                    info('Couldn\'t connect to MongoDB');
                }
            });
        } else {
            this.data.connected = true;
        }
        if(config.heroku && this.settings.antiIdle) {
            require('./heroku/anti-idle')(config);
        }
    }
}

const Discord = {
    ShortClient
}

module.exports = Discord;