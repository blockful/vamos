"use client";

import { LogOut, Wallet } from "lucide-react";
import { useAccount, useDisconnect, useBalance } from "wagmi";
import Image from "next/image";
import { useMiniApp } from "@/contexts/miniapp-context";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export function Navbar() {
  const { address, isConnected, chain } = useAccount();
  const { disconnect } = useDisconnect();
  const { context } = useMiniApp();
  const router = useRouter();
  // Get wallet balance for the current chain
  const { data: balance, isLoading: isLoadingBalance } = useBalance({
    address: address,
    chainId: chain?.id,
  });

  // Monitor connection status and redirect if disconnected
  useEffect(() => {
    if (
      !isConnected &&
      typeof window !== "undefined" &&
      window.location.pathname !== "/"
    ) {
      // If not connected and not on home page, check if we should redirect
      const wasDisconnected = sessionStorage.getItem("walletDisconnected");
      if (wasDisconnected === "true") {
        sessionStorage.removeItem("walletDisconnected");
      }
    }
  }, [isConnected]);

  // Extract user data from context
  const user = context?.user;
  const displayName = user?.displayName || user?.username || "User";
  const pfpUrl = user?.pfpUrl;

  // Format balance to show 4 decimal places
  const formatBalance = (balance: string | undefined) => {
    if (!balance) return "0.00";
    const num = parseFloat(balance);
    if (num < 0.01) return num.toFixed(4);
    return num.toFixed(2);
  };

  // Handle disconnect
  const handleDisconnect = async () => {
    try {
      // Mark that we're intentionally disconnecting
      if (typeof window !== "undefined") {
        sessionStorage.setItem("walletDisconnected", "true");
      }

      // Force disconnect from all connectors
      disconnect();

      // Clear any persisted wallet state
      if (typeof window !== "undefined") {
        // Clear wagmi storage
        localStorage.removeItem("wagmi.store");
        localStorage.removeItem("wagmi.wallet");
        localStorage.removeItem("wagmi.connected");

        // Clear any other wallet-related storage
        Object.keys(localStorage).forEach((key) => {
          if (key.includes("wagmi") || key.includes("wallet")) {
            localStorage.removeItem(key);
          }
        });
      }

      // Small delay to ensure state is cleared before redirect
      setTimeout(() => {
        router.push("/");
      }, 100);
    } catch (error) {
      console.error("Error disconnecting:", error);
      // Still try to redirect even if there's an error
      router.push("/");
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full bg-[#FEABEF] rounded-bl-2xl rounded-br-2xl">
      <div className="container flex h-16 max-w-screen-2xl items-center justify-between px-4">
        {/* Left side - Profile Picture */}
        {isConnected && (
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-[#111909]">
              {pfpUrl ? (
                <Image
                  src={pfpUrl}
                  alt="Profile"
                  width={40}
                  height={40}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-[#562B52] flex items-center justify-center">
                  <span className="text-white text-sm font-semibold">
                    {displayName.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
            </div>
            <span className="font-medium text-sm text-foreground hidden sm:inline">
              {displayName}
            </span>
          </div>
        )}

        {/* Right side - Wallet/Logout Icon */}
        <div className="flex items-center gap-3">
          {isConnected && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-lg">
              <Wallet className="h-4 w-4 text-gray-600" />
              <span className="text-sm font-medium text-gray-700">
                {isLoadingBalance
                  ? "..."
                  : balance
                  ? `${formatBalance(balance.formatted)} ${balance.symbol}`
                  : "0.00"}
              </span>
            </div>
          )}

          {isConnected ? (
            <Button
              variant="ghost"
              onClick={handleDisconnect}
              className="flex items-center gap-2"
              title="Logout"
            >
              <LogOut className="h-5 w-5" />
              <span className="text-sm font-medium hidden sm:inline">
                Logout
              </span>
            </Button>
          ) : (
            <Button
              variant="ghost"
              className="flex items-center gap-2"
              title="Connect Wallet"
            >
              <Wallet className="h-5 w-5" />
              <span className="text-sm font-medium hidden sm:inline">
                Connect
              </span>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
