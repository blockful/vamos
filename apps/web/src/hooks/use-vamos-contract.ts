import { useWriteContract, useWaitForTransactionReceipt, useReadContract, useAccount } from "wagmi";
import { VamosAbi } from "@/abis/vamosAbi";
import { ERC20Abi } from "@/abis/erc20Abi";
import { Address } from "viem";
import { getVamosAddress, getTokenAddress } from "@/lib/contracts";

/**
 * Hook to create a new market
 */
export function useCreateMarket() {
    const { chain } = useAccount();
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
        const vamosAddress = getVamosAddress(chain?.id);
        if (!vamosAddress) {
            throw new Error("Vamos contract address not configured for this network");
        }

        return writeContract({
            address: vamosAddress,
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
    const { chain } = useAccount();
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
        const vamosAddress = getVamosAddress(chain?.id);
        if (!vamosAddress) {
            throw new Error("Vamos contract address not configured for this network");
        }

        return writeContract({
            address: vamosAddress,
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
    const { chain } = useAccount();
    const { data: hash, writeContract, isPending, error } = useWriteContract();

    const { isLoading: isConfirming, isSuccess: isConfirmed } =
        useWaitForTransactionReceipt({
            hash,
        });

    const claimWinnings = async (marketId: bigint) => {
        const vamosAddress = getVamosAddress(chain?.id);
        if (!vamosAddress) {
            throw new Error("Vamos contract address not configured for this network");
        }

        return writeContract({
            address: vamosAddress,
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
    const { chain } = useAccount();
    const { data: hash, writeContract, isPending, error } = useWriteContract();

    const { isLoading: isConfirming, isSuccess: isConfirmed } =
        useWaitForTransactionReceipt({
            hash,
        });

    const claimRefund = async (marketId: bigint) => {
        const vamosAddress = getVamosAddress(chain?.id);
        if (!vamosAddress) {
            throw new Error("Vamos contract address not configured for this network");
        }

        return writeContract({
            address: vamosAddress,
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
    const { chain } = useAccount();
    const { data: hash, writeContract, isPending, error } = useWriteContract();

    const { isLoading: isConfirming, isSuccess: isConfirmed } =
        useWaitForTransactionReceipt({
            hash,
        });

    const resolveMarket = async (marketId: bigint, winningOutcome: bigint) => {
        const vamosAddress = getVamosAddress(chain?.id);
        if (!vamosAddress) {
            throw new Error("Vamos contract address not configured for this network");
        }

        return writeContract({
            address: vamosAddress,
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
 * Hook to pause a market (judge only)
 */
export function usePauseMarket() {
    const { chain } = useAccount();
    const { data: hash, writeContract, isPending, error } = useWriteContract();

    const { isLoading: isConfirming, isSuccess: isConfirmed } =
        useWaitForTransactionReceipt({
            hash,
        });

    const pauseMarket = async (marketId: bigint) => {
        const vamosAddress = getVamosAddress(chain?.id);
        if (!vamosAddress) {
            throw new Error("Vamos contract address not configured for this network");
        }

        return writeContract({
            address: vamosAddress,
            abi: VamosAbi,
            functionName: "pauseMarket",
            args: [marketId],
        });
    };

    return {
        pauseMarket,
        isPending,
        isConfirming,
        isConfirmed,
        error,
        hash,
    };
}

/**
 * Hook to handle ERC20 token approval for the Vamos contract
 */
export function useTokenApproval() {
    const { address: userAddress, chain } = useAccount();
    const { data: hash, writeContract, isPending, error } = useWriteContract();

    const { isLoading: isConfirming, isSuccess: isConfirmed } =
        useWaitForTransactionReceipt({
            hash,
        });

    const vamosAddress = getVamosAddress(chain?.id);
    const tokenAddress = getTokenAddress(chain?.id);

    // Read current allowance
    const {
        data: currentAllowance,
        refetch: refetchAllowance,
    } = useReadContract({
        address: tokenAddress ?? undefined,
        abi: ERC20Abi,
        functionName: "allowance",
        args: userAddress && vamosAddress ? [userAddress, vamosAddress] : undefined,
        query: {
            enabled: !!userAddress && !!vamosAddress && !!tokenAddress,
        },
    });

    const approve = async (amount: bigint) => {
        if (!tokenAddress) {
            throw new Error("Token contract address not configured for this network");
        }
        if (!vamosAddress) {
            throw new Error("Vamos contract address not configured for this network");
        }

        return writeContract({
            address: tokenAddress,
            abi: ERC20Abi,
            functionName: "approve",
            args: [vamosAddress, amount],
        });
    };

    return {
        currentAllowance: currentAllowance ?? BigInt(0),
        approve,
        isPending,
        isConfirming,
        isConfirmed,
        error,
        hash,
        refetchAllowance,
    };
}

