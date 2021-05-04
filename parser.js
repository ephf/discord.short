const ds = require("./discordshort");

String.prototype.remFirst = function(item) {
    let text = this;
    text = text.split(item);
    text.shift();
    text = text.join(item);
    return text;
}

module.exports = {
    command(m) {
        global.ds.data.onmessage();
        if(global.ds.data.connected) {
            let text = m.content;
            let prefix = global.ds.data.prefix;
            if(text.split(prefix).length > 1 && text.split(prefix)[0] == '') {
                text = text.remFirst(prefix);
                for(command of global.ds.data.commands) {
                    let names = command.aliases;
                    if(!names) {
                        names = [command.name];
                    } else {
                        names.push(command.name);
                    }
                    for(com of names) {
                        let through = text.split('');
                        text = through;
                        let found = false;
                        while(through.length > 1) {
                            if(through[0] == ' ') {
                                through.shift();
                            } else {
                                found = true;
                                through = [];
                            }
                        }
                        text = text.join('');
                        if(found && text.split(com + ' ').length > 1 && text.split(com + ' ')[0] == '' || text.split(com).join('') == '' && text != '') {
                            text = text.remFirst(com + ' ');
                            let config = {
                                message: m,
                                author: m.author,
                                channel: m.channel,
                                guild: m.guild,
                                label: com,
                                args: text.split(' '),
                                send(value) {m.channel.send(value)}
                            }
                            global.ds.data.config = config;
                            command.execute(config);
                        }
                    }
                }
            }
        }
    }
}