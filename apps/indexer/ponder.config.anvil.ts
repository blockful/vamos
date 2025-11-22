import { createConfig } from "ponder";

import { VamosAbi } from "./abis/VamosAbi";

export default createConfig({
  chains: {
    anvil: {
      id: 31337,
      rpc: process.env.PONDER_RPC_URL_ANVIL || "http://127.0.0.1:8545",
    },
  },
  contracts: {
    Vamos: {
      chain: "anvil",
      abi: VamosAbi,
      address: (process.env.VAMOS_ADDRESS_ANVIL as `0x${string}`) || "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512",
      startBlock: 0,
    },
  },
});

