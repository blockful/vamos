import { useQuery } from "@tanstack/react-query";
import { normalize } from "viem/ens";
import { usePublicClient } from "wagmi";

/**
 * Hook to resolve ENS name from an Ethereum address
 */
export function useEnsName(address: string | undefined) {
  const publicClient = usePublicClient();

  return useQuery({
    queryKey: ["ens-name", address],
    queryFn: async () => {
      if (!address || !publicClient) return null;

      try {
        const ensName = await publicClient.getEnsName({
          address: address as `0x${string}`,
        });
        return ensName;
      } catch (error) {
        console.error("Error resolving ENS name:", error);
        return null;
      }
    },
    enabled: !!address && !!publicClient,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
  });
}

/**
 * Hook to resolve multiple ENS names from multiple Ethereum addresses
 */
export function useEnsNames(addresses: string[]) {
  const publicClient = usePublicClient();

  return useQuery({
    queryKey: ["ens-names", addresses],
    queryFn: async () => {
      if (!addresses.length || !publicClient) return {};

      const ensNames: Record<string, string | null> = {};

      await Promise.all(
        addresses.map(async (address) => {
          try {
            const ensName = await publicClient.getEnsName({
              address: address as `0x${string}`,
            });
            ensNames[address] = ensName;
          } catch (error) {
            console.error(`Error resolving ENS for ${address}:`, error);
            ensNames[address] = null;
          }
        })
      );

      return ensNames;
    },
    enabled: addresses.length > 0 && !!publicClient,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
  });
}

/**
 * Hook to resolve Ethereum address from an ENS name
 */
export function useEnsAddress(ensName: string | undefined) {
  const publicClient = usePublicClient();

  return useQuery({
    queryKey: ["ens-address", ensName],
    queryFn: async () => {
      if (!ensName || !publicClient) return null;

      try {
        const normalizedName = normalize(ensName);
        const address = await publicClient.getEnsAddress({
          name: normalizedName,
        });
        return address;
      } catch (error) {
        console.error("Error resolving ENS address:", error);
        return null;
      }
    },
    enabled: !!ensName && !!publicClient && ensName.includes('.'),
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
  });
}

/**
 * Utility function to format address or ENS name for display
 */
export function formatAddressOrEns(
  address: string,
  ensName?: string | null | undefined,
  truncate = true
): string {
  if (ensName) return ensName;
  if (!truncate) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

