import { useQuery } from "@tanstack/react-query";

// Types for the GraphQL response
interface Outcome {
    description: string;
    outcomeIndex: number;
    totalAmount: string;
}

interface Market {
    id: string;
    question: string;
    status: string;
    totalPool: string;
    createdAt: number;
    outcomes: {
        items: Outcome[];
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
