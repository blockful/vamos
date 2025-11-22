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

// Mock data for markets
const MOCK_MARKETS = [
  {
    id: 1,
    title: "Tennis Match: Alex vs Jason",
    status: "BETS OPEN",
    volume: "$100.00",
    icon: "🎾",
    options: [
      { name: "Alex", percentage: 80, color: "bg-green-400" },
      { name: "Jason", percentage: 20, color: "bg-yellow-200" },
    ],
  },
  {
    id: 2,
    title: "Tennis Match: Alex vs Jason",
    status: "BETS OPEN",
    volume: "$100.00",
    icon: "🎾",
    options: [
      { name: "Alex", percentage: 80, color: "bg-green-400" },
      { name: "Jason", percentage: 20, color: "bg-yellow-200" },
    ],
  },
  {
    id: 3,
    title: "Volleyball Match: Isa vs Dani",
    status: "BETS CLOSED",
    volume: "$200.00",
    icon: "🏐",
    options: [
      { name: "Isa", percentage: 60, color: "bg-pink-300" },
      { name: "Dani", percentage: 40, color: "bg-purple-300" },
    ],
  },
];

export default function Markets() {
  const { isMiniAppReady, context } = useMiniApp();
  const { address, isConnected } = useAccount();
  const router = useRouter();
  const [markets, setMarkets] = useState(MOCK_MARKETS);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formError, setFormError] = useState<string>("");

  const {
    createMarket,
    isPending,
    isConfirming,
    isConfirmed,
    error: contractError,
    hash,
  } = useCreateMarket();

  // Extract user data from context
  const user = context?.user;
  const pfpUrl = user?.pfpUrl;

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
        let judgeAddress =
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

        console.log("Market creation transaction submitted!");
        console.log("Transaction hash:", hash);

        // Calculate equal percentage for all options
        const equalPercentage = Math.floor(100 / validOptions.length);
        const colors = [
          "bg-green-400",
          "bg-yellow-200",
          "bg-pink-300",
          "bg-purple-300",
          "bg-blue-300",
          "bg-red-300",
        ];
        const newMarket = {
          id: markets.length + 1,
          title: values.title,
          status: "BETS OPEN",
          volume: "$0.00",
          icon: "🎯",
          options: validOptions.map((name, index) => ({
            name,
            percentage:
              index === 0
                ? 100 - equalPercentage * (validOptions.length - 1)
                : equalPercentage,
            color: colors[index % colors.length],
          })),
        };
        setMarkets([...markets, newMarket]);

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

  if (!isMiniAppReady) {
    return (
      <main className="flex-1">
        <section className="flex items-center justify-center min-h-screen bg-[#111909]">
          <div className="w-full max-w-md mx-auto p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FEABEF] mx-auto mb-4"></div>
            <p className="text-[#FCFDF5]">Loading...</p>
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
          {markets.map((market) => (
            <div
              key={market.id}
              className={`rounded-2xl p-5 hover:shadow-lg transition-shadow cursor-pointer ${
                market.status === "BETS OPEN" ? "bg-[#FCFDF5]" : "bg-gray-100"
              }`}
              onClick={() => router.push(`/markets/${market.id}`)}
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-full bg-[#FEABEF] flex items-center justify-center flex-shrink-0 text-2xl">
                  {market.icon}
                </div>
                <span
                  className={`text-xs font-semibold px-3 py-1 rounded-full whitespace-nowrap ${
                    market.status === "BETS OPEN"
                      ? "bg-[#FEABEF] text-black"
                      : "bg-gray-300 text-gray-600"
                  }`}
                >
                  {market.status}
                </span>
              </div>

              {/* Title and Volume */}
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-black mb-1">
                  {market.title}
                </h3>
                <p className="text-sm text-gray-600">Volume: {market.volume}</p>
              </div>

              {/* Options - Bar Chart Style */}
              <div className="space-y-2">
                {market.options.map((option, index) => (
                  <div
                    key={index}
                    className="relative h-8 bg-gray-200 rounded-full overflow-hidden"
                  >
                    <div
                      className={`h-full ${option.color} flex items-center px-3 transition-all duration-300`}
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
          ))}
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
