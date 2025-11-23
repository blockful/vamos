"use client";
import { useMiniApp } from "@/contexts/miniapp-context";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import {
  Share2,
  ChevronRight,
  ChevronLeft,
  PartyPopperIcon,
  DollarSign,
  Crown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { useAccount, useSwitchChain } from "wagmi";
import { useToast } from "@/hooks/use-toast";
import { useOutcome } from "@/hooks/use-markets";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";

import {
  useMarket,
  transformMarketForDetailsUI,
  getColorForOption,
} from "@/hooks/use-markets";
import { formatCurrency } from "@/lib/utils";
import { useEnsName, formatAddressOrEns } from "@/hooks/use-ens";
import { usePauseMarket, useResolveMarket } from "@/hooks/use-vamos-contract";
import { formatTimeAgo } from "@/app/helpers/formatTimeAgo";
import { useTokenDecimals } from "@/hooks/use-token-decimals";

export default function MarketDetails() {
  const { isMiniAppReady } = useMiniApp();
  const params = useParams();
  const router = useRouter();
  const [isExiting, setIsExiting] = useState(false);
  const [isPauseModalOpen, setIsPauseModalOpen] = useState(false);
  const [isResolveModalOpen, setIsResolveModalOpen] = useState(false);
  const [selectedWinner, setSelectedWinner] = useState<number | null>(null);

  // Extract chainId and marketId from separate params
  const chainId = parseInt(params.chainId as string);
  const marketId = parseInt(params.marketId as string);
  
  // Composite ID for API calls (format: "chainId-marketId")
  const compositeMarketId = `${chainId}-${marketId}`;

  const { address, chain } = useAccount();
  const { switchChain } = useSwitchChain();
  const { toast } = useToast();

  // Switch to the correct network if needed
  useEffect(() => {
    if (address && chain?.id !== chainId && switchChain) {
      switchChain({ chainId });
    }
  }, [address, chain?.id, chainId, switchChain]);

  // Fetch market data from API
  const {
    data: apiMarket,
    isLoading,
    error,
    refetch,
  } = useMarket(marketId.toString(), chainId, address);

  // Pause market hook
  const {
    pauseMarket,
    isPending: isPausePending,
    isConfirming: isPauseConfirming,
    isConfirmed: isPauseConfirmed,
    error: pauseError,
  } = usePauseMarket();

  // Resolve market hook
  const {
    resolveMarket,
    isPending: isResolvePending,
    isConfirming: isResolveConfirming,
    isConfirmed: isResolveConfirmed,
    error: resolveError,
  } = useResolveMarket();

  // Get token decimals for the current chain
  const { decimals } = useTokenDecimals(chain?.id);

  const market = apiMarket
    ? transformMarketForDetailsUI(apiMarket, decimals ?? 18)
    : null;

  // Color palette for multiple options
  const getOptionColor = (index: number) => {
    const colors = [
      "#A4D18E", // green
      "#fbbf24", // yellow
      "#FEABEF", // pink
      "#A78BFA", // purple
      "#60A5FA", // blue
      "#F87171", // red
    ];
    return colors[index % colors.length];
  };

  // Get ENS name for judge if market judge is an address
  const judgeAddress =
    market?.judge && market.judge.startsWith("0x") ? market.judge : undefined;
  const { data: judgeEnsName } = useEnsName(judgeAddress);

  // Get ENS name for creator if available
  const creatorAddress =
    apiMarket?.creator && apiMarket.creator.startsWith("0x")
      ? apiMarket.creator
      : undefined;
  const { data: creatorEnsName } = useEnsName(creatorAddress);

  const handleBack = () => {
    setIsExiting(true);
    setTimeout(() => {
      router.back();
    }, 300);
  };

  const handlePauseMarket = async () => {
    try {
      await pauseMarket(BigInt(marketId));
    } catch (err) {
      console.error("Error pausing market:", err);
    }
  };

  const handleResolveMarket = async () => {
    if (selectedWinner === null) return;

    try {
      await resolveMarket(BigInt(marketId), BigInt(selectedWinner));
    } catch (err) {
      console.error("Error resolving market:", err);
    }
  };

  // Helper function to extract first sentence from error message
  const getFirstSentence = (message: string) => {
    const match = message.match(/^[^.!?]+[.!?]/);
    return match ? match[0] : message;
  };

  // Show error toast for pause
  useEffect(() => {
    if (pauseError) {
      toast({
        variant: "destructive",
        title: "Error",
        description: getFirstSentence(pauseError.message),
      });
    }
  }, [pauseError, toast]);

  // Show success toast and refetch data for pause
  useEffect(() => {
    if (isPauseConfirmed) {
      toast({
        title: "Betting Closed Successfully! 🎉",
        description: "The betting period has been closed.",
      });
      setIsPauseModalOpen(false);
      setTimeout(() => {
        refetch();
      }, 2000);
    }
  }, [isPauseConfirmed, toast, refetch]);

  // Show error toast for resolve
  useEffect(() => {
    if (resolveError) {
      toast({
        variant: "destructive",
        title: "Error",
        description: getFirstSentence(resolveError.message),
      });
    }
  }, [resolveError, toast]);

  // Show success toast and refetch data for resolve
  useEffect(() => {
    if (isResolveConfirmed) {
      toast({
        title: "Market Resolved Successfully! 🏆",
        description: "The winning outcome has been confirmed.",
      });
      setIsResolveModalOpen(false);
      setSelectedWinner(null);
      setTimeout(() => {
        refetch();
      }, 2000);
    }
  }, [isResolveConfirmed, toast, refetch]);

  // Check if current user is the judge
  const isJudge =
    address &&
    market?.judge &&
    address.toLowerCase() === market.judge.toLowerCase();

  if (!isMiniAppReady || isLoading) {
    return (
      <main className="flex-1">
        <section className="flex items-center justify-center min-h-screen bg-[#111909]">
          <div className="w-full max-w-md mx-auto p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FEABEF] mx-auto mb-4"></div>
            <p className="text-[#FCFDF5]">
              {!isMiniAppReady ? "Loading..." : "Loading market..."}
            </p>
          </div>
        </section>
      </main>
    );
  }

  if (error) {
    return (
      <main className="flex-1 min-h-screen bg-[#111909]">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="text-center">
            <p className="text-red-400 mb-4">Error loading market</p>
            <p className="text-[#FCFDF5] mb-4">{error.message}</p>
            <Button onClick={() => router.back()}>Go Back</Button>
          </div>
        </div>
      </main>
    );
  }

  if (!market) {
    return (
      <main className="flex-1 min-h-screen bg-[#111909]">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <p className="text-center text-[#FCFDF5]">Market not found</p>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 min-h-screen bg-[#111909]">
      <section
        className="pb-2 space-y-2"
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
                market.status === "OPEN"
                  ? "bg-[#FEABEF] bg-opacity-40 text-[#CC66BA]"
                  : market.status === "PAUSED"
                  ? "bg-[#E3DAA2] bg-opacity-50 text-[#9A925C]"
                  : "bg-gray-300 text-gray-600"
              }`}
            >
              {market.status === "OPEN" && (
                <div
                  className="w-2 h-2 rounded-full bg-[#CC66BA]"
                  style={{
                    animation: "pulse-dot 2s infinite",
                    boxShadow: "0 0 0 0 rgba(204, 102, 186, 0.7)",
                  }}
                />
              )}
              {market.status === "OPEN"
                ? "BETS OPEN"
                : market.status === "PAUSED"
                ? "BETS LOCKED"
                : "FINISHED"}
            </span>
          </div>

          {/* Title and Description */}
          <div>
            <h1 className="text-2xl font-semibold text-black mb-2">
              {market.title.replace("Match: ", "Tennis Match: ")}
            </h1>
          </div>

          {/* Volume */}
          <div>
            <p className="text-sm text-black">
              Volume: ${formatCurrency(market.totalVolume)}
            </p>
          </div>

          {/* Market metadata */}
          <div>
            <div className="flex flex-wrap gap-2 text-xs text-gray-600">
              {apiMarket?.createdAt && (
                <span className="flex items-center">
                  ⏱️ {formatTimeAgo(apiMarket.createdAt)}
                </span>
              )}
              {creatorAddress && (
                <span className="flex items-center">
                  👤 Creator:{" "}
                  {formatAddressOrEns(creatorAddress, creatorEnsName, true)}
                </span>
              )}
              {judgeAddress && (
                <span className="flex items-center">
                  ⚖️ Judge:{" "}
                  {formatAddressOrEns(judgeAddress, judgeEnsName, true)}
                </span>
              )}
            </div>
          </div>

          {/* Winner Display Container */}
          <div className="space-y-2">
            {/* Winner Display - Only show if market is RESOLVED */}
            {market.status === "RESOLVED" &&
              market.winningOutcome !== undefined && (
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold text-black">
                    <PartyPopperIcon />
                  </span>
                  <span className="text-sm text-black flex items-center gap-2">
                    Winner:{" "}
                    <span className="inline-flex items-center bg-[#A4D18E] text-black font-semibold px-2 py-1 rounded-full text-sm">
                      {market.options.find(
                        (opt) => opt.outcomeIndex === market.winningOutcome
                      )?.name || "Unknown"}
                    </span>
                  </span>
                </div>
              )}
          </div>

          {/* Action Buttons */}
          {isJudge && market.status === "OPEN" && (
            <Button
              onClick={() => setIsPauseModalOpen(true)}
              disabled={isPausePending || isPauseConfirming}
              className="w-full bg-[#FEABEF] hover:bg-[#CC66BA] text-black font-medium rounded-full border-2 border-[#111909]"
              style={{ boxShadow: "2px 2px 0px #111909" }}
            >
              {isPausePending || isPauseConfirming ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-black" />
                  {isPausePending ? "Closing..." : "Confirming..."}
                </>
              ) : (
                "Close Betting"
              )}
            </Button>
          )}
          {isJudge && market.status === "PAUSED" && (
            <Button
              onClick={() => setIsResolveModalOpen(true)}
              disabled={isResolvePending || isResolveConfirming}
              className="w-full bg-[#FEABEF] hover:bg-[#CC66BA] text-black font-medium rounded-full border-2 border-[#111909]"
              style={{ boxShadow: "2px 2px 0px #111909" }}
            >
              {isResolvePending || isResolveConfirming ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-black" />
                  {isResolvePending ? "Resolving..." : "Confirming..."}
                </>
              ) : (
                "Confirm Result"
              )}
            </Button>
          )}
          <Button
            onClick={() => {
              const url = window.location.href;
              navigator.clipboard.writeText(url).then(() => {
                toast({
                  title: "Link Copied! 🔗",
                  description: "Market link copied to clipboard",
                });
              });
            }}
            className="gap-2 bg-gray-200 hover:bg-gray-300 w-full text-black font-medium rounded-full border-2 border-[#111909]"
            style={{ boxShadow: "2px 2px 0px #111909" }}
          >
            <Share2 className="h-4 w-4" />
            Share
          </Button>
          
          {/* Connect wallet message for non-connected users */}
          {!address && market.status === "OPEN" && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-2">
              <p className="text-sm text-gray-800">
                💡 Connect your wallet to place bets on this market
              </p>
            </div>
          )}
        </div>

        {/* Betting Options */}
        <div className="space-y-2">
          {market.options.map((option, index) => {
            // Use the actual data from the option object
            const percentage = option.percentage || 0;
            const totalAmount = option.totalAmount || 0;
            const userBet = option.userBet || 0;

            const isWinner =
              market.status === "RESOLVED" &&
              market.winningOutcome !== undefined &&
              option.outcomeIndex === market.winningOutcome;

            return (
              <button
                key={index}
                disabled={market.status !== "OPEN" || !address}
                onClick={() =>
                  router.push(`/markets/${chainId}/${marketId}/${index}`)
                }
                className={`w-full rounded-2xl overflow-hidden relative h-auto transition-all hover:shadow-lg active:scale-95 bg-white ${market.status !== "OPEN" || !address ? "cursor-not-allowed opacity-75" : ""}`}
              >
                {/* Colored background bar based on percentage */}
                <div
                  className="absolute inset-y-0 left-0 transition-all duration-300"
                  style={{
                    width: `${percentage}%`,
                    background: getColorForOption(option.name),
                  }}
                />

                {/* Content */}
                <div className="relative flex items-center justify-between h-full p-4">
                  <div className="flex-1 flex flex-col">
                    <div className="flex items-center gap-2">
                      <p className="text-lg text-left font-semibold text-black mb-2">
                        {option.name}
                      </p>
                      {isWinner && <span className="text-base -mt-2">🏆</span>}
                    </div>
                    <div className="flex gap-8">
                      <div>
                        <p className="text-xs text-black opacity-70">Total</p>
                        <p className="text-sm font-semibold text-black">
                          ${totalAmount}
                        </p>
                      </div>
                      {address && (
                        <div>
                          <p className="text-xs text-black opacity-70">
                            Your bet
                          </p>
                          <p className="text-sm font-semibold text-black">
                            ${formatCurrency(userBet)}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Winner Capi Image or Chevron button */}
                  {isWinner ? (
                    <div
                      className="flex items-center justify-center flex-shrink-0 ml-4 absolute right-4"
                      style={{
                        animation: "crown-pulse 1s ease infinite",
                      }}
                    >
                      <Image
                        src="/capi-victory.svg"
                        alt="Victory"
                        width={100}
                        height={100}
                        className="w-36 h-36"
                      />
                    </div>
                  ) : (
                    market.status === "OPEN" && (
                      <div className="flex items-center justify-center w-10 h-10 rounded-full border-2 border-black flex-shrink-0 ml-4">
                        <ChevronRight className="h-5 w-5 text-black" />
                      </div>
                    )
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* Pause Market Confirmation Modal */}
      <Drawer open={isPauseModalOpen} onOpenChange={setIsPauseModalOpen}>
        <DrawerContent className="bg-[#FCFDF5]">
          <div className="mx-auto w-full max-w-sm">
            <DrawerHeader>
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 rounded-full bg-[#FEABEF] flex items-center justify-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                    stroke="currentColor"
                    className="w-8 h-8"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M15.75 5.25v13.5m-7.5-13.5v13.5"
                    />
                  </svg>
                </div>
              </div>
              <DrawerTitle className="text-center text-black text-xl">
                Once you close this betting period, it can&apos;t be reopened.
                Are you sure you want to continue?
              </DrawerTitle>
              <DrawerDescription className="text-center text-gray-600">
                {isPausePending && "Waiting for confirmation in your wallet..."}
                {isPauseConfirming && "Closing betting period..."}
              </DrawerDescription>
            </DrawerHeader>
            <DrawerFooter>
              <Button
                onClick={handlePauseMarket}
                disabled={isPausePending || isPauseConfirming}
                className="bg-[#FEABEF] hover:bg-[#CC66BA] text-black font-medium rounded-full border-2 border-[#111909]"
                style={{ boxShadow: "2px 2px 0px #111909" }}
              >
                {isPausePending || isPauseConfirming ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-black" />
                    {isPausePending ? "Closing..." : "Confirming..."}
                  </div>
                ) : (
                  "Confirm & continue"
                )}
              </Button>
              <DrawerClose asChild>
                <Button
                  variant="outline"
                  className="bg-gray-200 hover:bg-gray-300 text-black font-medium rounded-full border-2 border-[#111909]"
                  style={{ boxShadow: "2px 2px 0px #111909" }}
                  disabled={isPausePending || isPauseConfirming}
                >
                  Cancel
                </Button>
              </DrawerClose>
            </DrawerFooter>
          </div>
        </DrawerContent>
      </Drawer>

      {/* Resolve Market Modal */}
      <Drawer open={isResolveModalOpen} onOpenChange={setIsResolveModalOpen}>
        <DrawerContent className="bg-[#FCFDF5]">
          <div className="mx-auto w-full max-w-sm">
            <DrawerHeader>
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 rounded-full bg-[#FEABEF] flex items-center justify-center">
                  🏆
                </div>
              </div>
              <DrawerTitle className="text-center text-black text-xl">
                Select the option that won the competition
              </DrawerTitle>
              <DrawerDescription className="text-center text-gray-600">
                {isResolvePending &&
                  "Waiting for confirmation in your wallet..."}
                {isResolveConfirming && "Resolving market..."}
              </DrawerDescription>
            </DrawerHeader>
            <DrawerFooter className="space-y-2">
              {market?.options.map((option, index) => (
                <Button
                  key={index}
                  onClick={() => setSelectedWinner(index)}
                  disabled={isResolvePending || isResolveConfirming}
                  style={{
                    boxShadow: "2px 2px 0px #111909",
                    backgroundColor:
                      selectedWinner === index
                        ? getColorForOption(option.name)
                        : `${getColorForOption(option.name)}80`, // 80 = 50% opacity in hex
                  }}
                  className={`w-full text-black font-medium rounded-full hover:opacity-80 transition-opacity ${
                    selectedWinner === index ? "border-2 border-black" : ""
                  } disabled:opacity-50`}
                >
                  {option.name}
                </Button>
              ))}
              <Button
                onClick={handleResolveMarket}
                disabled={
                  selectedWinner === null ||
                  isResolvePending ||
                  isResolveConfirming
                }
                className="w-full bg-[#FEABEF] hover:bg-[#CC66BA] text-black font-medium rounded-full border-2 border-[#111909]"
                style={{ boxShadow: "2px 2px 0px #111909" }}
              >
                {isResolvePending || isResolveConfirming ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-black" />
                    {isResolvePending ? "Resolving..." : "Confirming..."}
                  </div>
                ) : (
                  "Confirm Result"
                )}
              </Button>
              <DrawerClose asChild>
                <Button
                  variant="outline"
                  className="w-full bg-gray-200 hover:bg-gray-300 text-black font-semibold py-6 rounded-2xl"
                  disabled={isResolvePending || isResolveConfirming}
                  onClick={() => setSelectedWinner(null)}
                >
                  Cancel
                </Button>
              </DrawerClose>
            </DrawerFooter>
          </div>
        </DrawerContent>
      </Drawer>

      {/* Animations */}
      <style jsx>{`
        @keyframes crown-pulse {
          0% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.1);
          }
          100% {
            transform: scale(1);
          }
        }
      `}</style>
    </main>
  );
}

