"use client";

import { farcasterMiniApp } from "@farcaster/miniapp-wagmi-connector";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactNode } from "react";
import { WagmiProvider, createConfig, http } from "wagmi";
import {
  celo,
  celoAlfajores,
  mainnet,
  sepolia,
  base,
  baseSepolia,
} from "wagmi/chains";
import { injected } from "wagmi/connectors";

export const supportedChainIds = [
  celo.id,
  celoAlfajores.id,
  mainnet.id,
  sepolia.id,
  base.id,
  baseSepolia.id,
];

export type SupportedChainIds = 1 | 42220 | 44787 | 11155111 | 8453 | 84532;

const config = createConfig({
  chains: [celo, celoAlfajores, mainnet, sepolia, base, baseSepolia],
  connectors: [farcasterMiniApp(), injected()],
  transports: {
    [celo.id]: http(),
    [celoAlfajores.id]: http(),
    [mainnet.id]: http(),
    [sepolia.id]: http(),
    [base.id]: http(),
    [baseSepolia.id]: http(),
  },
});

const queryClient = new QueryClient();

export default function FrameWalletProvider({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </WagmiProvider>
  );
}
