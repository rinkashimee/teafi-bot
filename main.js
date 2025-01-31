import banner from "./utils/banner.js";
import log from "./utils/logger.js";
import { delay, readFile } from "./utils/functions.js";
import TeafiConnection from "./utils/teafi.js";
import chalk from "chalk";

async function main() {
  log.info(banner());
  await delay(2);

  const proxies = await readFile("proxy.txt");
  const wallets = await readFile("wallets.txt");

  if (wallets.length === 0) {
    log.error("No wallets found. Program terminated.");
    return;
  }
  if (proxies.length === 0) {
    log.warn(
      "No proxies detected in proxy.txt. Running without proxy support."
    );
  }

  log.info("Initializing program with all Wallets:", wallets.length);

  let counter = 0;
  while (true) {
    counter++;
    for (let i = 0; i < wallets.length; i++) {
      const privateKey = wallets[i % wallets.length];
      const proxy = proxies[i % proxies.length] || null;

      try {
        const teafi = new TeafiConnection(proxy, privateKey);

        const proxyUrl = new URL(proxy);
        const proxyHost = proxyUrl.hostname;

        log.info("-".repeat(100));
        log.info("Proxy using:", proxyHost);
        log.info(
          "Currently processing wallets:",
          `[${i + 1}/${wallets.length}]`
        );
        log.info(`Total transaction being processed:`, counter);

        const gasFee = await teafi.getGasQuote();
        const address = await teafi.sendTransaction(gasFee);
        await teafi.checkInUser(address);

        log.warn(`Waiting 3 seconds before processing next wallet...`);
        await delay(3);
      } catch (error) {
        log.error(`Error Processing account:`, error.message);
      }
    }

    let seconds = 10;
    while (seconds > 0) {
      const teafi = new TeafiConnection();
      const formattedTime = teafi.formatSeconds(seconds);
      process.stdout.write(
        `${chalk.yellow(
          `Pausing for ${formattedTime} seconds before re-running the bot...`
        )}\r`
      );
      await delay(1);
      seconds--;
    }
  }
}

main();
