import { Address } from "viem";
import { celo, base } from "viem/chains";
import { env } from "./env";

export interface ContractAddresses {
  vamos: Address;
  token: Address;
}

/**
 * Get contract addresses for a specific chain ID
 * Returns null if addresses are not configured for the given network
 */
export function getContractAddresses(chainId?: number): ContractAddresses | null {
  if (!chainId) return null;

  // Network-specific addresses - only source of truth
  const addressMap: Record<number, ContractAddresses | null> = {
    [celo.id]: env.NEXT_PUBLIC_VAMOS_ADDRESS_CELO && env.NEXT_PUBLIC_TOKEN_ADDRESS_CELO
      ? {
          vamos: env.NEXT_PUBLIC_VAMOS_ADDRESS_CELO as Address,
          token: env.NEXT_PUBLIC_TOKEN_ADDRESS_CELO as Address,
        }
      : null,
    [base.id]: env.NEXT_PUBLIC_VAMOS_ADDRESS_BASE && env.NEXT_PUBLIC_TOKEN_ADDRESS_BASE
      ? {
          vamos: env.NEXT_PUBLIC_VAMOS_ADDRESS_BASE as Address,
          token: env.NEXT_PUBLIC_TOKEN_ADDRESS_BASE as Address,
        }
      : null,
  };

  return addressMap[chainId] ?? null;
}

/**
 * Get the Vamos contract address for a specific chain
 */
export function getVamosAddress(chainId?: number): Address | null {
  const addresses = getContractAddresses(chainId);
  return addresses?.vamos ?? null;
}

/**
 * Get the token contract address for a specific chain
 */
export function getTokenAddress(chainId?: number): Address | null {
  const addresses = getContractAddresses(chainId);
  return addresses?.token ?? null;
}

