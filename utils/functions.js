import { HttpsProxyAgent } from "https-proxy-agent";
import { SocksProxyAgent } from "socks-proxy-agent";
import log from "./logger.js";
import fs from "fs/promises";
import axios from "axios";

export function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms * 1000));
}

export async function readFile(pathFile) {
  try {
    const datas = await fs.readFile(pathFile, "utf8");
    return datas
      .split("\n")
      .map((data) => data.trim())
      .filter((data) => data.length > 0);
  } catch (error) {
    return [];
  }
}

export async function checkMainIP() {
  try {
    const response = await axios.get("https://api.ipify.org?format=json");
    return response.data.ip;
  } catch (error) {
    console.error("Failed to get IP:", error.message || error);
    return null;
  }
}

export const getAgent = (proxy = null) => {
  try {
    if (proxy.startsWith("http://")) {
      return new HttpsProxyAgent(proxy);
    }
    return new SocksProxyAgent(proxy);
  } catch (err) {
    log.warn(`Error creating proxy agent: ${proxy}`);
    return null;
  }
};
