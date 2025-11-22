import { createConfig } from "ponder";

import { VamosAbi } from "./abis/VamosAbi";

export default createConfig({
  chains: {
    base: {
      id: 8453,
      rpc: process.env.PONDER_RPC_URL_BASE || "https://mainnet.base.org",
    },
    celo: {
      id: 42220,
      rpc: process.env.PONDER_RPC_URL_CELO || "https://forno.celo.org",
    },
  },
  contracts: {
    Vamos: {
      chain: {
        base: {
          address: (process.env.VAMOS_ADDRESS_BASE as `0x${string}`) || "0x0000000000000000000000000000000000000000",
          startBlock: Number(process.env.VAMOS_START_BLOCK_BASE) || 0,
        },
        celo: {
          address: (process.env.VAMOS_ADDRESS_CELO as `0x${string}`) || "0x0000000000000000000000000000000000000000",
          startBlock: Number(process.env.VAMOS_START_BLOCK_CELO) || 0,
        },
      },
      abi: VamosAbi,
    },
  },
});
