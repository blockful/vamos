"use client";

import { useState, useRef, useEffect } from "react";
import { useAccount, useSwitchChain } from "wagmi";
import { base } from "viem/chains";
import { ChevronDown } from "lucide-react";

// Supported networks
const SUPPORTED_NETWORKS = [
  {
    id: base.id,
    name: "Base",
    shortName: "Base",
    icon: "🔵", // You can replace with actual icon/image
  },
];

export function NetworkSwitcher() {
  const { chain } = useAccount();
  const { switchChain, isPending } = useSwitchChain();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Get current network info
  const currentNetwork = SUPPORTED_NETWORKS.find((n) => n.id === chain?.id);

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

  const handleSwitchNetwork = async (chainId: number) => {
    try {
      await switchChain({ chainId });
      setIsOpen(false);
    } catch (error) {
      console.error("Failed to switch network:", error);
    }
  };

  return (
    <div ref={dropdownRef} className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={isPending}
        className="flex items-center gap-2 px-2 py-2  disabled:bg-gray-400 text-white font-medium rounded-lg transition-colors"
      >
        <span className="text-lg">{currentNetwork?.icon || "🌐"}</span>
        <span className="hidden sm:inline">
          {currentNetwork?.shortName || "Network"}
        </span>
        <ChevronDown className="h-4 w-4 text-gray-400" />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
          <div className="p-2">
            {SUPPORTED_NETWORKS.map((network) => (
              <button
                key={network.id}
                onClick={() => handleSwitchNetwork(network.id)}
                disabled={isPending || chain?.id === network.id}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  chain?.id === network.id
                    ? "bg-gray-100 cursor-default"
                    : "hover:bg-gray-50 cursor-pointer"
                }`}
              >
                <span className="text-xl">{network.icon}</span>
                <span className="font-medium text-gray-900">
                  {network.name}
                </span>
                {chain?.id === network.id && (
                  <span className="ml-auto text-green-600 text-sm">✓</span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
