"use client";
import { useMiniApp } from "@/contexts/miniapp-context";
import { useEffect, useState } from "react";
import { useAccount, useConnect } from "wagmi";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { sdk } from "@farcaster/frame-sdk";
import type { Connector } from "wagmi";

export default function Home() {
  const { context, isMiniAppReady } = useMiniApp();
  const router = useRouter();
  const [isRequestingWallet, setIsRequestingWallet] = useState(false);
  const [showWalletOptions, setShowWalletOptions] = useState(false);

  // Wallet connection hooks
  const { address, isConnected, isConnecting } = useAccount();
  const { connect, connectors } = useConnect();

  // Auto-connect wallet when miniapp is ready (only once)
  // Only auto-connect Farcaster if in Farcaster context
  // useEffect(() => {
  //   if (
  //     isMiniAppReady &&
  //     !isConnected &&
  //     !isConnecting &&
  //     !hasAttemptedAutoConnect &&
  //     connectors.length > 0 &&
  //     context?.client // Only auto-connect if in Farcaster
  //   ) {
  //     setHasAttemptedAutoConnect(true);
  //     const walletConnector = connectors.find((c) => c.id === "farcaster");
  //     if (walletConnector) {
  //       connect({ connector: walletConnector });
  //     }
  //   }
  // }, [
  //   isMiniAppReady,
  //   isConnected,
  //   isConnecting,
  //   hasAttemptedAutoConnect,
  //   connectors,
  //   connect,
  //   context,
  // ]);

  // Redirect to markets when connected
  useEffect(() => {
    // Only redirect if we have a valid connection with an address
    // and we're not currently connecting
    if (isConnected && address && !isConnecting && isMiniAppReady) {
      router.push("/markets");
    }
  }, [isConnected, address, isConnecting, isMiniAppReady, router]);

  // Extract user data from context
  const user = context?.user;
  const displayName = user?.displayName || user?.username || "User";
  const pfpUrl = user?.pfpUrl;

  // Function to request wallet access
  const handleConnectWallet = () => {
    // Show wallet options if multiple connectors available
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

  // Format wallet address to show first 6 and last 4 characters
  const formatAddress = (address: string) => {
    if (!address || address.length < 10) return address;
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  if (!isMiniAppReady) {
    return (
      <main className="flex-1">
        <section className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
          <div className="w-full max-w-md mx-auto p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading...</p>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="flex-1">
      <section className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="w-full max-w-md mx-auto p-8">
          <div className="bg-white rounded-2xl shadow-xl p-8 flex flex-col items-center">
            {/* Profile Picture */}
            <div className="w-32 h-32 mb-6 rounded-full overflow-hidden border-4 border-gray-200">
              {pfpUrl ? (
                <Image
                  src={pfpUrl}
                  alt="Profile"
                  width={128}
                  height={128}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center">
                  <span className="text-white text-4xl font-bold">
                    {displayName.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
            </div>

            {/* Connect Wallet Section */}
            {!showWalletOptions ? (
              <Button
                onClick={handleConnectWallet}
                disabled={isConnected || isConnecting || isRequestingWallet}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-4 px-6"
              >
                {isConnecting || isRequestingWallet ? (
                  <div className="flex items-center gap-2 justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>Connecting...</span>
                  </div>
                ) : isConnected ? (
                  <div className="flex items-center gap-2 justify-center">
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: "#A4D18E" }}
                    ></div>
                    <span>Connected</span>
                  </div>
                ) : (
                  "Connect Wallet"
                )}
              </Button>
            ) : (
              <div className="w-full space-y-3">
                <p className="text-sm text-gray-600 text-center mb-2">
                  Choose a wallet to connect
                </p>

                {/* Wallet Options */}
                {connectors.map((connector) => (
                  <Button
                    key={connector.id}
                    onClick={() => handleConnectorClick(connector)}
                    disabled={isConnecting || isRequestingWallet}
                    variant="outline"
                    className="w-full py-4 px-6 flex items-center justify-between hover:bg-gray-50"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">
                        {getConnectorIcon(connector)}
                      </span>
                      <span className="font-medium">
                        {getConnectorName(connector)}
                      </span>
                    </div>
                    {isConnecting && (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                    )}
                  </Button>
                ))}

                {/* Cancel Button */}
                <Button
                  onClick={() => setShowWalletOptions(false)}
                  variant="ghost"
                  className="w-full mt-2"
                >
                  Cancel
                </Button>
              </div>
            )}

            {/* Wallet Address (shown when connected) */}
            {isConnected && address && (
              <div className="mt-4 w-full">
                <div className="bg-gray-50 rounded-lg p-4 text-center">
                  <p className="text-xs text-gray-500 mb-1">Wallet Address</p>
                  <p className="text-sm font-mono text-gray-700">
                    {formatAddress(address)}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
