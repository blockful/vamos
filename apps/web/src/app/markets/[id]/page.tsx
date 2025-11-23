"use client";
import { useMiniApp } from "@/contexts/miniapp-context";
import { useParams, useRouter } from "next/navigation";
import { Share2, ChevronRight, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMarket, transformMarketForDetailsUI } from "@/hooks/use-markets";

export default function MarketDetails() {
  const { isMiniAppReady } = useMiniApp();
  const params = useParams();
  const router = useRouter();
  const marketId = params.id as string;

  // Fetch market data from API
  const { data: apiMarket, isLoading, error } = useMarket(marketId);

  // Transform market data for UI
  const market = apiMarket ? transformMarketForDetailsUI(apiMarket) : null;

  if (!isMiniAppReady || isLoading) {
    return (
      <main className="flex-1">
        <section className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
          <div className="w-full max-w-md mx-auto p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">
              {!isMiniAppReady ? "Loading..." : "Loading market..."}
            </p>
          </div>
        </section>
      </main>
    );
  }

  if (error) {
    return (
      <main className="flex-1 min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="text-center">
            <p className="text-red-600 mb-4">Error loading market</p>
            <p className="text-gray-600 mb-4">{error.message}</p>
            <Button onClick={() => router.back()}>Go Back</Button>
          </div>
        </div>
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
