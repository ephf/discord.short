const ds = require("./discordshort");

String.prototype.remFirst = function(item) {
    let text = this;
    text = text.split(item);
    text.shift();
    text = text.join(item);
    return text;
}

module.exports = {
    async command(m) {
        const ds = global.currentDS;
        try {
            if(ds.data.connected || !ds.settings.mongoConnect || !ds.config.mongo) {
                for(command of ds.data.commands) {
                    let names = command.aliases || [];
                    names.push(command.name);
                    for(name of names) {
                        const regex = new RegExp(`${ds.prefix} *${name}`);
                        if(regex.test(m.content)) {
                            let args = m.content.replace(regex, '').replace(/^ */, '').split(/ +/);
                            let config = {
                                message: m,
                                author: m.author,
                                channel: m.channel,
                                guild: m.guild,
                                label: name,
                                args,
                                send(value) {m.channel.send(value)}
                            }
                            ds.data.config = config;
                            await command.execute(config);
                            return;
                        }
                    }
                }
            }
        } catch(e) {
            console.log(e);
            if(ds.data.error) {
                m.channel.send(ds.data.error);
            }
        }
    }
}