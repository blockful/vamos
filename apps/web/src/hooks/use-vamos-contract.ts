import { useWriteContract, useWaitForTransactionReceipt, useReadContract } from "wagmi";
import { VamosAbi } from "@/abis/vamosAbi";
import { Address } from "viem";

// Vamos contract address
const VAMOS_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_VAMOS_CONTRACT_ADDRESS as Address;

/**
 * Hook to create a new market
 */
export function useCreateMarket() {
    const { data: hash, writeContract, isPending, error } = useWriteContract();

    const { isLoading: isConfirming, isSuccess: isConfirmed } =
        useWaitForTransactionReceipt({
            hash,
        });

    const createMarket = async (
        question: string,
        judge: Address,
        outcomes: string[]
    ) => {
        if (!VAMOS_CONTRACT_ADDRESS) {
            throw new Error("VAMOS_CONTRACT_ADDRESS is not configured");
        }

        return writeContract({
            address: VAMOS_CONTRACT_ADDRESS,
            abi: VamosAbi,
            functionName: "createMarket",
            args: [question, judge, outcomes],
        });
    };

    return {
        createMarket,
        isPending,
        isConfirming,
        isConfirmed,
        error,
        hash,
    };
}

/**
 * Hook to get the total count of markets
 */
export function useMarketCount() {
    const { data, isLoading, error } = useReadContract({
        address: VAMOS_CONTRACT_ADDRESS,
        abi: VamosAbi,
        functionName: "marketCount",
    });

    return {
        marketCount: data as bigint | undefined,
        isLoading,
        error,
    };
}

/**
 * Hook para obter detalhes de um mercado específico
 */
export function useGetMarket(marketId: bigint) {
    const { data, isLoading, error } = useReadContract({
        address: VAMOS_CONTRACT_ADDRESS,
        abi: VamosAbi,
        functionName: "getMarket",
        args: [marketId],
    });

    return {
        market: data,
        isLoading,
        error,
    };
}

/**
 * Hook to place a prediction on a market
 */
export function usePlacePrediction() {
    const { data: hash, writeContract, isPending, error } = useWriteContract();

    const { isLoading: isConfirming, isSuccess: isConfirmed } =
        useWaitForTransactionReceipt({
            hash,
        });

    const placePrediction = async (
        marketId: bigint,
        outcomeId: bigint,
        amount: bigint
    ) => {
        if (!VAMOS_CONTRACT_ADDRESS) {
            throw new Error("VAMOS_CONTRACT_ADDRESS is not configured");
        }

        return writeContract({
            address: VAMOS_CONTRACT_ADDRESS,
            abi: VamosAbi,
            functionName: "placePrediction",
            args: [marketId, outcomeId, amount],
        });
    };

    return {
        placePrediction,
        isPending,
        isConfirming,
        isConfirmed,
        error,
        hash,
    };
}

/**
 * Hook to claim winnings from a resolved market
 */
export function useClaimWinnings() {
    const { data: hash, writeContract, isPending, error } = useWriteContract();

    const { isLoading: isConfirming, isSuccess: isConfirmed } =
        useWaitForTransactionReceipt({
            hash,
        });

    const claimWinnings = async (marketId: bigint) => {
        if (!VAMOS_CONTRACT_ADDRESS) {
            throw new Error("VAMOS_CONTRACT_ADDRESS is not configured");
        }

        return writeContract({
            address: VAMOS_CONTRACT_ADDRESS,
            abi: VamosAbi,
            functionName: "claimWinnings",
            args: [marketId],
        });
    };

    return {
        claimWinnings,
        isPending,
        isConfirming,
        isConfirmed,
        error,
        hash,
    };
}

/**
 * Hook to claim refund from a market with no winners
 */
export function useClaimRefund() {
    const { data: hash, writeContract, isPending, error } = useWriteContract();

    const { isLoading: isConfirming, isSuccess: isConfirmed } =
        useWaitForTransactionReceipt({
            hash,
        });

    const claimRefund = async (marketId: bigint) => {
        if (!VAMOS_CONTRACT_ADDRESS) {
            throw new Error("VAMOS_CONTRACT_ADDRESS is not configured");
        }

        return writeContract({
            address: VAMOS_CONTRACT_ADDRESS,
            abi: VamosAbi,
            functionName: "claimRefund",
            args: [marketId],
        });
    };

    return {
        claimRefund,
        isPending,
        isConfirming,
        isConfirmed,
        error,
        hash,
    };
}

/**
 * Hook to resolve a market (judge only)
 */
export function useResolveMarket() {
    const { data: hash, writeContract, isPending, error } = useWriteContract();

    const { isLoading: isConfirming, isSuccess: isConfirmed } =
        useWaitForTransactionReceipt({
            hash,
        });

    const resolveMarket = async (marketId: bigint, winningOutcome: bigint) => {
        if (!VAMOS_CONTRACT_ADDRESS) {
            throw new Error("VAMOS_CONTRACT_ADDRESS is not configured");
        }

        return writeContract({
            address: VAMOS_CONTRACT_ADDRESS,
            abi: VamosAbi,
            functionName: "resolveMarket",
            args: [marketId, winningOutcome],
        });
    };

    return {
        resolveMarket,
        isPending,
        isConfirming,
        isConfirmed,
        error,
        hash,
    };
}

/**
 * Hook to get the pool of a specific outcome
 */
export function useGetOutcomePool(marketId: bigint, outcomeId: bigint) {
    const { data, isLoading, error } = useReadContract({
        address: VAMOS_CONTRACT_ADDRESS,
        abi: VamosAbi,
        functionName: "getOutcomePool",
        args: [marketId, outcomeId],
    });

    return {
        pool: data as bigint | undefined,
        isLoading,
        error,
    };
}

/**
 * Hook to get a user's prediction on a specific outcome
 */
export function useGetUserPrediction(
    marketId: bigint,
    user: Address,
    outcomeId: bigint
) {
    const { data, isLoading, error } = useReadContract({
        address: VAMOS_CONTRACT_ADDRESS,
        abi: VamosAbi,
        functionName: "getUserPrediction",
        args: [marketId, user, outcomeId],
    });

    return {
        prediction: data as bigint | undefined,
        isLoading,
        error,
    };
}

/**
 * Hook to calculate potential winnings
 */
export function useCalculatePotentialWinnings(
    marketId: bigint,
    user: Address,
    outcomeId: bigint
) {
    const { data, isLoading, error } = useReadContract({
        address: VAMOS_CONTRACT_ADDRESS,
        abi: VamosAbi,
        functionName: "calculatePotentialWinnings",
        args: [marketId, user, outcomeId],
    });

    return {
        potentialWinnings: data as bigint | undefined,
        isLoading,
        error,
    };
}
