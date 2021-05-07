module.exports = {
    error() {
        let err = `\x1b[31m[discord.short error] ${Array.from(arguments).join('\n\x1b[31m[discord.short error] ')}\n\x1b[0m`;
        throw err;
    },
    success() {
        console.log(`\x1b[32m[discord.short] ${Array.from(arguments).join('\n\x1b[32m[discord.short] ')}\x1b[0m`);
    }
}