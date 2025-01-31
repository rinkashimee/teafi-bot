import { getAgent, delay } from "./functions.js";
import { ethers, formatUnits } from "ethers";
import log from "./logger.js";
import chalk from "chalk";
import axios from "axios";
import ora from "ora";

class TeafiConnection {
  constructor(proxy = null, privateKey = null) {
    this.proxy = proxy;
    this.privateKey = privateKey;
    this.axiosConfig = {
      ...(this.proxy && { httpsAgent: getAgent(this.proxy) }),
    };

    this.pol_symbol = "POL";
    this.wpol_symbol = "WPOL";
    this.pol_address = "0x0000000000000000000000000000000000000000";
    this.wpol_address = "0x0d500b1d8e8ef31e21c99d1db9a6444d3adf1270";
    this.network_id = 137;
    this.type = 2;

    this.contract_address = "0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270";
    this.rpc_url = "https://polygon-rpc.com";
    this.min = 0.00001;
    this.max = 0.001;
    this.abi = ["function deposit() external payable"];
  }

  formatSeconds(seconds) {
    seconds = seconds % 60;
    return `${String(seconds).padStart(1, "0")}`;
  }

  async sendRequest(method, url, config = {}, retries = 5) {
    for (let i = 0; i < retries; i++) {
      try {
        const response = await axios({
          method,
          url,
          ...this.axiosConfig,
          ...config,
        });
        return response;
      } catch (error) {
        if (i === retries - 1) {
          log.error(`Max retries reached - Request failed:`, error.message);
          return null;
        }

        process.stdout.write(
          chalk.yellow(
            `Request failed: ${error.message} => Retrying... (${
              i + 1
            }/${retries})\r`
          )
        );
        await delay(3);
      }
    }
    return null;
  }

  async getGasQuote() {
    try {
      const url = "https://api.tea-fi.com/transaction/gas-quote";
      const params = {
        chain: this.network_id,
        txType: this.type,
        gasPaymentToken: this.pol_address,
        neededGasPermits: 0,
      };

      const response = await this.sendRequest("get", url, { params });
      const gasInNativeToken = response?.data?.gasInNativeToken || "0";

      log.info(
        "Gas In Native Token:",
        `${formatUnits(gasInNativeToken, 18)} POL`
      );
      return gasInNativeToken;
    } catch (error) {
      log.error(
        "Error fetching gas:",
        error.response ? error.response.data : error.message
      );
      return "0";
    }
  }

  async sendDepositTransaction() {
    let spinner;
    const provider = new ethers.JsonRpcProvider(this.rpc_url);
    const wallet = new ethers.Wallet(this.privateKey, provider);
    const contract = new ethers.Contract(
      this.contract_address,
      this.abi,
      wallet
    );

    try {
      const randomAmount = (
        Math.random() * (this.max - this.min) +
        this.min
      ).toFixed(8);
      const amountToSend = ethers.parseEther(randomAmount.toString());

      log.debug(`Wrapping ${randomAmount} POL to WPOL...`);
      const feeData = await provider.getFeeData();

      const gasPrice = feeData.gasPrice
        ? (feeData.gasPrice * 125n) / 100n
        : undefined;

      const tx = await contract.deposit({
        value: amountToSend,
        gasPrice,
      });

      log.info(`Transaction Sent at hash:`, tx.hash);
      spinner = ora(
        chalk.magenta("[Processing] Waiting for confirmation...")
      ).start();

      const timeout = new Promise((_, reject) =>
        setTimeout(
          () => reject(new Error("Transaction confirmation timeout")),
          120 * 1000
        )
      );

      const receipt = await Promise.race([tx.wait(), timeout]);
      spinner.succeed(
        chalk.green(
          `[Success] Transaction confirmed in block: ${receipt.blockNumber}`
        )
      );
      return {
        txHash: tx.hash,
        address: wallet.address,
        amount: amountToSend.toString(),
      };
    } catch (error) {
      if (spinner) {
        spinner.fail(chalk.red(`[Error] Transaction failed: ${error.message}`));
      } else {
        log.error("Error sending transaction:", error.message);
      }

      return { txHash: null, address: wallet.address, amount: null };
    }
  }

  async getPoints(address) {
    log.debug("Trying to check current points...");
    try {
      const url = `https://api.tea-fi.com/points/${address}`;
      const response = await this.sendRequest("get", url, {}, 1);

      log.info("Total Points:", response?.data?.pointsAmount || 0);
    } catch (error) {
      log.error(
        "Error When Checking Points:",
        error.response?.data || error.message
      );
    }
  }

  async sendTransaction(gasFee) {
    const { txHash, address, amount } = await this.sendDepositTransaction();

    log.debug(`Trying to send tx report to backend:`, txHash);

    const url = "https://api.tea-fi.com/transaction";
    const payload = {
      hash: txHash,
      blockchainId: this.network_id,
      type: this.type,
      walletAddress: address,
      fromTokenAddress: this.pol_address,
      toTokenAddress: this.wpol_address,
      fromTokenSymbol: this.pol_symbol,
      toTokenSymbol: this.wpol_symbol,
      fromAmount: amount,
      toAmount: amount,
      gasFeeTokenAddress: this.pol_address,
      gasFeeTokenSymbol: this.pol_symbol,
      gasFeeAmount: gasFee,
    };

    try {
      const response = await this.sendRequest("post", url, { data: payload });

      if (response?.data) {
        log.info("Transaction Report Succesfully Sent:", response?.data);
      }

      await this.getPoints(address);
      return address;
    } catch (error) {
      log.error(
        "Failed To Send Transaction Report:",
        error.response?.data || error.message
      );
      return address;
    }
  }

  async checkInStatus(address) {
    try {
      const url = `https://api.tea-fi.com/wallet/check-in/current?address=${address}`;
      const response = await this.sendRequest("get", url, {}, 1);

      log.info(
        "Last CheckIn:",
        response?.data?.lastCheckIn || `Never check in`
      );
      return response?.data?.lastCheckIn;
    } catch (error) {
      log.error(
        "Failed to Check latest checkIn:",
        error.response?.data || error.message
      );
    }
  }

  async checkIn(address) {
    try {
      const url = `https://api.tea-fi.com/wallet/check-in?address=${address}`;
      const response = await this.sendRequest("post", url, {}, 1);

      log.info("Check-In Succesfully:", response.data);
    } catch (error) {
      log.error("Failed to Check-In:", error.response?.data || error.message);
    }
  }

  async checkInUser(address) {
    log.debug("Trying to check latest checkin user...");
    const lastCheckIn = await this.checkInStatus(address);

    const lastDate = new Date(lastCheckIn).getUTCDate();
    const now = new Date().getUTCDate();

    if (lastCheckIn && lastDate !== now) {
      log.debug("Trying to checkin...");
      await this.checkIn(address);
    } else {
      log.info("Already checkin today...");
    }
  }
}

export default TeafiConnection;
