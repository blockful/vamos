"use client";
import { useMiniApp } from "@/contexts/miniapp-context";
import { useParams, useRouter } from "next/navigation";
import { Share2, ChevronLeft, Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { useState, useEffect } from "react";
import { usePlacePrediction } from "@/hooks/use-vamos-contract";
import { useMarket, transformOutcomeForUI } from "@/hooks/use-markets";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export default function OptionDetails() {
  const { isMiniAppReady } = useMiniApp();
  const params = useParams();
  const router = useRouter();
  const marketId = params.id as string;
  const optionIndex = parseInt(params.option as string);
  const [betAmount, setBetAmount] = useState(0);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(true);
  const [isExiting, setIsExiting] = useState(false);

  const { placePrediction, isPending, isConfirming, isConfirmed, error } =
    usePlacePrediction();

  // Fetch market data to get the outcome
  const {
    data: marketData,
    isLoading: isLoadingMarket,
    error: marketError,
  } = useMarket(marketId);

  // Get the specific outcome from the market data
  const outcomeData = marketData?.outcomes.items[optionIndex];
  const option = outcomeData ? transformOutcomeForUI(outcomeData) : null;

  useEffect(() => {
    if (isConfirmed) {
      setShowConfirmation(true);
    }
  }, [isConfirmed]);

  const handleIncrement = () => setBetAmount((prev) => prev + 1);
  const handleDecrement = () => setBetAmount((prev) => Math.max(1, prev - 1));
  const handleQuickAdd = (amount: number) =>
    setBetAmount((prev) => prev + amount);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Allow empty string for better UX when deleting
    if (value === "") {
      setBetAmount(0);
      return;
    }
    // Only allow numbers
    const numValue = parseInt(value.replace(/\D/g, ""));
    if (!isNaN(numValue) && numValue >= 0) {
      setBetAmount(numValue);
    }
  };

  const handleInputBlur = () => {
    // Ensure minimum value of 1 when input loses focus
    if (betAmount < 1) {
      setBetAmount(1);
    }
  };

  const handleConfirmBet = async () => {
    // Ensure minimum value before confirming
    if (betAmount < 1) {
      setBetAmount(1);
      return;
    }

    try {
      await placePrediction(
        BigInt(marketId),
        BigInt(optionIndex),
        BigInt(betAmount)
      );
    } catch (err) {
      console.error("Error placing prediction:", err);
    }
  };

  const handleCloseConfirmation = () => {
    setIsDrawerOpen(false);
    setShowConfirmation(false);
    setBetAmount(30);
  };

  const handleShare = () => {
    // TODO: Implement share logic
  };

  if (!isMiniAppReady || isLoadingMarket) {
    return (
      <main className="flex-1">
        <section className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
          <div className="w-full max-w-md mx-auto p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">
              {!isMiniAppReady ? "Loading..." : "Loading option..."}
            </p>
          </div>
        </section>
      </main>
    );
  }

  if (marketError || !option) {
    return (
      <main className="flex-1 min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="max-w-2xl mx-auto px-4 py-8 text-center">
          <p className="text-red-600 mb-4">
            {marketError ? "Error loading option" : "Option not found"}
          </p>
          {marketError && (
            <p className="text-gray-600 mb-4">{marketError.message}</p>
          )}
          <Button onClick={() => router.back()}>Go Back</Button>
        </div>
      </main>
    );
  }

  const handleBack = () => {
    setIsExiting(true);
    setTimeout(() => {
      router.back();
    }, 600);
  };

  return (
    <main className={`fixed inset-0 z-50 w-full h-screen max-h-screen overflow-y-auto bg-[#FCFDF5] flex flex-col ${
      isExiting ? 'animate-slide-out-to-right' : 'animate-slide-in-from-right'
    }`}>
      {/* Header - Fixed at top */}
      <div className="sticky top-0 z-40 flex flex-col bg-[#FCFDF5] p-6 border-b-2 border-[#111909] flex-shrink-0">
        <div className="flex items-center justify-between mb-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleBack}
            className="text-[#111909]"
          >
            <ChevronLeft className="h-6 w-6" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={handleShare}
            className="text-[#111909]"
          >
            <Share2 className="h-6 w-6" />
          </Button>
        </div>

        <div className="flex-1">
          <h1 className="text-2xl font-semibold text-black">{option.name}</h1>
          <p className="text-lg font-semibold text-black">${option.totalAmount}</p>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-6 pb-32">
        {/* Chart */}
        <div className="h-64">
          {option.chartData && option.chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={option.chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="date"
                  tick={{ fill: "#111909" }}
                  tickFormatter={(value) => {
                    const date = new Date(value);
                    return `${date.getMonth() + 1}/${date.getDate()}`;
                  }}
                />
                <YAxis
                  domain={[0, 100]}
                  tick={{ fill: "#111909" }}
                  tickFormatter={(value) => `${value}%`}
                />
                <Tooltip
                  formatter={(value) => `${value}%`}
                  contentStyle={{ backgroundColor: "#FCFDF5", border: "2px solid #111909" }}
                  labelStyle={{ color: "#111909" }}
                />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="#A4D18E"
                  dot={false}
                  strokeWidth={3}
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500">
              No data available
            </div>
          )}
        </div>

        {/* Divider */}
        <div className="border-b-2 border-dashed border-gray-300 my-4"></div>

        {/* Bets Section */}
        <div>
          <h2 className="text-lg font-semibold text-black mb-4">Bets</h2>
          <div className="space-y-3">
            {option.bets.map((bet, index) => (
              <div
                key={index}
                className="flex items-center gap-3 p-3 bg-[#FCFDF5] rounded-lg border-2 border-[#111909]"
              >
                <div className="w-12 h-12 rounded-full bg-gray-300 flex-shrink-0 flex items-center justify-center overflow-hidden border-2 border-[#111909]">
                  {bet.avatar ? (
                    <img
                      src={bet.avatar}
                      alt={bet.address}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <img
                      src="/avatar.png"
                      alt="default avatar"
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>

                <div className="flex-1">
                  <p className="font-semibold text-black">{bet.address}</p>
                  <p className="text-lg font-bold text-black">${bet.amount}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Fixed Button at Bottom */}
      <div className="fixed bottom-0 left-0 right-0 bg-[#FCFDF5] p-6 border-t-2 border-[#111909]">
        <Button
          onClick={() => setIsDrawerOpen(true)}
          className="w-full bg-[#FEABEF] hover:bg-[#CC66BA] text-black font-semibold py-6 text-lg rounded-full border-2 border-[#111909]"
          style={{ boxShadow: "2px 2px 0px #111909" }}
        >
          Place bet
        </Button>
      </div>

      {/* Place Bet Drawer */}
      <Drawer
        open={isDrawerOpen}
        onOpenChange={(open) => {
          setIsDrawerOpen(open);
          if (!open) {
            setShowConfirmation(false);
          }
        }}
      >
        <DrawerContent className="bg-[#FCFDF5] border-t-2 border-[#111909]">
          {!showConfirmation ? (
            <>
              <DrawerHeader className="border-b-2 border-[#111909]">
                <DrawerTitle className="text-black">Place bet</DrawerTitle>
                <p className="text-2xl font-bold text-black mt-2">{option.name}</p>
              </DrawerHeader>

              <div className="p-6 space-y-6 pb-32">
                {/* Amount Controls */}
                <div className="flex items-center justify-center gap-4">
                  <button
                    onClick={handleDecrement}
                    className="w-14 h-14 flex-shrink-0 rounded-full flex items-center justify-center text-black bg-[#FEABEF] hover:bg-[#CC66BA] transition-colors border-2 border-[#111909]"
                  >
                    <Minus className="h-6 w-6" />
                  </button>

                  <div className="flex items-center justify-center gap-2">
                    <span className="text-4xl font-bold text-black">$</span>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={betAmount}
                      onChange={handleInputChange}
                      onBlur={handleInputBlur}
                      className="w-24 text-4xl font-bold text-black text-center bg-transparent outline-none"
                    />
                  </div>

                  <button
                    onClick={handleIncrement}
                    className="w-14 h-14 flex-shrink-0 rounded-full flex items-center justify-center text-black bg-[#FEABEF] hover:bg-[#CC66BA] transition-colors border-2 border-[#111909]"
                  >
                    <Plus className="h-6 w-6" />
                  </button>
                </div>

                {/* Quick Add Buttons */}
                <div className="flex items-center justify-center gap-3">
                  <button
                    onClick={() => setBetAmount(0)}
                    className="px-6 py-2 bg-white border-2 border-[#111909] rounded-lg font-medium text-black transition-colors"
                  >
                    Reset
                  </button>
                  <button
                    onClick={() => handleQuickAdd(10)}
                    className="px-6 py-2 bg-white border-2 border-[#111909] rounded-lg font-medium text-black transition-colors"
                  >
                    +$10
                  </button>
                  <button
                    onClick={() => handleQuickAdd(20)}
                    className="px-6 py-2 bg-white border-2 border-[#111909] rounded-lg font-medium text-black transition-colors"
                  >
                    +$20
                  </button>
                  <button
                    onClick={() => handleQuickAdd(30)}
                    className="px-6 py-2 bg-white border-2 border-[#111909] rounded-lg font-medium text-black transition-colors"
                  >
                    +$30
                  </button>
                </div>

                <p className="text-sm text-gray-600 text-center">
                  *Once you confirm a bet you cannot undo it
                </p>
              </div>

              <div className="fixed bottom-0 left-0 right-0 bg-[#FCFDF5] p-6 border-t-2 border-[#111909]">
                <Button
                  onClick={handleConfirmBet}
                  className="w-full bg-[#FEABEF] hover:bg-[#CC66BA] text-black font-semibold py-6 text-lg rounded-full border-2 border-[#111909]"
                  style={{ boxShadow: "2px 2px 0px #111909" }}
                  disabled={isPending || isConfirming || betAmount < 1}
                >
                  {isPending || isConfirming ? "Processing..." : "Confirm bet"}
                </Button>
                {error && (
                  <p className="text-sm text-red-500 text-center mt-2">
                    Error: {error.message}
                  </p>
                )}
              </div>
            </>
          ) : (
            <>
              <div className="flex flex-col items-center justify-center py-8 space-y-6 px-4">
                <div className="w-40 h-40 rounded-full bg-gray-300 flex items-center justify-center">
                  <div className="w-32 h-32 rounded-full bg-gray-400"></div>
                </div>

                <div className="text-center">
                  <h2 className="text-2xl font-bold text-black">
                    I&apos;m rooting for {option.name}!
                  </h2>
                </div>

                <div className="w-full space-y-3 px-4">
                  <Button
                    onClick={handleShare}
                    className="w-full bg-[#FEABEF] hover:bg-[#CC66BA] text-black font-semibold py-6 text-lg rounded-full border-2 border-[#111909]"
                    style={{ boxShadow: "2px 2px 0px #111909" }}
                  >
                    Share
                  </Button>
                  <Button
                    onClick={handleCloseConfirmation}
                    className="w-full bg-white hover:bg-gray-50 text-black font-semibold py-6 text-lg rounded-full border-2 border-[#111909]"
                    style={{ boxShadow: "2px 2px 0px #111909" }}
                  >
                    Close
                  </Button>
                </div>
              </div>
            </>
          )}
        </DrawerContent>
      </Drawer>
    </main>
  );
}
