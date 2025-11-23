"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Wallet,
  ConnectWallet,
  WalletDropdown,
  WalletAdvancedAddressDetails,
  WalletAdvancedTokenHoldings,
  WalletAdvancedTransactionActions,
} from "@coinbase/onchainkit/wallet";

export function Navbar() {
  const router = useRouter();

  // Get wallet balance
  // const { data: balanceData, isLoading: isLoadingBalance } = useBalance({
  //   address: address,
  //   chainId: chainId,
  // });

  return (
    <header className="fixed top-2 left-2 right-2 z-50 bg-[#FEABEF] rounded-2xl mb-2">
      <div className="flex justify-between h-20 items-center px-6">
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

        <Wallet>
          <ConnectWallet />
          <WalletDropdown>
            <WalletAdvancedAddressDetails />
            <WalletAdvancedTokenHoldings />
            <WalletAdvancedTransactionActions />
          </WalletDropdown>
        </Wallet>
      </div>
    </header>
  );
}
