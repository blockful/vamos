"use client";
import { useMiniApp } from "@/contexts/miniapp-context";
import { useParams, useRouter } from "next/navigation";
import { Share2, ChevronRight, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ChartContainer, RechartsPrimitive } from "@/components/ui/chart";
import { useState } from "react";

import { useMarket, transformMarketForDetailsUI } from "@/hooks/use-markets";
import { formatCurrency } from "@/lib/utils";
import { useEnsName, formatAddressOrEns } from "@/hooks/use-ens";

export default function MarketDetails() {
  const { isMiniAppReady } = useMiniApp();
  const params = useParams();
  const router = useRouter();
  const [isExiting, setIsExiting] = useState(false);
  const marketId = parseInt(params.id as string);

  // Fetch market data from API
  const { data: apiMarket, isLoading, error } = useMarket(marketId.toString());

  const market = apiMarket ? transformMarketForDetailsUI(apiMarket) : null;

  // Get ENS name for judge if market judge is an address
  const judgeAddress = market?.judge && market.judge.startsWith("0x") ? market.judge : undefined;
  const { data: judgeEnsName } = useEnsName(judgeAddress);

  // Get the latest percentages from chart data
  const getLatestPercentages = () => {
    if (market && market.chartData.length > 0) {
      const latest = market.chartData[market.chartData.length - 1];
      return {
        option1: latest.option1,
        option2: latest.option2,
      };
    }
    return { option1: 50, option2: 50 };
  };

  const latestPercentages = getLatestPercentages();

  // Calculate total amounts based on percentages
  const getTotalAmounts = () => {
    if (market) {
      const total = market.totalVolume;
      return {
        option1: Math.round((total * latestPercentages.option1) / 100),
        option2: Math.round((total * latestPercentages.option2) / 100),
      };
    }
    return { option1: 50, option2: 50 };
  };

  const totalAmounts = getTotalAmounts();

  const handleBack = () => {
    setIsExiting(true);
    setTimeout(() => {
      router.back();
    }, 300);
  };

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
    <main className="flex-1 min-h-screen bg-[#111909]">
      <section
        className="px-2 pb-2 space-y-2"
        style={{
          animation: isExiting
            ? "slide-down 0.3s ease-in forwards"
            : "slide-up 0.5s ease-out",
        }}
      >
        {/* Header Card */}
        <div className="bg-[#FCFDF5] rounded-2xl p-5 space-y-4">
          {/* Back Button */}
          <button
            onClick={handleBack}
            className="flex items-center gap-1 text-black hover:opacity-70 transition-opacity"
          >
            <ChevronLeft className="h-5 w-5" />
            <span className="text-sm font-medium">Back</span>
          </button>

          {/* Top Row - Icon and Badge */}
          <div className="flex items-start justify-between">
            <div className="w-12 h-12 rounded-full bg-[#FEABEF] flex items-center justify-center text-2xl flex-shrink-0">
              {market.icon}
            </div>
            <span
              className={`text-xs font-semibold px-3 py-1 rounded-full whitespace-nowrap flex items-center gap-2 ${
                market.status === "Betting Open"
                  ? "bg-[#FEABEF] bg-opacity-40 text-[#CC66BA]"
                  : "bg-gray-300 text-gray-600"
              }`}
            >
              {market.status === "Betting Open" && (
                <div
                  className="w-2 h-2 rounded-full bg-[#CC66BA]"
                  style={{
                    animation: "pulse-dot 2s infinite",
                    boxShadow: "0 0 0 0 rgba(204, 102, 186, 0.7)",
                  }}
                />
              )}
              {market.status === "Betting Open" ? "BETS OPEN" : "BETS CLOSED"}
            </span>
          </div>

          {/* Title and Description */}
          <div>
            <h1 className="text-2xl font-semibold text-black mb-2">
              {market.title.replace("Match: ", "Tennis Match: ")}
            </h1>
            <p className="text-sm text-gray-700">{market.description}</p>
          </div>

          {/* Judge and Volume */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-gray-300 flex-shrink-0" />
              <span className="text-sm text-black">
                Judge: {judgeAddress ? formatAddressOrEns(judgeAddress, judgeEnsName, true) : market.judge}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold text-black">$</span>
              <span className="text-sm text-black">
                Volume: ${formatCurrency(market.totalVolume)}
              </span>
            </div>
          </div>

          {/* Share Button */}
          <button className="w-full bg-gray-200 hover:bg-gray-300 text-black font-semibold py-2 rounded-2xl flex items-center justify-center gap-2 transition-colors">
            <Share2 className="h-4 w-4" />
            Share
          </button>
        </div>

        {/* Predictions Chart */}
        <div className="bg-[#FCFDF5] rounded-2xl p-5 space-y-4">
          <h2 className="text-xl font-bold text-black">Predictions</h2>

          {/* Legend */}
          <div className="flex gap-6 items-center">
            <div className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: "#A4D18E" }}
              />
              <span className="text-sm font-medium text-black">
                {market.options[0].name}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: "#E3DAA2" }}
              />
              <span className="text-sm font-medium text-black">
                {market.options[1].name}
              </span>
            </div>
          </div>

          {/* Chart */}
          <ChartContainer
            config={{
              option1: {
                label: market.options[0].name,
                color: "#A4D18E",
              },
              option2: {
                label: market.options[1].name,
                color: "#E3DAA2",
              },
            }}
            className="h-64 w-full"
          >
            <RechartsPrimitive.LineChart
              data={market.chartData}
              margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
            >
              <RechartsPrimitive.CartesianGrid
                strokeDasharray="3 3"
                stroke="#e5e7eb"
                vertical={false}
              />
              <RechartsPrimitive.XAxis
                dataKey="date"
                stroke="#6b7280"
                fontSize={11}
                tick={{ fill: "#6b7280" }}
              />
              <RechartsPrimitive.YAxis
                stroke="#6b7280"
                fontSize={11}
                domain={[0, 100]}
                tickFormatter={(value) => `${value}%`}
                tick={{ fill: "#6b7280" }}
              />
              <RechartsPrimitive.Tooltip
                contentStyle={{
                  backgroundColor: "#1f2937",
                  border: "1px solid #374151",
                  borderRadius: "8px",
                  color: "#fff",
                }}
              />
              <RechartsPrimitive.Line
                type="monotone"
                dataKey="option1"
                stroke="#A4D18E"
                strokeWidth={2}
                dot={false}
                name={market.options[0].name}
              />
              <RechartsPrimitive.Line
                type="monotone"
                dataKey="option2"
                stroke="#E3DAA2"
                strokeWidth={2}
                dot={false}
                name={market.options[1].name}
              />
            </RechartsPrimitive.LineChart>
          </ChartContainer>
        </div>

        {/* Betting Options */}
        <div className="space-y-2">
          {market.options.map((option, index) => {
            const percentage =
              index === 0
                ? latestPercentages.option1
                : latestPercentages.option2;
            const totalAmount =
              index === 0 ? totalAmounts.option1 : totalAmounts.option2;

            return (
              <button
                key={index}
                onClick={() => router.push(`/markets/${marketId}/${index}`)}
                className="w-full rounded-2xl overflow-hidden relative h-auto transition-all hover:shadow-lg active:scale-95"
              >
                {/* Colored background for left side and white for right */}
                <div
                  className="absolute inset-0"
                  style={{
                    background: `linear-gradient(to right, ${index === 0 ? "#A4D18E" : "#E3DAA2"} 0%, ${index === 0 ? "#A4D18E" : "#E3DAA2"} 40%, white 40%, white 100%)`,
                  }}
                />

                {/* Content */}
                <div className="relative flex items-center justify-between h-full p-4">
                  <div className="flex-1 flex flex-col">
                    <p className="text-lg text-left font-semibold text-black mb-2">
                      {option.name}
                    </p>
                    <div className="flex gap-8">
                      <div>
                        <p className="text-xs text-black opacity-70">Total</p>
                        <p className="text-sm font-semibold text-black">
                          ${totalAmount}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-black opacity-70">
                          Your bet
                        </p>
                        <p className="text-sm font-semibold text-black">
                          $0.00
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Chevron button */}
                  <div className="flex items-center justify-center w-10 h-10 rounded-full border-2 border-black flex-shrink-0 ml-4">
                    <ChevronRight className="h-5 w-5 text-black" />
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </section>
    </main>
  );
}
