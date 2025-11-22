"use client";
import { useMiniApp } from "@/contexts/miniapp-context";
import { useParams, useRouter } from "next/navigation";
import { Share2, ChevronRight, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

// Mock data - should match the data from markets page
const MOCK_MARKETS = [
  {
    id: 1,
    title: "Match: Alex x Jason",
    description: "A bet about a tennis match",
    judge: "isadorable.eth",
    icon: "🎾",
    status: "Betting Open",
    totalVolume: 100,
    options: [
      {
        name: "Alex",
        percentage: 65,
        totalAmount: 50,
        bets: [
          { user: "User 1", amount: 30, avatar: null },
          { user: "User 2", amount: 50, avatar: null },
          { user: "User 3", amount: 100, avatar: null },
        ],
      },
      {
        name: "Jason",
        percentage: 35,
        totalAmount: 50,
        bets: [
          { user: "User 4", amount: 30, avatar: null },
          { user: "User 5", amount: 20, avatar: null },
          { user: "User 6", amount: 50, avatar: null },
        ],
      },
    ],
    chartData: [
      { timestamp: 1, option1: 45, option2: 55 },
      { timestamp: 2, option1: 52, option2: 48 },
      { timestamp: 3, option1: 48, option2: 52 },
      { timestamp: 4, option1: 55, option2: 45 },
      { timestamp: 5, option1: 58, option2: 42 },
      { timestamp: 6, option1: 53, option2: 47 },
      { timestamp: 7, option1: 60, option2: 40 },
      { timestamp: 8, option1: 65, option2: 35 },
    ],
  },
  {
    id: 2,
    title: "Match: Maria x Sofia",
    description: "A bet about a basketball match",
    judge: "basketballjudge.eth",
    icon: "🏀",
    status: "Betting Open",
    totalVolume: 85,
    options: [
      {
        name: "Maria",
        percentage: 48,
        totalAmount: 40,
        bets: [{ user: "User 1", amount: 30, avatar: null }],
      },
      {
        name: "Sofia",
        percentage: 52,
        totalAmount: 45,
        bets: [{ user: "User 2", amount: 30, avatar: null }],
      },
    ],
    chartData: [
      { timestamp: 1, option1: 50, option2: 50 },
      { timestamp: 2, option1: 48, option2: 52 },
    ],
  },
  {
    id: 3,
    title: "Match: Bruno x Lucas",
    description: "A bet about a soccer match",
    judge: "soccerref.eth",
    icon: "⚽",
    status: "Betting Closed",
    totalVolume: 120,
    options: [
      {
        name: "Bruno",
        percentage: 70,
        totalAmount: 84,
        bets: [{ user: "User 1", amount: 30, avatar: null }],
      },
      {
        name: "Lucas",
        percentage: 30,
        totalAmount: 36,
        bets: [{ user: "User 2", amount: 30, avatar: null }],
      },
    ],
    chartData: [
      { timestamp: 1, option1: 60, option2: 40 },
      { timestamp: 2, option1: 70, option2: 30 },
    ],
  },
];

export default function MarketDetails() {
  const { isMiniAppReady } = useMiniApp();
  const params = useParams();
  const router = useRouter();
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
      <section className="max-w-2xl mx-auto px-4 py-8">
        <div className="bg-white rounded-3xl shadow-xl p-6 space-y-6">
          {/* Header with Back Button, Icon, Title, Description, Judge, and Share */}
          <div className="flex items-start gap-4">
            {/* Back Button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.back()}
              className="flex-shrink-0"
            >
              <ChevronLeft className="h-6 w-6" />
            </Button>

            {/* Market Icon */}
            <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center text-4xl flex-shrink-0">
              {market.icon}
            </div>

            {/* Info Section */}
            <div className="flex-1">
              <h1 className="text-xl font-bold text-gray-900 mb-1">
                {market.title}
              </h1>
              <p className="text-sm text-gray-600 mb-1">{market.description}</p>
              <p className="text-sm text-gray-700">
                <span className="font-medium">Judge:</span> {market.judge}
              </p>
            </div>

            {/* Share Button */}
            <Button
              variant="ghost"
              size="sm"
              className="flex items-center gap-1 text-orange-500 hover:text-orange-600 flex-shrink-0"
            >
              <span className="text-sm font-medium">share</span>
              <Share2 className="h-4 w-4" />
            </Button>
          </div>

          {/* Bet Volume and Status */}
          <div className="bg-gray-100 rounded-2xl p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-600 uppercase tracking-wide mb-1">
                BET VOLUME
              </p>
              <p className="text-2xl font-bold text-gray-900">
                ${market.totalVolume}
              </p>
            </div>
            <div className="bg-gray-300 px-4 py-2 rounded-lg">
              <p className="text-sm font-medium text-gray-700">
                {market.status}
              </p>
            </div>
          </div>

          {/* Chart Placeholder */}
          <div className="bg-gray-100 rounded-2xl p-4 h-48 relative overflow-hidden">
            {/* Simple SVG Line Chart */}
            <svg
              className="w-full h-full"
              viewBox="0 0 400 160"
              preserveAspectRatio="none"
            >
              {/* Grid lines */}
              <line
                x1="0"
                y1="40"
                x2="400"
                y2="40"
                stroke="#e5e7eb"
                strokeWidth="1"
              />
              <line
                x1="0"
                y1="80"
                x2="400"
                y2="80"
                stroke="#e5e7eb"
                strokeWidth="1"
              />
              <line
                x1="0"
                y1="120"
                x2="400"
                y2="120"
                stroke="#e5e7eb"
                strokeWidth="1"
              />

              {/* Option 1 Line (Gray) */}
              <polyline
                fill="none"
                stroke="#9ca3af"
                strokeWidth="3"
                points={market.chartData
                  .map((point, index) => {
                    const x = (index / (market.chartData.length - 1)) * 400;
                    const y = 160 - (point.option1 / 100) * 160;
                    return `${x},${y}`;
                  })
                  .join(" ")}
              />

              {/* Option 2 Line (Yellow) */}
              <polyline
                fill="none"
                stroke="#fbbf24"
                strokeWidth="3"
                points={market.chartData
                  .map((point, index) => {
                    const x = (index / (market.chartData.length - 1)) * 400;
                    const y = 160 - (point.option2 / 100) * 160;
                    return `${x},${y}`;
                  })
                  .join(" ")}
              />
            </svg>
          </div>

          {/* Betting Options */}
          <div className="space-y-3">
            {/* Option 1 */}
            <Button
              variant="outline"
              onClick={() => router.push(`/markets/${marketId}/0`)}
              className="w-full bg-gray-200 hover:bg-gray-300 transition-colors rounded-2xl p-4 h-auto flex items-center justify-between group border-0"
            >
              <div className="text-left">
                <p className="text-lg font-bold text-gray-900">
                  {market.options[0].name}
                </p>
                <p className="text-sm text-gray-600">
                  ${market.options[0].totalAmount}
                </p>
              </div>
              <ChevronRight className="h-6 w-6 text-gray-600 group-hover:text-gray-800" />
            </Button>

            {/* Option 2 */}
            <Button
              variant="outline"
              onClick={() => router.push(`/markets/${marketId}/1`)}
              className="w-full bg-yellow-400 hover:bg-yellow-500 transition-colors rounded-2xl p-4 h-auto flex items-center justify-between group border-0"
            >
              <div className="text-left">
                <p className="text-lg font-bold text-gray-900">
                  {market.options[1].name}
                </p>
                <p className="text-sm text-gray-700">
                  ${market.options[1].totalAmount}
                </p>
              </div>
              <ChevronRight className="h-6 w-6 text-gray-700 group-hover:text-gray-900" />
            </Button>
          </div>
        </div>
      </section>
    </main>
  );
}
