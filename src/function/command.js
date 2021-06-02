const { Channel, User, Message, Guild } = require("discord.js");
const { error } = require("./message");

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
   *  slash?: Boolean | 'both', // description required
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
   *  send(text: String): Promise<Message>
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
   * ## Failed Cooldown
   * ```
   * await failedCooldown({
   *  message: Message,
   *  author: User,
   *  channel: Channel,
   *  guild: Guild,
   *  label: String,
   *  args: String[],
   *  timeleft: Number,
   *  send(text: String): Promise<Message>
   * });
   * ```
   * **Docs: {@link https://ephf.gitbook.io/discord-short/creating-bot-commands Creating Bot Commands}**
   *
   * @param {{
   *  name: String;
   *  description?: String;
   *  aliases?: String[];
   *  slash?: Boolean | 'both';
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
   *  failedCooldown?({information}: {
   *      message: Message;
   *      author: User;
   *      channel: Channel;
   *      guild: Guild;
   *      label: String;
   *      args: String[];
   *      timeleft: String;
   *      send(text: String): Promise<Message>;
   *  }): Promise<void>;
   * }} config - **Argument:** `Command Configuration`
   */
  constructor(config) {
    if (!config.name) error("Your command is missing a name");
    if (!config.execute) error("Your command is missing an execute function");

    if (config.slash || config.slash == "both") {
      if (!config.description) error("Your command is missing a description");

      global.currentDS.bot.on("ready", async () => {
        let options = [];
        if (config.arguments) {
          let count = 0;
          for (let arg of config.arguments) {
            if (!arg.name) arg.name = `argument_${++count}`;
            if (!arg.description)
              arg.description = "This argument doesn't have a description";
            if (!arg.required) arg.required = false;
            if (arg.type == "string" || arg.type == "any") arg.type = 3;
            if (arg.type == "number") arg.type = 4;
            if (arg.type == "boolean") arg.type = 5;
            if (arg.type == "user") arg.type = 6;
            if (arg.type == "channel") arg.type = 7;
            if (arg.type == "role") arg.type = 8;
            if (arg.type == "mention") arg.type = 9;
            if (typeof arg.type != "number")
              error(`Unknown command type: "${arg.type}"`);
            options.push(arg);
          }
        }

        let app = await global.currentDS.bot.api.applications(
          global.currentDS.bot.user.id
        );
        if (config.guild != undefined) {
          app = await app.guilds(config.guild);
        }
        await app.commands.post({
          data: {
            name: config.name,
            description: config.description,
            options:
              options.length > 0
                ? options
                : [
                    {
                      name: "arguments",
                      description: "The arguments after the command",
                      required: false,
                      type: 3,
                    },
                  ],
          },
        });

        global.currentDS.bot.ws.on(
          "INTERACTION_CREATE",
          async (interaction) => {
            const command = interaction.data.name;
            const options = interaction.data.options;

            let args = [];
            if (options && !config.arguments)
              args = options[0].value.split(" ");
            else if (config.arguments) {
              args = options;
              args.forEach((arg, i) => {
                args[i] = arg.value;
              });
            }
            const channel = global.currentDS.bot.channels.cache.get(
              interaction.channel_id
            );
            if (command === config.name) {
              let hasPerms = true;
              let perms = [];
              if (config.permissions) {
                global.currentDS.bot.guilds.cache
                  .get(interaction.guild_id)
                  .members.cache.map((member) => {
                    if (member.id == interaction.member.user.id) {
                      for (let perm of config.permissions) {
                        if (!member.permissions.has(perm)) {
                          hasPerms = false;
                          perms.push(perm);
                        }
                      }
                    }
                  });
              }
              let interacted = false;
              const information = {
                async send(content) {
                  if (!interacted) {
                    interacted = true;
                    return await global.currentDS.bot.api
                      .interactions(interaction.id, interaction.token)
                      .callback.post({
                        data: {
                          type: 4,
                          data: {
                            content,
                          },
                        },
                      });
                  } else {
                    return await channel.send(content);
                  }
                },
                interaction,
                channel,
                guild: global.currentDS.bot.guilds.cache.get(
                  interaction.guild_id
                ),
                author: interaction.member.user,
                args,
              };
              if (hasPerms) {
                if (
                  global.currentDS.data.cooldowns[interaction.member.user.id] &&
                  global.currentDS.data.cooldowns[interaction.member.user.id][
                    config.name
                  ]
                ) {
                  information.timeleft =
                    global.currentDS.data.cooldowns[interaction.member.user.id][
                      config.name
                    ];
                  if (config.failedCooldown) {
                    await config.failedCooldown(information);
                  } else {
                    await global.currentDS.data.failedCooldown(information);
                  }
                  return;
                }
                await config.execute(information);
                if (config.cooldown) {
                  if (
                    !global.currentDS.data.cooldowns[interaction.member.user.id]
                  )
                    global.currentDS.data.cooldowns[
                      interaction.member.user.id
                    ] = {};
                  global.currentDS.data.cooldowns[interaction.member.user.id][
                    config.name
                  ] = config.cooldown;
                  let time = 0;
                  let interval = setInterval(() => {
                    time++;
                    global.currentDS.data.cooldowns[interaction.member.user.id][
                      config.name
                    ] = config.cooldown - time;
                    if (time >= config.cooldown) {
                      clearInterval(interval);
                    }
                  }, 1000);
                }
              } else {
                if (config.failedPermissions) {
                  await config.failedPermissions(information);
                } else {
                  global.currentDS.data.failedPermissions(information);
                }
              }
            }
          }
        );
      });
    } else {
      global.currentDS.data.commands.push(config);
    }
    if (config.slash == "both") global.currentDS.data.commands.push(config);
    global.currentDS.commands.set(config.name, config);
  }
};
