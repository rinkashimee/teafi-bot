import figlet from "figlet";
import chalk from "chalk";

const banner = () => {
  const textBanner = figlet.textSync("Tea-Fi Bot", {
    font: "ANSI Shadow",
    horizontalLayout: "default",
    verticalLayout: "default",
    width: 100,
  });

  let output = [];
  output.push("\x1b[2J\x1b[H");
  output.push(`${chalk.magenta(textBanner)}`);
  output.push(`${chalk.cyan("Twitter: https://x.com/rinkashi_me")}\n`);

  return output.join("\n");
};

export default banner;
