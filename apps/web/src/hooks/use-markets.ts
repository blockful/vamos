import { useQuery } from "@tanstack/react-query";
import { formatUnits } from "viem";

// Types for the GraphQL response
interface Bet {
    id: string;
    amount: string;
    lastUpdated: number;
    marketId: string;
    outcomeId: string;
    outcomeIndex: number;
    user: string;
}

interface Outcome {
    description: string;
    id: string;
    outcomeIndex: number;
    totalAmount: string;
    bets?: {
        items: Bet[];
    };
}

interface Market {
    id: string;
    question: string;
    status: string;
    totalPool: string;
    createdAt?: number;
    judge?: string;
    numOutcomes?: number;
    noWinners?: boolean;
    protocolFeeAmount?: string;
    poolAfterFees?: string;
    winningOutcome?: number;
    creator?: string;
    creatorFeeAmount?: string;
    outcomes: {
        items: Outcome[];
    };
    bets?: {
        items: Bet[];
    };
}

interface MarketsResponse {
    marketss: {
        items: Market[];
    };
}

// GraphQL query
const MARKETS_QUERY = `
  query Markets {
  marketss(orderBy: "createdAt", orderDirection: "desc") {
    items {
      winningOutcome
      question
      status
      totalPool
      createdAt
      id
      creator
      judge
      outcomes {
        items {
          totalAmount
          description
          outcomeIndex
        }
      }
    }
  }
}
`;

const API_URL = process.env.NEXT_PUBLIC_GRAPHQL_API_URL as string;

/**
 * Helper function to format time ago from timestamp
 */
function formatTimeAgo(timestamp: number): string {
    const now = Math.floor(Date.now() / 1000); // Current time in seconds
    const diff = now - timestamp;

    if (diff < 60) {
        return "just now";
    } else if (diff < 3600) {
        const minutes = Math.floor(diff / 60);
        return `${minutes} minute${minutes > 1 ? "s" : ""} ago`;
    } else if (diff < 86400) {
        const hours = Math.floor(diff / 3600);
        return `${hours} hour${hours > 1 ? "s" : ""} ago`;
    } else if (diff < 604800) {
        const days = Math.floor(diff / 86400);
        return `${days} day${days > 1 ? "s" : ""} ago`;
    } else if (diff < 2592000) {
        const weeks = Math.floor(diff / 604800);
        return `${weeks} week${weeks > 1 ? "s" : ""} ago`;
    } else if (diff < 31536000) {
        const months = Math.floor(diff / 2592000);
        return `${months} month${months > 1 ? "s" : ""} ago`;
    } else {
        const years = Math.floor(diff / 31536000);
        return `${years} year${years > 1 ? "s" : ""} ago`;
    }
}

/**
 * Hook to fetch markets from the indexer API
 */
export function useMarkets() {
    return useQuery({
        queryKey: ["markets"],
        queryFn: async (): Promise<Market[]> => {
            const response = await fetch(API_URL, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    query: MARKETS_QUERY,
                }),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data: { data: MarketsResponse } = await response.json();
            return data.data.marketss.items;
        },
        refetchInterval: 10000, // Refetch every 10 seconds
        staleTime: 5000, // Consider data fresh for 5 seconds
    });
}

/**
 * Hook to fetch a specific market by ID
 */
export function useMarket(marketId: string) {
    return useQuery({
        queryKey: ["market", marketId],
        queryFn: async (): Promise<Market | null> => {
            const MARKET_QUERY = `
                query Market($id: String!) {
                    markets(id: $id) {
                        id
                        winningOutcome
                        judge
                        status
                        totalPool
                        question
                        outcomes {
                            items {
                                description
                                id
                                outcomeIndex
                                totalAmount
                                bets {
                                    items {
                                        id
                                        amount
                                        lastUpdated
                                        marketId
                                        outcomeId
                                        outcomeIndex
                                        user
                                    }
                                }
                            }
                        }
                        creator
                       
                    }
                }
            `;

            const response = await fetch(API_URL, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    query: MARKET_QUERY,
                    variables: { id: marketId },
                }),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data: { data: { markets: Market } } = await response.json();
            return data.data.markets || null;
        },
        // Only refetch manually or on mount
        refetchInterval: 10000, // Refetch every 10 seconds
        staleTime: 5000, // Consider data fresh for 5 seconds
        enabled: !!marketId, // Only run if marketId exists
    });
}

/**
 * Hook to fetch a specific outcome by ID
 */
