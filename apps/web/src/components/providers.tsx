"use client";

import { MiniAppProvider } from "@/contexts/miniapp-context";
import FrameWalletProvider from "@/contexts/frame-wallet-context";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <FrameWalletProvider>
      <MiniAppProvider addMiniAppOnLoad={true}>{children}</MiniAppProvider>
    </FrameWalletProvider>
  );
}
