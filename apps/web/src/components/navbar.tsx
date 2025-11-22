"use client";

import { LogOut, Wallet } from "lucide-react";
import { useAccount, useDisconnect, useBalance } from "wagmi";
import Image from "next/image";
import { useMiniApp } from "@/contexts/miniapp-context";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export function Navbar() {
  const { address } = useAccount();
  const { disconnect } = useDisconnect();
  const { context } = useMiniApp();

  const isConnected = true;

  // Get wallet balance
  const { isLoading: isLoadingBalance } = useBalance({
    address: address,
  });

  const balance = {
    formatted: "1234.5678",
    symbol: "ETH",
  };

  // Debug logs
  useEffect(() => {
    console.log("Navbar - Address:", address);
    console.log("Navbar - Balance:", balance);
    console.log("Navbar - Is Loading Balance:", isLoadingBalance);
  }, [address, balance, isLoadingBalance]);

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
      await disconnect();
    } catch (error) {
      console.error("Error disconnecting:", error);
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full bg-[#FEABEF] rounded-bl-2xl rounded-br-2xl">
      <div className="container flex h-16 max-w-screen-2xl items-center justify-between px-4">
        {/* Left side - Profile Picture */}
        {isConnected && <div className="flex items-center gap-3">
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
        </div>}

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
