import { createConfig } from "ponder";

import { VamosAbi } from "./abis/VamosAbi";

export default createConfig({
  // database: { 
  //   kind: "postgres", 
  //   connectionString: process.env.DATABASE_URL, 
  // },
  chains: {
    base: {
      id: 8453,
      rpc: process.env.PONDER_RPC_URL_BASE,
    },
    // celo: {
    //   id: 42220,
    //   rpc: process.env.PONDER_RPC_URL_CELO,
    // },
    // sepolia: {
    //   id: 11155111,
    //   rpc: process.env.PONDER_RPC_URL_SEPOLIA,
    // },
  },
  contracts: {
    Vamos: {
      chain: {
        base: {
          address: (process.env.VAMOS_ADDRESS_BASE as `0x${string}`) || "0x0000000000000000000000000000000000000000",
          startBlock: Number(process.env.VAMOS_START_BLOCK_BASE) || 0,
        },
        // celo: {
        //   address: (process.env.VAMOS_ADDRESS_CELO as `0x${string}`) || (process.env.VAMOS_ADDRESS as `0x${string}`) || "0x0000000000000000000000000000000000000000",
        //   startBlock: Number(process.env.VAMOS_START_BLOCK_CELO) || Number(process.env.VAMOS_START_BLOCK) || 0,
        // },
      },
      abi: VamosAbi,
    },
  },
});
