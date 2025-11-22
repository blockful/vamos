"use client";

import { LogOut, Wallet } from "lucide-react";
import { useAccount, useDisconnect, useBalance } from "wagmi";
import Image from "next/image";
import { useMiniApp } from "@/contexts/miniapp-context";
import { useRouter } from "next/navigation";

export function Navbar() {
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const { context } = useMiniApp();
  const router = useRouter();

  // Get wallet balance
  const { data: balance } = useBalance({
    address: address,
  });

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
      // Redirect to home page after disconnect
      router.push("/");
    } catch (error) {
      console.error("Error disconnecting:", error);
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 max-w-screen-2xl items-center justify-between px-4">
        {/* Left side - Profile Picture */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-gray-200">
            {pfpUrl ? (
              <Image
                src={pfpUrl}
                alt="Profile"
                width={40}
                height={40}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center">
                <span className="text-white text-sm font-bold">
                  {displayName.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
          </div>
          <span className="font-medium text-sm text-foreground hidden sm:inline">
            {displayName}
          </span>
        </div>

        {/* Right side - Wallet/Logout Icon */}
        <div className="flex items-center gap-3">
          {isConnected && balance && (
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-lg">
              <Wallet className="h-4 w-4 text-gray-600" />
              <span className="text-sm font-medium text-gray-700">
                {formatBalance(balance.formatted)} {balance.symbol}
              </span>
            </div>
          )}

          {isConnected ? (
            <button
              onClick={handleDisconnect}
              className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors"
              title="Logout"
            >
              <LogOut className="h-5 w-5 text-gray-700" />
              <span className="text-sm font-medium text-gray-700 hidden sm:inline">
                Logout
              </span>
            </button>
          ) : (
            <button
              className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors"
              title="Connect Wallet"
            >
              <Wallet className="h-5 w-5 text-gray-700" />
              <span className="text-sm font-medium text-gray-700 hidden sm:inline">
                Connect
              </span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
