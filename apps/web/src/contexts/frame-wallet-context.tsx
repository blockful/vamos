"use client";

import { farcasterMiniApp } from "@farcaster/miniapp-wagmi-connector";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactNode } from "react";
import { WagmiProvider, createConfig, http } from "wagmi";
import { celo, sepolia, mainnet } from "wagmi/chains";
import { injected } from "wagmi/connectors";

const config = createConfig({
  chains: [celo, sepolia, mainnet],
  connectors: [farcasterMiniApp(), injected()],
  transports: {
    [celo.id]: http(),
    [sepolia.id]: http(),
    [mainnet.id]: http(),
  },
  ssr: true,
});

// Create QueryClient outside component to avoid recreating on every render
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Reduce unnecessary refetching
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      retry: 1,
    },
  },
});

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
