"use client";
import { useMiniApp } from "@/contexts/miniapp-context";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Share2 } from "lucide-react";

// Mock data - should match the data from markets page
const MOCK_MARKETS = [
  {
    id: 1,
    title: "Match: Alex x Jason",
    description: "a bet about a tennis match",
    options: [
      {
        name: "Alex",
        percentage: 65,
        totalAmount: 300000,
        bets: [
          { user: "User 1", amount: 30, avatar: null },
          { user: "User 2", amount: 50, avatar: null },
          { user: "User 3", amount: 100, avatar: null },
        ],
      },
      {
        name: "Jason",
        percentage: 35,
        totalAmount: 100000,
        bets: [
          { user: "User 4", amount: 30, avatar: null },
          { user: "User 5", amount: 20, avatar: null },
          { user: "User 6", amount: 50, avatar: null },
        ],
      },
    ],
  },
  {
    id: 2,
    title: "Match: Maria x Sofia",
    description: "a bet about a basketball match",
    options: [
      {
        name: "Maria",
        percentage: 48,
        totalAmount: 240000,
        bets: [{ user: "User 1", amount: 30, avatar: null }],
      },
      {
        name: "Sofia",
        percentage: 52,
        totalAmount: 260000,
        bets: [{ user: "User 2", amount: 30, avatar: null }],
      },
    ],
  },
  {
    id: 3,
    title: "Match: Bruno x Lucas",
    description: "a bet about a soccer match",
    options: [
      {
        name: "Bruno",
        percentage: 70,
        totalAmount: 350000,
        bets: [{ user: "User 1", amount: 30, avatar: null }],
      },
      {
        name: "Lucas",
        percentage: 30,
        totalAmount: 150000,
        bets: [{ user: "User 2", amount: 30, avatar: null }],
      },
    ],
  },
];

export default function MarketDetails() {
  const { isMiniAppReady } = useMiniApp();
  const params = useParams();
  const marketId = parseInt(params.id as string);

  const market = MOCK_MARKETS.find((m) => m.id === marketId);

  if (!isMiniAppReady) {
    return (
      <main className="flex-1">
        <section className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
          <div className="w-full max-w-md mx-auto p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading...</p>
          </div>
        </section>
      </main>
    );
  }

  if (!market) {
    return (
      <main className="flex-1 min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <p className="text-center text-gray-600">Market not found</p>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <section className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8">
          {/* Header */}
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-start gap-4">
              {/* Market Icon */}
              <div className="w-16 h-16 rounded-full bg-gray-300 flex-shrink-0"></div>

              {/* Title and Description */}
              <div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                  {market.title}
                </h1>
                <p className="text-gray-600">{market.description}</p>
              </div>
            </div>

            {/* Share Button */}
            <button className="flex items-center gap-2 text-orange-500 hover:text-orange-600 transition-colors">
              <span className="text-sm font-medium">share</span>
              <Share2 className="h-5 w-5" />
            </button>
          </div>

          {/* Options Buttons */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <Button className="bg-green-500 hover:bg-green-600 text-white font-bold py-6 text-lg">
              {market.options[0].name}
            </Button>
            <Button className="bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-6 text-lg">
              {market.options[1].name}
            </Button>
          </div>

          {/* Total Amounts and Progress Bar */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
              <span className="text-lg font-semibold">
                ${(market.options[0].totalAmount / 1000).toFixed(0)}k
              </span>
              <span className="text-sm text-gray-500">progress bar</span>
              <span className="text-lg font-semibold">
                ${(market.options[1].totalAmount / 1000).toFixed(0)}k
              </span>
            </div>
            <div className="flex h-3 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="bg-green-500"
                style={{ width: `${market.options[0].percentage}%` }}
              ></div>
              <div
                className="bg-yellow-500"
                style={{ width: `${market.options[1].percentage}%` }}
              ></div>
            </div>
          </div>

          {/* Bets Lists */}
          <div className="grid grid-cols-2 gap-6">
            {/* Option A Bets */}
            <div className="space-y-3">
              {market.options[0].bets.map((bet, index) => (
                <div key={index} className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gray-300 flex-shrink-0"></div>
                  <div>
                    <p className="font-medium text-gray-900">{bet.user}</p>
                    <p className="text-sm text-gray-600">${bet.amount}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Divider */}
            <div className="relative">
              <div className="absolute left-0 top-0 bottom-0 w-px bg-gray-300"></div>

              {/* Option B Bets */}
              <div className="pl-6 space-y-3">
                {market.options[1].bets.map((bet, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gray-300 flex-shrink-0"></div>
                    <div>
                      <p className="font-medium text-gray-900">{bet.user}</p>
                      <p className="text-sm text-gray-600">${bet.amount}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
