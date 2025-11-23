import { CdpClient } from "@coinbase/cdp-sdk";
import { http, createPublicClient, extractChain, encodeFunctionData, parseAbi } from "viem";
import {
  base,
  baseSepolia,
  celo,
  celoSepolia,
  sepolia
} from "viem/chains";
import dotenv from "dotenv";

dotenv.config();

const VAMOS_ABI = parseAbi([
  'event MarketResolved(uint256 indexed marketId, uint256 indexed winningOutcome)',
  'function distribute(uint256 marketId) external returns (uint256 processed)'
])

const VAMOS_CONTRACT_ADDRESS = process.env.VAMOS_CONTRACT_ADDRESS as `0x${string}`;
const RPC_URL = process.env.RPC_URL as string
const CHAIN_ID = process.env.CHAIN_ID as string

export const SendEvmTransactionBodyNetwork = {
  base: "base",
  "base-sepolia": "base-sepolia",
  ethereum: "ethereum",
  sepolia: "ethereum-sepolia",
  avalanche: "avalanche",
  polygon: "polygon",
  optimism: "optimism",
  arbitrum: "arbitrum",
} as const;

const chain = extractChain({
  id: Number(CHAIN_ID) as any, chains: [
    base,
    baseSepolia,
    celoSepolia,
    celo,
    sepolia
  ]
});

if (!chain) {
  console.error("Invalid chain:", CHAIN_ID);
  process.exit(1);
}

const network = SendEvmTransactionBodyNetwork[
  chain.name.toLowerCase().split(" ").join("-") as keyof typeof SendEvmTransactionBodyNetwork];

if (!network) {
  console.error("Invalid network:", chain.name);
  process.exit(1);
}

(async () => {
  const cdp = new CdpClient();

  // Step 1: Create or use existing EVM account
  const account = await cdp.evm.createAccount();
  console.log("Server wallet address:", account.address);


  // Step 2: Create public client for listening to events
  const publicClient = createPublicClient({
    chain,
    transport: http(RPC_URL),
  });

  console.log("Listening for MarketResolved events...");

  // Step 3: Watch for MarketResolved events
  const unwatch = publicClient.watchContractEvent({
    address: VAMOS_CONTRACT_ADDRESS,
    abi: VAMOS_ABI,
    eventName: 'MarketResolved',
    onLogs: async (logs) => {
      for (const log of logs) {
        const { marketId, winningOutcome } = log.args;

        if (!marketId) return;

        console.log({
          event: "MarketResolved",
          marketId,
          winningOutcome,
          transactionHash: log.transactionHash,
        });

        try {
          const result = await cdp.evm.sendTransaction({
            address: account.address,
            transaction: {
              to: VAMOS_CONTRACT_ADDRESS,
              data: encodeFunctionData({
                abi: VAMOS_ABI,
                functionName: "distribute",
                args: [marketId],
              }),
            },
            network,
          });

          console.log(`Action executed: ${result.transactionHash}`);

        } catch (error) {
          console.error("Error executing automated action:", error);
        }
      }
    },
  });

  // Keep the process running
  console.log("Server wallet is running. Press Ctrl+C to stop.");
  process.on('SIGINT', () => {
    console.log("\nStopping server wallet...");
    unwatch();
    process.exit(0);
  });
})();