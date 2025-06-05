import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import * as dotenv from "dotenv";

dotenv.config();

// Asegúrate de tener tu PRIVATE_KEY en el archivo .env
const PRIVATE_KEY = process.env.PRIVATE_KEY || "";
const MANTLE_SEPOLIA_RPC = "https://rpc.sepolia.mantle.xyz";

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
      viaIR: true
    }
  },
  networks: {
    mantleSepolia: {
      url: MANTLE_SEPOLIA_RPC,
      accounts: [PRIVATE_KEY],
      chainId: 5003,
      timeout: 60000,
      gasMultiplier: 1.2
    },
    hardhat: {
      chainId: 31337
    },
    mantleTestnet: {
      url: "https://rpc.testnet.mantle.xyz",
      accounts: [process.env.PRIVATE_KEY || ""]
    }
  },
  etherscan: {
    apiKey: {
      mantleSepolia: "no-api-key-needed"
    },
    customChains: [
      {
        network: "mantleSepolia",
        chainId: 5003,
        urls: {
          apiURL: "https://explorer.sepolia.mantle.xyz/api",
          browserURL: "https://explorer.sepolia.mantle.xyz"
        }
      }
    ]
  }
};

export default config;
