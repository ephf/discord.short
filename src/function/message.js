module.exports = {
  info() {
    console.log(
      `${process.env.PORT ? "" : "\x1b[33m"}[${global.currentDS.name}]${
        process.env.PORT ? "" : "\x1b[0m"
      } ${process.env.PORT ? "" : "\x1b[36m"}[discord.short] ` +
        Array.from(arguments).join("\n[discord.short] ") +
        (process.env.PORT ? "" : "\x1b[0m")
    );
  },
  error() {
    throw new Error(
      `${process.env.PORT ? "" : "\x1b[33m"}[${global.currentDS.name}]${
        process.env.PORT ? "" : "\x1b[0m"
      } ${process.env.PORT ? "" : "\x1b[31m"}[discord.short error] ` +
        Array.from(arguments).join("\n[discord.short error] ") +
        (process.env.PORT ? "" : "\x1b[0m")
    );
  },
};
