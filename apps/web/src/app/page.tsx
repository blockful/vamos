"use client";
import { useMiniApp } from "@/contexts/miniapp-context";
import { useEffect } from "react";
import { useAccount, useConnect } from "wagmi";
import Image from "next/image";
import { useRouter } from "next/navigation";

export default function Home() {
  const { context, isMiniAppReady } = useMiniApp();
  const router = useRouter();

  // Wallet connection hooks
  const { address, isConnected, isConnecting } = useAccount();
  const { connect, connectors } = useConnect();

  // Auto-connect wallet when miniapp is ready
  useEffect(() => {
    if (
      isMiniAppReady &&
      !isConnected &&
      !isConnecting &&
      connectors.length > 0
    ) {
      const farcasterConnector = connectors.find((c) => c.id === "farcaster");
      if (farcasterConnector) {
        connect({ connector: farcasterConnector });
      }
    }
  }, [isMiniAppReady, isConnected, isConnecting, connectors, connect]);

  // Redirect to markets when connected
  useEffect(() => {
    if (isConnected) {
      router.push("/markets");
    }
  }, [isConnected, router]);

  // Extract user data from context
  const user = context?.user;
  const displayName = user?.displayName || user?.username || "User";
  const pfpUrl = user?.pfpUrl;

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

            {/* Connect Wallet Button */}
            <button
              onClick={() => {
                if (!isConnected && connectors.length > 0) {
                  const farcasterConnector = connectors.find(
                    (c) => c.id === "farcaster"
                  );
                  if (farcasterConnector) {
                    connect({ connector: farcasterConnector });
                  }
                }
              }}
              disabled={isConnected || isConnecting}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-4 px-6 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
            >
              {isConnecting ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Connecting...
                </>
              ) : isConnected ? (
                <>
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  Connected
                </>
              ) : (
                "Connect Wallet"
              )}
            </button>

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
