"use client";

import { farcasterMiniApp } from "@farcaster/miniapp-wagmi-connector";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactNode } from "react";
import { WagmiProvider, createConfig, http } from "wagmi";
import { base, mainnet } from "wagmi/chains";
import { injected, walletConnect } from "wagmi/connectors";
import { env } from "@/lib/env";

const config = createConfig({
  chains: [base, mainnet],
  connectors: [
    farcasterMiniApp(),
    walletConnect({
      projectId: env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID,
      metadata: {
        name: "Vamos",
        description: "Prediction market platform",
        url: typeof window !== "undefined" ? window.location.origin : "https://vamos.app",
        icons: [typeof window !== "undefined" ? `${window.location.origin}/icon.png` : "https://vamos.app/icon.png"],
      },
      showQrModal: true,
    }),
    injected(),
  ],
  transports: {
    [base.id]: http(),
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