export function useOutcome(outcomeId: string) {
    return useQuery({
        queryKey: ["outcome", outcomeId],
        queryFn: async (): Promise<Outcome | null> => {
            const OUTCOME_QUERY = `
                query Outcome($id: String!) {
                    outcomes(id: $id) {
                        description
                        totalAmount
                        id
                        outcomeIndex
                        bets {
                            items {
                                id
                                amount
                                lastUpdated
                                marketId
                                outcomeId
                                outcomeIndex
                                user
                            }
                        }
                    }
                }
            `;

            const response = await fetch(API_URL, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    query: OUTCOME_QUERY,
                    variables: { id: outcomeId },
                }),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data: { data: { outcomes: Outcome } } = await response.json();
            return data.data.outcomes || null;
        },
        // Only refetch manually or on mount
        refetchInterval: 10000, // Refetch every 10 seconds
        staleTime: 5000, // Consider data fresh for 5 seconds
        enabled: !!outcomeId, // Only run if outcomeId exists
    });
}

/**
 * Helper function to transform API market to UI format
 */
export function transformMarketForUI(market: Market) {
    const totalPool = parseFloat(formatUnits(BigInt(market.totalPool), 18));

    // Calculate percentages for each outcome
    const options = market.outcomes.items.map((outcome) => {
        const amount = parseFloat(formatUnits(BigInt(outcome.totalAmount), 18));
        const percentage = totalPool > 0 ? Math.round((amount / totalPool) * 100) : 0;

        return {
            id: outcome.outcomeIndex,
            name: outcome.description,
            percentage,
            totalAmount: amount,
            outcomeIndex: outcome.outcomeIndex,
        };
    });

    // Assign colors to options
    const colors = [
        "bg-green-400",
        "bg-yellow-200",
        "bg-pink-300",
        "bg-purple-300",
        "bg-blue-300",
        "bg-red-300",
    ];

    return {
        id: market.id,
        title: market.question,
        status: market.status,
        volume: totalPool,
        icon: "🎯", // You can customize this based on market type
        createdAt: market.createdAt,
        creator: market.creator,
        judge: market.judge,
        winningOutcome: market.winningOutcome,
        timeAgo: market.createdAt ? formatTimeAgo(market.createdAt) : "Unknown",
        options: options.map((opt, index) => ({
            ...opt,
            color: colors[index % colors.length],
        })),
    };
}

/**
 * Helper function to transform API market to detailed UI format for market details page
 */
export function transformMarketForDetailsUI(market: Market) {
    const totalPool = parseFloat(formatUnits(BigInt(market.totalPool), 18));

    // Calculate percentages for each outcome
    const options = market.outcomes.items.map((outcome) => {
        const amount = parseFloat(formatUnits(BigInt(outcome.totalAmount), 18));
        const percentage = totalPool > 0 ? Math.round((amount / totalPool) * 100) : 0;

        return {
            name: outcome.description,
            percentage,
            totalAmount: amount,
            outcomeIndex: outcome.outcomeIndex,
            bets: [], // Bets will need a separate query if needed
        };
    });

    // Generate chart data based on percentages (simplified for now)
    const chartData = Array.from({ length: 8 }, (_, index) => {
        const point: Record<string, number> = { timestamp: index + 1 };
        options.forEach((opt, optIndex) => {
            point[`option${optIndex + 1}`] = opt.percentage;
        });
        return point;
    });

    return {
        id: market.id,
        title: market.question,
        description: market.createdAt
            ? `Market created at ${new Date(market.createdAt * 1000).toLocaleDateString()}`
            : "Prediction Market",
        judge: market.judge || "TBD",
        icon: "🎯",
        status: market.status,
        totalVolume: totalPool,
        winningOutcome: market.winningOutcome,
        options,
        chartData,
    };
}

/**
 * Helper function to transform API outcome to UI format for option details page
 */
export function transformOutcomeForUI(outcome: Outcome) {
    const totalAmount = parseFloat(formatUnits(BigInt(outcome.totalAmount), 18));

    // Transform bets for UI - keep full address for ENS resolution
    const bets = outcome.bets?.items.map((bet) => ({
        address: bet.user, // Keep full address for ENS resolution
        amount: parseFloat(formatUnits(BigInt(bet.amount), 18)),
        timestamp: bet.lastUpdated * 1000, // Convert to milliseconds
        avatar: null, // Avatar is not available from API, will fallback to /avatar.png
    })) || [];

    // Generate simple chart data (can be enhanced with real historical data later)
    const chartData = Array.from({ length: 8 }, (_, index) => ({
        timestamp: index + 1,
        value: totalAmount > 0 ? 50 + Math.random() * 20 : 0, // Mock data for now
    }));

    return {
        name: outcome.description,
        totalAmount,
        bets,
        chartData,
    };
}
