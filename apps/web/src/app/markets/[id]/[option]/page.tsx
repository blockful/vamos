"use client";
import { useMiniApp } from "@/contexts/miniapp-context";
import { useParams, useRouter } from "next/navigation";
import { Share2, ChevronLeft, Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { useState, useEffect } from "react";
import { usePlacePrediction, useTokenApproval } from "@/hooks/use-vamos-contract";
import { useMarket, transformOutcomeForUI } from "@/hooks/use-markets";
import { parseUnits } from "viem";

export default function OptionDetails() {
  const { isMiniAppReady } = useMiniApp();
  const params = useParams();
  const router = useRouter();
  const marketId = params.id as string;
  const optionIndex = parseInt(params.option as string);
  const [betAmount, setBetAmount] = useState(30);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [needsApproval, setNeedsApproval] = useState(false);

  const { placePrediction, isPending, isConfirming, isConfirmed, error } =
    usePlacePrediction();

  const {
    currentAllowance,
    approve,
    isPending: isApprovePending,
    isConfirming: isApproveConfirming,
    isConfirmed: isApproveConfirmed,
    error: approveError,
    refetchAllowance,
  } = useTokenApproval();

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

  // Refetch allowance and proceed with prediction after approval
  useEffect(() => {
    if (isApproveConfirmed && needsApproval) {
      // After approval, wait a moment for the blockchain state to update, then refetch and place prediction
      const placePredictionAfterApproval = async () => {
        try {
          // Refetch allowance and wait for it
          await refetchAllowance();
          
          const amountInWei = parseUnits(betAmount.toString(), 18);
          setNeedsApproval(false);
          
          // Now place the prediction
          await placePrediction(
            BigInt(marketId),
            BigInt(optionIndex),
            amountInWei
          );
        } catch (err) {
          console.error("Error placing prediction after approval:", err);
          setNeedsApproval(false); // Reset state on error
        }
      };
      placePredictionAfterApproval();
    }
  }, [isApproveConfirmed, needsApproval, refetchAllowance, betAmount, marketId, optionIndex, placePrediction]);

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
      // Convert bet amount to token units (assuming 18 decimals for ERC20)
      const amountInWei = parseUnits(betAmount.toString(), 18);

      // If we're in approval flow, wait for it to complete
      if (needsApproval && (isApprovePending || isApproveConfirming)) {
        return;
      }

      // If approval was just confirmed, let the useEffect handle the prediction
      if (needsApproval && isApproveConfirmed) {
        return;
      }

      // Refetch the latest allowance before checking
      const { data: latestAllowance } = await refetchAllowance();
      const currentAllowanceValue = latestAllowance ?? currentAllowance;

      // Check if approval is needed
      if (currentAllowanceValue < amountInWei) {
        setNeedsApproval(true);
        await approve(amountInWei);
        // Wait for approval confirmation before proceeding
        return;
      }

      // If already approved, place prediction
      setNeedsApproval(false);
      await placePrediction(
        BigInt(marketId),
        BigInt(optionIndex),
        amountInWei
      );
    } catch (err) {
      console.error("Error placing prediction:", err);
      setNeedsApproval(false); // Reset state on error
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

  return (
    <main className="flex-1 min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <section className="max-w-2xl mx-auto px-4 py-8">
        <div className="bg-white rounded-3xl shadow-xl p-6 space-y-6">
          {/* Header with Back Button, Option Name, Amount, and Share */}
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3 flex-1">
              {/* Back Button */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => router.back()}
                className="mt-1"
              >
                <ChevronLeft className="h-6 w-6" />
              </Button>

              {/* Option Info */}
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-1">
                  {option.name}
                </h1>
                <p className="text-2xl font-semibold text-gray-700">
                  ${option.totalAmount}
                </p>
              </div>
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

          {/* Chart - Only this option's line */}
          <div className="bg-gray-100 rounded-2xl p-4 h-48 relative overflow-hidden">
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

              {/* Option Line (Gray) */}
              <polyline
                fill="none"
                stroke="#9ca3af"
                strokeWidth="3"
                points={option.chartData
                  .map((point, index) => {
                    const x = (index / (option.chartData.length - 1)) * 400;
                    const y = 160 - (point.value / 100) * 160;
                    return `${x},${y}`;
                  })
                  .join(" ")}
              />
            </svg>
          </div>

          {/* Bets Section */}
          <div>
            <h2 className="text-lg font-bold text-gray-900 mb-4">Bets</h2>
            <div className="space-y-3">
              {option.bets.map((bet, index) => (
                <div
                  key={index}
                  className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                >
                  {/* Avatar */}
                  <div className="w-12 h-12 rounded-full bg-gray-300 flex-shrink-0 flex items-center justify-center">
                    <span className="text-sm font-bold text-gray-600">
                      {bet.user.charAt(0)}
                    </span>
                  </div>

                  {/* User Info */}
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900">{bet.user}</p>
                    <p className="text-xs text-gray-500">{bet.address}</p>
                  </div>

                  {/* Bet Amount */}
                  <div className="text-right">
                    <p className="text-lg font-bold text-gray-900">
                      ${bet.amount}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Place Bet Button */}
          <Drawer
            open={isDrawerOpen}
            onOpenChange={(open) => {
              setIsDrawerOpen(open);
              if (!open) {
                // Reset confirmation state when drawer closes
                setShowConfirmation(false);
              }
            }}
          >
            <DrawerTrigger asChild>
              <Button
                className="w-full text-white font-bold py-6 text-lg rounded-2xl"
                style={{ backgroundColor: "#A4D18E" }}
              >
                Place Bet
              </Button>
            </DrawerTrigger>
            <DrawerContent>
              <div className="mx-auto w-full max-w-sm">
                {!showConfirmation ? (
                  <>
                    {/* Place Bet Form */}
                    <DrawerHeader>
                      <DrawerTitle className="text-left text-lg font-bold">
                        Place bet
                      </DrawerTitle>
                      <DrawerDescription className="text-left text-2xl font-bold text-gray-900">
                        {option.name}
                      </DrawerDescription>
                    </DrawerHeader>

                    <div className="p-4 space-y-6">
                      {/* Amount Controls */}
                      <div className="flex items-center justify-center gap-4">
                        {/* Decrement Button */}
                        <button
                          onClick={handleDecrement}
                          className="w-14 h-14 flex-shrink-0 rounded-full flex items-center justify-center text-white transition-colors"
                          style={{ backgroundColor: "#A4D18E" }}
                        >
                          <Minus className="h-6 w-6" />
                        </button>

                        {/* Amount Input */}
                        <div className="relative min-w-[140px]">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-4xl font-bold text-gray-900 pointer-events-none z-10">
                            $
                          </span>
                          <Input
                            type="text"
                            inputMode="numeric"
                            value={betAmount}
                            onChange={handleInputChange}
                            onBlur={handleInputBlur}
                            className="w-full text-4xl font-bold text-gray-900 text-center border-none shadow-none pl-9 h-auto py-2 focus-visible:ring-0"
                          />
                        </div>

                        {/* Increment Button */}
                        <button
                          onClick={handleIncrement}
                          className="w-14 h-14 flex-shrink-0 rounded-full flex items-center justify-center text-white transition-colors"
                          style={{ backgroundColor: "#A4D18E" }}
                        >
                          <Plus className="h-6 w-6" />
                        </button>
                      </div>

                      {/* Quick Add Buttons */}
                      <div className="flex items-center justify-center gap-3">
                        <button
                          onClick={() => handleQuickAdd(10)}
                          className="px-6 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg font-medium text-gray-900 transition-colors"
                        >
                          +$10
                        </button>
                        <button
                          onClick={() => handleQuickAdd(20)}
                          className="px-6 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg font-medium text-gray-900 transition-colors"
                        >
                          +$20
                        </button>
                        <button
                          onClick={() => handleQuickAdd(30)}
                          className="px-6 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg font-medium text-gray-900 transition-colors"
                        >
                          +$30
                        </button>
                      </div>

                      {/* Warning Text */}
                      <p className="text-sm text-gray-600 text-center">
                        *Once you confirm a bet you cannot undo it
                      </p>
                    </div>

                    <DrawerFooter>
                      <Button
                        onClick={handleConfirmBet}
                        className="w-full text-white font-bold py-6 text-lg rounded-2xl"
                        style={{ backgroundColor: "#A4D18E" }}
                        disabled={
                          isPending ||
                          isConfirming ||
                          isApprovePending ||
                          isApproveConfirming ||
                          betAmount < 1
                        }
                      >
                        {isPending || isConfirming
                          ? "Confirming Bet..."
                          : isApprovePending || isApproveConfirming
                          ? "Approving Tokens..."
                          : needsApproval && !isApproveConfirmed
                          ? "Approve Tokens"
                          : "Confirm bet"}
                      </Button>
                      {approveError && (
                        <p className="text-sm text-red-500 text-center mt-2">
                          Approval Error: {approveError.message}
                        </p>
                      )}
                      {error && (
                        <p className="text-sm text-red-500 text-center mt-2">
                          Error: {error.message}
                        </p>
                      )}
                    </DrawerFooter>
                  </>
                ) : (
                  <>
                    {/* Confirmation View */}
                    <div className="flex flex-col items-center justify-center py-8 space-y-6 px-4">
                      {/* Circular Image Placeholder */}
                      <div className="w-40 h-40 rounded-full bg-gray-200 flex items-center justify-center">
                        <div className="w-32 h-32 rounded-full bg-gray-300"></div>
                      </div>

                      {/* Confirmation Text */}
                      <div className="text-center">
                        <h2 className="text-2xl font-bold text-gray-900">
                          I&apos;m rooting for {option.name}!
                        </h2>
                      </div>

                      {/* Action Buttons */}
                      <div className="w-full space-y-3">
                        <Button
                          onClick={handleShare}
                          className="w-full text-white font-semibold py-6 text-lg rounded-lg"
                          style={{ backgroundColor: "#A4D18E" }}
                        >
                          Share
                        </Button>
                        <Button
                          onClick={handleCloseConfirmation}
                          variant="secondary"
                          className="w-full bg-gray-300 hover:bg-gray-400 text-gray-900 font-semibold py-6 text-lg rounded-lg"
                        >
                          Close
                        </Button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </DrawerContent>
          </Drawer>
        </div>
      </section>
    </main>
  );
}
