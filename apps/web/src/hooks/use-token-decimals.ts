import { useReadContract } from "wagmi";
import { ERC20Abi } from "@/abis/erc20Abi";
import { getTokenAddress } from "@/lib/contracts";

/**
 * Hook to fetch the decimals of the token for the current chain
 * @param chainId - The chain ID to get the token decimals for
 * @returns The token decimals (e.g., 6 for USDC, 18 for most ERC20s)
 */
export function useTokenDecimals(chainId?: number) {
  const tokenAddress = getTokenAddress(chainId);

  const { data: tokenDecimals, isLoading } = useReadContract({
    address: tokenAddress ?? undefined,
    abi: ERC20Abi,
    functionName: "decimals",
    query: {
      enabled: !!tokenAddress,
    },
  });

  return {
    decimals: tokenDecimals as number | undefined,
    isLoading,
  };
}

