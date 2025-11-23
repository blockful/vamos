"use client";

import { MiniAppProvider } from "@/contexts/miniapp-context";
import dynamic from "next/dynamic";
import { OnchainKitProvider } from "@coinbase/onchainkit";
import { sepolia } from "wagmi/chains";

const ErudaProvider = dynamic(
  () => import("../components/Eruda").then((c) => c.ErudaProvider),
  { ssr: false }
);

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ErudaProvider>
      <OnchainKitProvider
        apiKey={process.env.NEXT_PUBLIC_ONCHAINKIT_API_KEY}
        chain={sepolia}
      >
        <MiniAppProvider addMiniAppOnLoad={true}>{children}</MiniAppProvider>
      </OnchainKitProvider>
    </ErudaProvider>
  );
}
