import chalk from "chalk";

const logger = {
  info: (message, data = "") => logger.log("info", message, data),
  warn: (message, data = "") => logger.log("warn", message, data),
  error: (message, data = "") => logger.log("error", message, data),
  success: (message, data = "") => logger.log("success", message, data),
  debug: (message, data = "") => logger.log("debug", message, data),
  log: (code, message, data = "") => {
    const date = new Date().toLocaleString();

    const colorSelection = {
      info: chalk.cyan,
      warn: chalk.yellow,
      error: chalk.red,
      success: chalk.green,
      debug: chalk.magenta,
    };

    const color = colorSelection[code] || chalk.white;
    const codeTag = `[${code.toUpperCase()}]`;
    const timestamp = `[${date}]`;

    const formattedMessage = `${chalk.white(timestamp)} ${color(codeTag)}: ${
      code === "debug" || code === "warn" ? color(message) : message
    }`;

    let formattedValue = ` ${chalk.green(data)}`;
    if (code === "error") {
      formattedValue = ` ${chalk.red(data)}`;
    } else if (code === "warn") {
      formattedValue = ` ${chalk.yellow(data)}`;
    }

    if (typeof data === "object") {
      const valueColor = code === "error" ? chalk.red : chalk.green;
      formattedValue = ` ${valueColor(JSON.stringify(data))}`;
    }

    console.log(`${formattedMessage}${formattedValue}`);
  },
};

export default logger;
