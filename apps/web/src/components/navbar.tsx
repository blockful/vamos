"use client";

import { LogOut } from "lucide-react";
import {
  useAccount,
  useDisconnect,
  useReadContract,
} from "wagmi";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useMiniApp } from "@/contexts/miniapp-context";
import { useEffect, useState, useRef } from "react";
import { ERC20Abi } from "@/abis/erc20Abi";
import { formatUnits } from "viem";
import { Address } from "viem";
import { Button } from "@/components/ui/button";
import { useEnsName, formatAddressOrEns } from "@/hooks/use-ens";
import { useWalletConnect } from "@/hooks/use-wallet-connect";
import { NetworkSwitcher } from "@/components/network-switcher";

const VAMOS_TOKEN_ADDRESS = process.env
  .NEXT_PUBLIC_VAMOS_TOKEN_ADDRESS as Address;

export function Navbar() {
  const router = useRouter();
  const { disconnect } = useDisconnect();
  const { context } = useMiniApp();
  const [isOpen, setIsOpen] = useState(false);

  // Use wallet connect hook
  const {
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
  } = useWalletConnect();

  const { data: ensName } = useEnsName(address);

  // Get VAMOS token balance
  const { data: tokenBalance, isLoading: isLoadingBalance } = useReadContract({
    address: VAMOS_TOKEN_ADDRESS,
    abi: ERC20Abi,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
    },
  });

  // Get token decimals
  const { data: tokenDecimals } = useReadContract({
    address: VAMOS_TOKEN_ADDRESS,
    abi: ERC20Abi,
    functionName: "decimals",
  });

  // Format the token balance
  const formattedBalance =
    tokenBalance && tokenDecimals
      ? formatUnits(tokenBalance as bigint, tokenDecimals as number)
      : "0.00";

  // Debug logs
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

  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  return (
    <header className="fixed top-2 left-1/2 -translate-x-1/2 z-50 bg-[#FEABEF] rounded-2xl mb-2 w-[calc(100%-1rem)] max-w-[632px]">
      <div className="flex h-20 items-center justify-between px-6">
        {/* Left side - Logo */}
        <button
          onClick={() => router.push("/")}
          className="flex items-center hover:opacity-80 transition-opacity cursor-pointer"
        >
          <Image
            src="/logo.svg"
            alt="VAMOS FUN"
            width={120}
            height={60}
            className="h-10 w-auto"
          />
        </button>

        {/* Right side - Network Switcher and Connect Wallet or Avatar and Balance */}
        <div className="flex items-center gap-3">
          {/* Network Switcher - Always visible when connected */}
          {isConnected && <NetworkSwitcher />}

          {/* Connect Wallet or User Info */}
          {!isConnected ? (
            <>
            {!showWalletOptions ? (
              <Button
                onClick={handleConnectWallet}
                disabled={isConnecting || isRequestingWallet}
                className="bg-[#111909] hover:bg-[#111909]/90 disabled:bg-gray-400 text-white font-semibold py-2 px-6"
              >
                {isConnecting || isRequestingWallet ? (
                  <div className="flex items-center gap-2 justify-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Connecting...</span>
                  </div>
                ) : (
                  "Connect Wallet"
                )}
              </Button>
            ) : (
              <div className="relative">
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                  <p className="text-sm text-gray-600 text-center px-4 py-3 border-b border-gray-200">
                    Choose a wallet to connect
                  </p>

                  {/* Wallet Options */}
                  <div className="p-2">
                    {connectors.map((connector) => (
                      <Button
                        key={connector.id}
                        onClick={() => handleConnectorClick(connector)}
                        disabled={isConnecting || isRequestingWallet}
                        variant="outline"
                        className="w-full py-3 px-4 flex items-center justify-between hover:bg-gray-50 mb-2 text-black"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-xl">
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
                      className="w-full mt-1 text-black bg-[#FEABEF] hover:bg-[#ff9be0]"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </div>
            )}
            </>
          ) : (
            <>
            {/* Avatar with Dropdown */}
            <div ref={dropdownRef} className="relative">
              <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-12 h-12 rounded-full border-2 border-[#111909] hover:opacity-80 transition-opacity cursor-pointer p-0"
              >
                <div className="w-full h-full rounded-full overflow-hidden">
                  {pfpUrl ? (
                    <Image
                      src={pfpUrl}
                      alt="Profile"
                      width={48}
                      height={48}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-[#562B52] flex items-center justify-center">
                      <span className="text-white text-lg font-semibold">
                        {displayName.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                </div>
              </button>

              {/* Dropdown Menu */}
              {isOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                  <div className="px-4 py-3 border-b border-gray-200">
                    <p className="text-sm font-medium text-gray-700">
                      {displayName}
                    </p>
                    <p className="text-xs text-gray-500 mt-1 font-mono">
                      {formatAddressOrEns(address!, ensName, true)}
                    </p>
                  </div>
                  <button
                    onClick={handleDisconnect}
                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Logout</span>
                  </button>
                </div>
              )}
            </div>

            {/* Balance */}
            <div className="flex flex-col items-start">
              <span className="text-xs font-medium text-[#111909]">
                Your balance
              </span>
              <span className="text-lg font-bold text-[#111909]">
                {isLoadingBalance
                  ? "..."
                  : `${formatBalance(formattedBalance)} USDC`}
              </span>
            </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
