import { useQuery } from "@tanstack/react-query";
import { formatUnits } from "viem";
import { formatTimeAgo } from "@/app/helpers/formatTimeAgo";
import ColorHash from "color-hash";

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

// Predefined colors for common option names
const PRESET_OPTION_COLORS: Record<string, string> = {
    // Yes/No variations
    "yes": "#A4D18E",      // Green
    "sim": "#A4D18E",      // Green
    "no": "#ff9999",       // Light red/pink
    "não": "#ff9999",      // Light red/pink
    "nao": "#ff9999",      // Light red/pink

    // True/False
    "true": "#A4D18E",     // Green
    "verdadeiro": "#A4D18E", // Green
    "false": "#ff9999",    // Light red/pink
    "falso": "#ff9999",    // Light red/pink

    // Win/Lose
    "win": "#A4D18E",      // Green
    "vitória": "#A4D18E",  // Green
    "vitoria": "#A4D18E",  // Green
    "lose": "#ff9999",     // Light red/pink
    "derrota": "#ff9999",  // Light red/pink

    // Pass/Fail
    "pass": "#A4D18E",     // Green
    "passou": "#A4D18E",   // Green
    "fail": "#ff9999",     // Light red/pink
    "falhou": "#ff9999",   // Light red/pink

    // Up/Down
    "up": "#A4D18E",       // Green
    "subir": "#A4D18E",    // Green
    "down": "#ff9999",     // Light red/pink
    "descer": "#ff9999",   // Light red/pink

    // High/Low
    "high": "#A4D18E",     // Green
    "alto": "#A4D18E",     // Green
    "low": "#ff9999",      // Light red/pink
    "baixo": "#ff9999",    // Light red/pink

    // Bull/Bear (for trading markets)
    "bull": "#A4D18E",     // Green
    "bullish": "#A4D18E",  // Green
    "bear": "#ff9999",     // Light red/pink
    "bearish": "#ff9999",  // Light red/pink

    // Common neutral options
    "maybe": "#E3DAA2",    // Yellow/beige
    "talvez": "#E3DAA2",   // Yellow/beige
    "neutral": "#E3DAA2",  // Yellow/beige
    "draw": "#E3DAA2",     // Yellow/beige
    "empate": "#E3DAA2",   // Yellow/beige
};

const colorHash = new ColorHash({
    saturation: [0.4, 0.5],
    lightness: [0.75, 0.85]
});


// Helper function to get color based on option name
export const getColorForOption = (optionName: string): string => {
    const normalizedName = optionName.trim().toLowerCase();

    // Check if option has a preset color
    if (PRESET_OPTION_COLORS[normalizedName]) {
        return PRESET_OPTION_COLORS[normalizedName];
    }

    // For other options, use ColorHash to generate consistent colors
    return colorHash.hex(optionName);
};

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
 * @param marketId - The ID of the market to fetch
 * @param userAddress - Optional user address to filter bets for "Your bet" display
 */
export function useMarket(marketId: string, userAddress?: string) {
    return useQuery({
        queryKey: ["market", marketId, userAddress],
        queryFn: async (): Promise<Market | null> => {
            const MARKET_QUERY = `
                query Market($id: String!, $userAddress: String) {
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
                                bets(where: {user: $userAddress}) {
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
                        createdAt
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
                    variables: {
                        id: marketId,
                        userAddress: userAddress?.toLowerCase() // Normalize address to lowercase
                    },
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
                        bets(orderBy: "amount", orderDirection: "desc") {
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
 * Helper function to calculate user's bet amount for a specific outcome
 */
export function calculateUserBetForOutcome(outcome: Outcome): number {
    if (!outcome.bets?.items || outcome.bets.items.length === 0) {
        return 0;
    }

    // Sum all bets from the user (should typically be just one per outcome)
    const totalUserBet = outcome.bets.items.reduce((sum, bet) => {
        return sum + parseFloat(formatUnits(BigInt(bet.amount), 18));
    }, 0);

    return totalUserBet;
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
        const userBet = calculateUserBetForOutcome(outcome);

        return {
            id: outcome.outcomeIndex,
            name: outcome.description,
            percentage,
            totalAmount: amount,
            outcomeIndex: outcome.outcomeIndex,
            userBet,
        };
    });


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
        options: options.map((opt) => ({
            ...opt,
            color: getColorForOption(opt.name || ""),
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
        const userBet = calculateUserBetForOutcome(outcome);

        return {
            name: outcome.description,
            percentage,
            totalAmount: amount,
            outcomeIndex: outcome.outcomeIndex,
            userBet,
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
