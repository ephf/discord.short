const { Channel, User, Message, Guild } = require('discord.js');
const { error } = require('./message');

module.exports = class Command {
    /**
     * @typedef Argument
     * @type {{ name: String; description: String; type: ArgumentType; required: boolean; }}
     */

    /**
     * @typedef ArgumentType
     * @type {'any' | 'string' | 'number' | 'boolean' | 'user' | 'channel' | 'role' | 'mention'}
     */

    /**
     * @typedef FailedArgumentType
     * @type {'missing' | 'incorrect' | 'notfound'}
     */

    /**
     * ## Command
     * ```
     * new ds.Command({
     *  name: String,
     *  description?: String,
     *  aliases?: String[],
     *  setSlash?: Boolean, // description required
     *  arguments?: Argument[],
     *  permissions?: import("discord.js").PermissionResolvable[],
     *  async execute({...}): Promise<void> // has to be async
     * });
     * ```
     * ## Execute
     * ```
     * await execute({
     *  message: Message,
     *  author: User,
     *  channel: Channel,
     *  guild: Guild,
     *  label: String,
     *  args: String[],
     *  send(text: String): Promise<Message>,
     *  slashSend(reply: String): Promise<void> // only if its a slash command
     * });
     * ```
     * ## Failed Permissions
     * ```
     * await failedPermissions({
     *  message: Message,
     *  author: User,
     *  channel: Channel,
     *  guild: Guild,
     *  label: String,
     *  args: String[],
     *  permissions: import("discord.js").PermissionResolvable[];
     *  send(text: String): Promise<Message>
     * });
     * ```
     * ## Failed Arguments
     * ```
     * await failedArguments({
     *  message: Message,
     *  author: User,
     *  channel: Channel,
     *  guild: Guild,
     *  label: String,
     *  args: String[],
     *  argument: Argument,
     *  type: FailedArgumentType,
     *  send(text: String): Promise<Message>
     * });
     * ```
     * **Docs: {@link https://ephf.gitbook.io/discord-short/creating-bot-commands Creating Bot Commands}**
     * 
     * @param {{
     *  name: String;
     *  description?: String;
     *  aliases?: String[];
     *  setSlash?: Boolean;
     *  arguments?: Argument[];
     *  permissions?: import("discord.js").PermissionResolvable[];
     *  execute({information}: {
     *      message: Message;
     *      author: User;
     *      channel: Channel;
     *      guild: Guild;
     *      label: String;
     *      args: String[];
     *      send(text: String): Promise<void>;
     *      slashSend(reply: String): Promise<void>;
     *  }): Promise<void>;
     *  failedPermissions?({information}: {
     *      message: Message;
     *      author: User;
     *      channel: Channel;
     *      guild: Guild;
     *      label: String;
     *      args: String[];
     *      permissions: import("discord.js").PermissionResolvable[];
     *      send(text: String): Promise<Message>;
     *  }): Promise<void>;
     *  failedArguments?({information}: {
     *      message: Message;
     *      author: User;
     *      channel: Channel;
     *      guild: Guild;
     *      label: String;
     *      args: String[];
     *      argument: Argument;
     *      type: FailedArgumentType;
     *      send(text: String): Promise<Message>;
     *  }): Promise<void>;
     * }} config - **Argument:** `Command Configuration`
     */
    constructor(config) {
        if(!config.name) error('Your command is missing a name');
        if(!config.execute) error('Your command is missing an execute function');

        if(config.setSlash) {
            if(!config.description) error('Your command is missing a description');

            global.currentDS.bot.on('ready', async () => {
                let options = [];
                if(config.arguments) {
                    let count = 0;
                    for(let arg of config.arguments) {
                        if(!arg.name)
                            arg.name = `argument_${++count}`;
                        if(!arg.description)
                            arg.description = 'This argument doesn\'t have a description';
                        if(!arg.required)
                            arg.required = false;
                        if(arg.type == 'string' || arg.type == 'any')
                            arg.type = 3;
                        if(arg.type == 'number')
                            arg.type = 4;
                        if(arg.type == 'boolean')
                            arg.type = 5;
                        if(arg.type == 'user')
                            arg.type = 6;
                        if(arg.type == 'channel')
                            arg.type = 7;
                        if(arg.type == 'role')
                            arg.type = 8;
                        if(arg.type == 'mention')
                            arg.type = 9;
                        if(typeof arg.type != 'number')
                            error(`Unknown command type: "${arg.type}"`);
                        options.push(arg);
                    }
                }

                await global.currentDS.bot.api.applications(global.currentDS.bot.user.id).guilds(config.guild).commands.post({
                    data: {
                        name: config.name,
                        description: config.description,
                        options: options || [
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
                    if(options && !config.arguments) 
                        args = options[0].value.split(' ');
                    else if(config.arguments) {
                        args = options;
                        args.forEach((arg, i) => {
                            args[i] = arg.value;
                        })
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
        global.currentDS.commands.set(config.name, config);
    }
}