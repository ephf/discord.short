const { Message } = require("discord.js");

module.exports = {
  /**
   *
   * @param {Message} m
   */
  async command(m) {
    const ds = global.currentDS;
    try {
      if (ds.data.connected || !ds.settings.mongoConnect || !ds.config.mongo) {
        for (let command of ds.data.commands) {
          let names = command.aliases || [];
          names.push(command.name);
          for (let name of names) {
            const regex = new RegExp(
              `^\\${ds.prefix} *${name} +|^\\${ds.prefix} *${name}$`
            );
            if (regex.test(m.content)) {
              let hasPerm = true;
              let permissions = [];
              if (command.permissions) {
                for (perm of command.permissions) {
                  if (
                    !m.guild.members.cache
                      .get(m.author.id)
                      .permissions.has(perm)
                  ) {
                    hasPerm = false;
                    permissions.push(perm);
                  }
                }
              }
              if (hasPerm) {
                let args = m.content
                  .replace(regex, "")
                  .replace(/^ */, "")
                  .split(/ +/);
                let config = {
                  message: m,
                  author: m.author,
                  channel: m.channel,
                  guild: m.guild,
                  label: name,
                  args,
                  async send(value) {
                    return await m.channel.send(value);
                  },
                };
                let index = -1;
                if (
                  ds.data.cooldowns[m.author.id] &&
                  ds.data.cooldowns[m.author.id][command.name]
                ) {
                  config.timeleft =
                    ds.data.cooldowns[m.author.id][command.name];
                  if (command.failedCooldown) {
                    await command.failedCooldown(config);
                  } else {
                    await ds.data.failedCooldown(config);
                  }
                  return;
                }
                const failArguments = async (type) => {
                  config.type = type;
                  config.argument = command.arguments[index];
                  config.number = index;
                  ds.data.config = config;
                  if (command.failedArguments) {
                    await command.failedArguments(config);
                  } else {
                    await ds.data.failedArguments(config);
                  }
                };
                if (command.arguments)
                  for (let arg of command.arguments) {
                    index++;
                    if (arg.required && !args[index]) {
                      return await failArguments("missing");
                    }
                    if (!arg.required && !args[index]) {
                      break;
                    }
                    if (arg.type == "number") {
                      if (isNaN(Number(args[index]))) {
                        return await failArguments("incorrect");
                      } else {
                        args[index] = Number(args[index]);
                      }
                    }
                    if (arg.type == "boolean") {
                      if (args[index] != "true" && args[index] != "false") {
                        return await failArguments("incorrect");
                      } else {
                        args[index] = args[index] == "true" ? true : false;
                      }
                    }
                    if (arg.type == "user") {
                      const rx = /^<@([0-9]+)>$|^<@!([0-9]+)>$/;
                      if (!rx.test(args[index])) {
                        return await failArguments("incorrect");
                      } else {
                        let id =
                          rx.exec(args[index])[1] || rx.exec(args[index])[2];
                        if (!(await m.guild.members.cache.get(id))) {
                          return await failArguments("notfound");
                        } else {
                          args[index] = await m.guild.members.cache.get(id);
                        }
                      }
                    }
                    if (arg.type == "channel") {
                      const rx = /^<#([0-9]+)>$|^<#!([0-9]+)>$/;
                      if (!rx.test(args[index])) {
                        return await failArguments("incorrect");
                      } else {
                        let id =
                          rx.exec(args[index])[1] || rx.exec(args[index])[2];
                        if (!(await m.guild.channels.cache.get(id))) {
                          return await failArguments("notfound");
                        } else {
                          args[index] = await m.guild.channels.cache.get(id);
                        }
                      }
                    }
                    if (arg.type == "role") {
                      const rx = /^<@([0-9]+)>$|^<@&([0-9]+)>$/;
                      if (!rx.test(args[index])) {
                        return await failArguments("incorrect");
                      } else {
                        let id =
                          rx.exec(args[index])[1] || rx.exec(args[index])[2];
                        if (!(await m.guild.roles.cache.get(id))) {
                          return await failArguments("notfound");
                        } else {
                          args[index] = await m.guild.roles.cache.get(id);
                        }
                      }
                    }
                    if (arg.type == "mention") {
                      const rx = /^<@([0-9]+)>$|^<@!([0-9]+)>$|^<@&([0-9]+)>$/;
                      if (!rx.test(args[index])) {
                        return await failArguments("incorrect");
                      } else {
                        let id =
                          rx.exec(args[index])[1] ||
                          rx.exec(args[index])[2] ||
                          rx.exec(args[index])[3];
                        if (
                          !(await m.guild.roles.cache.get(id)) &&
                          !(await m.guild.members.cache.get(id))
                        ) {
                          return await failArguments("notfound");
                        } else {
                          args[index] =
                            (await m.guild.roles.cache.get(id)) ||
                            (await m.guild.members.cache.get(id));
                        }
                      }
                    }
                  }
                ds.data.config = config;
                await command.execute(config);
                if (command.cooldown) {
                  if (!ds.data.cooldowns[m.author.id])
                    ds.data.cooldowns[m.author.id] = {};
                  ds.data.cooldowns[m.author.id][command.name] =
                    command.cooldown;
                  let time = 0;
                  let interval = setInterval(() => {
                    time++;
                    ds.data.cooldowns[m.author.id][command.name] =
                      command.cooldown - time;
                    if (time >= command.cooldown) {
                      clearInterval(interval);
                    }
                  }, 1000);
                }
                return;
              } else {
                let args = m.content
                  .replace(regex, "")
                  .replace(/^ */, "")
                  .split(/ +/);
                let config = {
                  message: m,
                  author: m.author,
                  channel: m.channel,
                  guild: m.guild,
                  label: name,
                  args,
                  permissions,
                  async send(value) {
                    return await m.channel.send(value);
                  },
                };
                ds.data.config = config;
                if (command.failedPermissions) {
                  command.failedPermissions(config);
                } else {
                  ds.data.failedPermissions(config);
                }
                return;
              }
            }
          }
        }
      }
    } catch (e) {
      console.log(e);
      if (ds.data.error) {
        m.channel.send(ds.data.error);
      }
    }
  },
};
