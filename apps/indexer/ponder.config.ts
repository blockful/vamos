import { createConfig } from "ponder";

import { VamosAbi } from "./abis/VamosAbi";

export default createConfig({
  chains: {
    base: {
      id: 8453,
      rpc: process.env.RPC_URL || "https://mainnet.base.org",
    },
    celo: {
      id: 42220,
      rpc: process.env.RPC_URL || "https://forno.celo.org",
    },
    sepolia: {
      id: 11155111,
      rpc: process.env.RPC_URL,
    },
  },
  contracts: {
    Vamos: {
      chain: {
        // base: {
        //   address: (process.env.VAMOS_ADDRESS_BASE as `0x${string}`) || "0x0000000000000000000000000000000000000000",
        //   startBlock: Number(process.env.VAMOS_START_BLOCK_BASE) || 0,
        // },
        celo: {
          address: (process.env.VAMOS_ADDRESS as `0x${string}`) || "0x0000000000000000000000000000000000000000",
          startBlock: Number(process.env.VAMOS_START_BLOCK) || 0,
        },
        // sepolia: {
        //   address: (process.env.VAMOS_ADDRESS as `0x${string}`),
        //   startBlock: Number(process.env.VAMOS_START_BLOCK) || 0,
        // },
      },
      abi: VamosAbi,
    },
  },
});
