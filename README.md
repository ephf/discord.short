# Discord.short (discord.js addon)

discord.short is an easier way to make discord bots!

it also comes with special addons like easier mongoDB access, and heroku anti-idling!

heres how to get started

# How it works

first, you want to download the package using this command:

```concole
npm install discord.short --save
```

then create a main file, and set it up like this:

```js
const ds = require('discord.short');
```

then, you can login to your bot, mongoDB, and heroku,

```js
const ds = require('discord.short');

//login
ds.login({
    botToken: 'your-bot-token',
    mongo: { // not required
        username: 'mongoDB-connection-username',
        password: 'mongoDB-connection-password',
        database: 'name-of-your-database'
    },
    heroku: { // not required
        name: 'heroku-project-name'
    }
});
```

# How to make commands

Now that you have logged in, you can create commands like this:

```js
const { MessageEmbed } = require('discord.js'); // getting the message embed from discord.js (not relevant)

ds.setPrefix('!'); // set the bot's prefix

new ds.Command({
    name: 'help', // name of command
    aliases: ['saveme', 'h'], // any aliases that you want to add (must be an array)
    execute({send, author}) { // function when the command is called
        send(new MessageEmbed({
            title: `Hi, ${author.username}`,
            description: 'This is a really cool bot, but right now, this is all it does!',
            footer: {
                text: 'Come back next time!'
            }
        }));
    }
});
```

in the execute function, you can get any of these inputs `execute({name})`:

* "message" (message) - the message that is sent
* "author" (message.author) - the person that send the message
* "channel" (message.channel) - the channel the message is sent in
* "guild" (message.guild) - the server the message is sent in
* "label" (N/A) - the alias used
* \[args] (N/A) - the arguments written after the command
* send() (message.channel.send) - a function to send a message in the channel that the command was executed in

# Storing data more easily

with discord.short, you can store mongoDB data faster!

when running your command, you also have to do one function to get the data you want, here they are:

```js
async execute({}) {
    ds.defaultUserData({
        data: 'yeah, or maybe'
    }); // sets the default data for all users

    ds.defaultGuildData({
        data: 'perhaps'
    }); // sets the default data for all server

    await ds.setUserData({
        data: 'yes'
    }); // sets data for the user who executed the command (second argument could be a different user id)

    await ds.setGuildData({
        data: 'si'
    }); // sets data for the server which the command was executed in (second argument could be a different server id)

    let userData = await ds.getUserData(); // get the user data from the person who executed the command
    let allUserData = await ds.getAllUserData(); // gets all user data, go into .data for each to get the saved data, ._id is the user id

    let serverData = await ds.getServerData(); // get the server data from which the command was executed in
    let allServerData = await ds.getAllServerData(); // gets all server data, go into .data for each to get the saved data, ._id is the server id
}
```

Other than that, you're good to go!

Hope this helps!