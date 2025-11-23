import { useState } from "react";
import { useAccount, useConnect } from "wagmi";
import { sdk } from "@farcaster/frame-sdk";
import type { Connector } from "wagmi";

export function useWalletConnect() {
  const { address, isConnected: wagmiIsConnected, isConnecting } = useAccount();
  const { connect, connectors } = useConnect();
  const [isRequestingWallet, setIsRequestingWallet] = useState(false);
  const [showWalletOptions, setShowWalletOptions] = useState(false);

  // Only consider connected if we have a valid address
  const isConnected = wagmiIsConnected && !!address;

  // Function to request wallet access
  const handleConnectWallet = () => {
    setShowWalletOptions(true);
  };

  // Function to connect with specific connector
  const handleConnectorClick = async (connector: Connector) => {
    try {
      setIsRequestingWallet(true);
      setShowWalletOptions(false);

      // If Farcaster connector, request wallet access first
      if (connector.id === "farcaster") {
        await sdk.wallet.ethProvider.request({
          method: "eth_requestAccounts",
        });
      }

      // Connect with selected connector
      connect({ connector });
    } catch (error) {
      console.error("Error connecting wallet:", error);
      setShowWalletOptions(true); // Show options again on error
    } finally {
      setIsRequestingWallet(false);
    }
  };

  // Get display name for connector
  const getConnectorName = (connector: Connector) => {
    if (connector.id === "farcaster") return "Farcaster Wallet";
    if (connector.id === "injected") {
      // Try to detect which injected wallet
      if (typeof window !== "undefined") {
        if ((window as any).ethereum?.isMetaMask) return "MetaMask";
        if ((window as any).ethereum?.isCoinbaseWallet)
          return "Coinbase Wallet";
        if ((window as any).ethereum?.isRabby) return "Rabby Wallet";
      }
      return "Browser Wallet";
    }
    return connector.name;
  };

  // Get icon for connector
  const getConnectorIcon = (connector: Connector) => {
    if (connector.id === "farcaster") return "🟣";
    if (connector.id === "injected") {
      if (typeof window !== "undefined") {
        if ((window as any).ethereum?.isMetaMask) return "🦊";
        if ((window as any).ethereum?.isCoinbaseWallet) return "💙";
      }
      return "💳";
    }
    return "🔗";
  };

  return {
    address,
    isConnected,
    isConnecting,
    isRequestingWallet,
    showWalletOptions,
    connectors,
    handleConnectWallet,
    handleConnectorClick,
    setShowWalletOptions,
    getConnectorName,
    getConnectorIcon,
  };
}
