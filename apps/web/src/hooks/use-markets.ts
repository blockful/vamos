import { useQuery } from "@tanstack/react-query";

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
    marketss {
      items {
        question
        status
        totalPool
        createdAt
        id
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

// API URL - ajuste conforme necessário
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:42069/graphql";

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
        // Refetch every 30 seconds to get updates
        refetchInterval: 30000,
        // Keep previous data while refetching
        staleTime: 10000,
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
                        judge
                        numOutcomes
                        noWinners
                        protocolFeeAmount
                        poolAfterFees
                        status
                        totalPool
                        winningOutcome
                        question
                        outcomes {
                            items {
                                description
                                id
                                outcomeIndex
                                totalAmount
                            }
                        }
                        creator
                        creatorFeeAmount
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
        // Refetch every 30 seconds to get updates
        refetchInterval: 30000,
        // Keep previous data while refetching
        staleTime: 10000,
        enabled: !!marketId, // Only run if marketId exists
    });
}

/**
 * Helper function to transform API market to UI format
 */
export function transformMarketForUI(market: Market) {
    const totalPool = parseFloat(market.totalPool);

    // Calculate percentages for each outcome
    const options = market.outcomes.items.map((outcome) => {
        const amount = parseFloat(outcome.totalAmount);
        const percentage = totalPool > 0 ? Math.round((amount / totalPool) * 100) : 0;

        return {
            id: outcome.outcomeIndex,
            name: outcome.description,
            percentage,
            totalAmount: amount,
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
        status: market.status === "OPEN" ? "BETS OPEN" : "BETS CLOSED",
        volume: totalPool,
        icon: "🎯", // You can customize this based on market type
        createdAt: market.createdAt,
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
    const totalPool = parseFloat(market.totalPool);

    // Calculate percentages for each outcome
    const options = market.outcomes.items.map((outcome) => {
        const amount = parseFloat(outcome.totalAmount);
        const percentage = totalPool > 0 ? Math.round((amount / totalPool) * 100) : 0;

        return {
            name: outcome.description,
            percentage,
            totalAmount: amount,
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
        status: market.status === "OPEN" ? "Betting Open" : "Betting Closed",
        totalVolume: totalPool,
        options,
        chartData,
    };
}
