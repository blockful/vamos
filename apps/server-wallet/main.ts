import { CdpClient } from "@coinbase/cdp-sdk";
import { http, createPublicClient, parseEther, parseAbiItem, extractChain } from "viem";
import { base, baseSepolia, celo, celoSepolia, sepolia } from "viem/chains";
import dotenv from "dotenv";

dotenv.config();

// Vamos contract ABI for MarketResolved event
const VAMOS_ABI = [
  parseAbiItem('event MarketResolved(uint256 indexed marketId, uint256 indexed winningOutcome)')
] as const;

// Configure your deployed Vamos contract address
const VAMOS_CONTRACT_ADDRESS = process.env.VAMOS_CONTRACT_ADDRESS as `0x${string}`;
const RPC_URL = process.env.RPC_URL as string
const CHAIN_ID = process.env.CHAIN_ID as string

(async () => {
  const cdp = new CdpClient();

  // Step 1: Create or use existing EVM account
  const account = await cdp.evm.createAccount();
  console.log("Server wallet address:", account.address);

  // Step 2: Create public client for listening to events
  const publicClient = createPublicClient({
    chain: extractChain({
      id: Number(CHAIN_ID) as any, chains: [
        base,
        baseSepolia,
        celoSepolia,
        celo,
        sepolia
      ]
    }),
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

        console.log({
          event: "MarketResolved",
          marketId,
          winningOutcome,
          transactionHash: log.transactionHash,
        });

        // try {
        //   const result = await cdp.evm.sendTransaction({
        //     address: account.address,
        //     transaction: {
        //       to: "0x...",
        //       value: parseEther("0.0001"),
        //     },
        //     network: "base-sepolia",
        //   });
        //   console.log(`Action executed: ${result.transactionHash}`);

        // } catch (error) {
        //   console.error("Error executing automated action:", error);
        // }
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