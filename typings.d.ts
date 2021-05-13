import { Message, BaseClient, User, Channel, Guild, WSEventType } from "discord.js"

declare const ds: Client;

declare const Discord: {
    Client: Client
}

export class Command {
    constructor(config: CommandBuild);
}

export class Client {
    private data: Object;
    private settings: Object;
    private reactEvents: Object[];
    private unreactEvents: Object[];

    public name: String;
    public readonly bot;
    public prefix: String;
    public readonly Command: Command;

    constructor(name: String, settings?: ClientSettings);

    public getNextReply(): Promise<void>;
    public deleteSlashCommand(id: String, guild?: string): Promise<void>;
    public getSlashCommands(guild?: String): Promise<Object[]>;
    public setUserData(data: Object, id?: String): Promise<void>;
    public getUserData(id?: String): Promise<Object>;
    public getAllUserData(): Promise<Object[]>
    public setGuildData(data: Object, id?: String): Promise<void>;
    public getGuildData(id?: String): Promise<Object>;
    public getAllGuildData(): Promise<Object[]>
    public login(config: ClientLogin): Promise<void>;

    public reactEvent(message: Message, reaction: String, callback: Function): void;
    public unreactEvent(message: Message, reaction: String, callback: Function): void;
    public setPrefix(prefix: String): void;
    public on(event: String, callback: Function): void;
    public defaultUserData(data: Object): void;
    public defaultGuildData(data: Object): void;
}

type CommandBuild = {
    name: String;
    description?: String;
    setSlash?: Boolean;

    execute(config: CommandExecute): Promise<void>;
}

type CommandExecute = {
    message?: Message;
    author?: User;
    channel?: Channel;
    guild?: Guild;
    label?: String;
    args?: String[];

    send?(text: String): void;
}

type ClientLogin = {
    botToken: String;

    mongo?: {
        username: String;
        password: String;
        database?: String;
    }

    heroku?: {
        name: String;
    }
}

type ClientSettings = {
    antiIdle?: Boolean;
    mongoConnect?: Boolean;
}