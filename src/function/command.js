const { Channel, User, Message, Guild } = require('discord.js');

module.exports = class Command {
    /**
     * ## Command
     * ```
     * new ds.Command({
     *  name: String,
     *  description?: String,
     *  aliases?: String[],
     *  setSlash?: Boolean, // description required
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
     *  send(text: String): Promise<void>
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
     *  send(text: String): Promise<void>
     * });
     * ```
     * **Docs: {@link https://ephf.gitbook.io/discord-short/creating-bot-commands Creating Bot Commands}**
     * 
     * @param {{
     *  name: String;
     *  description?: String;
     *  aliases?: String[];
     *  setSlash?: Boolean;
     *  permissions?: import("discord.js").PermissionResolvable[];
     *  execute({information}: {
     *      message: Message;
     *      author: User;
     *      channel: Channel;
     *      guild: Guild;
     *      label: String;
     *      args: String[];
     *      send(text: String): Promise<void>
     *  }): Promise<void>,
     *  failedPermissions?({information}: {
     *      message: Message;
     *      author: User;
     *      channel: Channel;
     *      guild: Guild;
     *      label: String;
     *      args: String[];
     *      permissions: import("discord.js").PermissionResolvable[];
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
                    if(options) 
                        args = options[0].value.split(' ');

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