import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { VamosAbi } from "@/abis/vamosAbi";
import { Address } from "viem";

// Vamos contract address
const VAMOS_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_VAMOS_CONTRACT_ADDRESS as Address;
const VAMOS_TOKEN_ADDRESS = process.env.NEXT_PUBLIC_VAMOS_TOKEN_ADDRESS as Address;

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
        return writeContract({
            address: VAMOS_CONTRACT_ADDRESS,
            abi: VamosAbi,
            functionName: "placePrediction",
            // args: [marketId, outcomeId, amount],
            args: [1n, 0n, 10n],
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

