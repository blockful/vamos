"use client";
import { useMiniApp } from "@/contexts/miniapp-context";
import { useState } from "react";
import { useFormik } from "formik";
import { useRouter } from "next/navigation";
import { Plus, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useCreateMarket } from "@/hooks/use-vamos-contract";
import { useAccount } from "wagmi";
import { isAddress } from "viem";
import { useMarkets, transformMarketForUI } from "@/hooks/use-markets";

export default function Markets() {
  const { isMiniAppReady } = useMiniApp();
  const { address } = useAccount();
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formError, setFormError] = useState<string>("");

  // Fetch markets from API
  const {
    data: apiMarkets,
    isLoading: isLoadingMarkets,
    error: marketsError,
    refetch,
  } = useMarkets();

  const {
    createMarket,
    isPending,
    isConfirming,
    isConfirmed,
    error: contractError,
    hash,
  } = useCreateMarket();

  // Transform API markets to UI format
  const markets = apiMarkets?.map(transformMarketForUI) || [];

  // Formik form
  const formik = useFormik({
    initialValues: {
      title: "",
      description: "",
      judge: "",
      options: ["", ""], // Array de strings para as opções
    },
    onSubmit: async (values) => {
      try {
        // Clear previous errors
        setFormError("");

        // Determine judge address
        const judgeAddress =
          values.judge ||
          address ||
          "0x0000000000000000000000000000000000000000";

        // Validate if it's a valid address
        if (!isAddress(judgeAddress)) {
          setFormError("Invalid judge address");
          return;
        }

        // Filter empty options
        const validOptions = values.options.filter((opt) => opt.trim() !== "");

        if (validOptions.length < 2) {
          setFormError("You need at least 2 valid options");
          return;
        }

        await createMarket(
          values.title, // question
          judgeAddress, // judge (now a valid Address)
          validOptions // outcomes
        );

        // Refetch markets after creating a new one
        await refetch();

        // Close modal and reset form
        setIsModalOpen(false);
        formik.resetForm();
      } catch (error) {
        console.error("Error creating market:", error);
      }
    },
  });

  // Functions to add/remove options
  const addOption = () => {
    formik.setFieldValue("options", [...formik.values.options, ""]);
  };

  const removeOption = (index: number) => {
    if (formik.values.options.length > 2) {
      const newOptions = formik.values.options.filter((_, i) => i !== index);
      formik.setFieldValue("options", newOptions);
    }
  };

  if (!isMiniAppReady || isLoadingMarkets) {
    return (
      <main className="flex-1">
        <section className="flex items-center justify-center min-h-screen bg-[#111909]">
          <div className="w-full max-w-md mx-auto p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FEABEF] mx-auto mb-4"></div>
            <p className="text-[#FCFDF5]">
              {!isMiniAppReady ? "Loading..." : "Loading markets..."}
            </p>
          </div>
        </section>
      </main>
    );
  }

  // Show error state if markets failed to load
  if (marketsError) {
    return (
      <main className="flex-1 min-h-screen bg-[#111909]">
        <section className="flex items-center justify-center min-h-screen">
          <div className="w-full max-w-md mx-auto p-8 text-center">
            <p className="text-red-400 mb-4">Error loading markets</p>
            <p className="text-[#FCFDF5] text-sm mb-4">
              {marketsError.message}
            </p>
            <Button
              onClick={() => refetch()}
              className="bg-[#FEABEF] hover:bg-[#ff9be0] text-black"
            >
              Try Again
            </Button>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="flex-1 min-h-screen bg-[#111909]">
      {/* Markets List */}
      <section className="px-4 pb-24">
        <div className="max-w-2xl mx-auto space-y-4">
          {markets.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-[#FCFDF5] text-lg mb-2">No markets yet</p>
              <p className="text-gray-400 text-sm">
                Create the first prediction market!
              </p>
            </div>
          ) : (
            markets.map((market) => (
              <div
                key={market.id}
                className={`rounded-2xl p-5 hover:shadow-lg transition-all cursor-pointer active:scale-95 ${
                  market.status === "BETS OPEN" ? "bg-[#FCFDF5]" : "bg-gray-100"
                }`}
                onClick={() => router.push(`/markets/${market.id}`)}
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 text-2xl ${
                      market.status === "BETS OPEN"
                        ? "bg-[#FEABEF]"
                        : "bg-gray-400"
                    }`}
                  >
                    {market.icon}
                  </div>
                  <div
                    className={`text-xs font-semibold px-3 py-1 rounded-full whitespace-nowrap flex items-center gap-2 ${
                      market.status === "BETS OPEN"
                        ? "bg-[#FEABEF] bg-opacity-40 text-[#CC66BA]"
                        : "bg-gray-300 text-gray-600"
                    }`}
                  >
                    {market.status === "BETS OPEN" && (
                      <div
                        className="w-2 h-2 rounded-full bg-[#CC66BA]"
                        style={{
                          animation: "pulse-dot 2s infinite",
                          boxShadow: "0 0 0 0 rgba(204, 102, 186, 0.7)",
                        }}
                      />
                    )}
                    {market.status}
                  </div>
                </div>

                {/* Title and Volume */}
                <div className="mb-4">
                  <h3 className="text-lg font-semibold text-black mb-1">
                    {market.title}
                  </h3>
                  <p className="text-sm text-gray-600">
                    Volume: {market.volume}
                  </p>
                </div>

                {/* Options - Bar Chart Style */}
                <div className="space-y-2">
                  {market.options.map((option, index) => (
                    <div
                      key={index}
                      className="relative h-8 bg-gray-200 rounded-full overflow-hidden"
                    >
                      <div
                        className={`h-full ${
                          option.color
                        } flex items-center px-3 transition-all duration-300 ${
                          market.status === "BETS CLOSED" ? "opacity-70" : ""
                        }`}
                        style={{ width: `${option.percentage}%` }}
                      />
                      <div className="absolute inset-0 flex items-center px-3 justify-between pointer-events-none">
                        <span className="text-sm font-normal text-black">
                          {option.name}
                        </span>
                        <span className="text-sm font-normal text-black">
                          {option.percentage}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      {/* Floating Add Button */}
      <Button
        size="icon"
        className="fixed bottom-8 right-8 w-16 h-16 bg-[#FEABEF] hover:bg-[#ff9be0] text-black rounded-full shadow-2xl transition-all hover:scale-110 z-50"
        onClick={() => setIsModalOpen(true)}
      >
        <Plus className="h-8 w-8" />
      </Button>

      {/* Create Market Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-[#FCFDF5]">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-black">
              Create bet
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={formik.handleSubmit} className="space-y-6 mt-6">
            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title" className="text-sm font-medium text-black">
                Title
              </Label>
              <Input
                id="title"
                name="title"
                placeholder="Enter market title"
                value={formik.values.title}
                onChange={formik.handleChange}
                className="w-full border-gray-300"
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label
                htmlFor="description"
                className="text-sm font-medium text-black"
              >
                Description
              </Label>
              <Textarea
                id="description"
                name="description"
                placeholder="Enter market description"
                value={formik.values.description}
                onChange={formik.handleChange}
                className="w-full min-h-[100px] border-gray-300"
              />
            </div>

            {/* Judge */}
            <div className="space-y-2">
              <Label htmlFor="judge" className="text-sm font-medium text-black">
                Judge
              </Label>
              <Input
                id="judge"
                name="judge"
                placeholder="Enter judge name or address"
                value={formik.values.judge}
                onChange={formik.handleChange}
                className="w-full border-gray-300"
              />
            </div>

            {/* Options - Dynamic */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Options</Label>
                <Button
                  type="button"
                  onClick={addOption}
                  size="sm"
                  variant="outline"
                  className="text-xs"
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Add Option
                </Button>
              </div>

              {formik.values.options.map((option, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Input
                    placeholder={`Option ${String.fromCharCode(65 + index)}`}
                    value={option}
                    onChange={(e) => {
                      const newOptions = [...formik.values.options];
                      newOptions[index] = e.target.value;
                      formik.setFieldValue("options", newOptions);
                    }}
                    className="flex-1"
                  />
                  {formik.values.options.length > 2 && (
                    <Button
                      type="button"
                      onClick={() => removeOption(index)}
                      size="icon"
                      variant="ghost"
                      className="h-10 w-10 text-red-500 hover:text-red-700 hover:bg-red-50"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={isPending || isConfirming}
              className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-6 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isPending
                ? "Awaiting approval..."
                : isConfirming
                ? "Creating market..."
                : "Create"}
            </Button>

            {/* Form validation error */}
            {formError && (
              <p className="text-sm text-red-600 mt-2 bg-red-50 p-3 rounded-md border border-red-200">
                ⚠️ {formError}
              </p>
            )}

            {/* Contract error message */}
            {contractError && (
              <p className="text-sm text-red-600 mt-2 bg-red-50 p-3 rounded-md border border-red-200">
                ⚠️ Error: {contractError.message}
              </p>
            )}

            {/* Success message */}
            {isConfirmed && hash && (
              <p className="text-sm text-green-600 mt-2 bg-green-50 p-3 rounded-md border border-green-200">
                ✓ Market created successfully! TX: {hash.slice(0, 10)}...
              </p>
            )}
          </form>
        </DialogContent>
      </Dialog>
    </main>
  );
}
