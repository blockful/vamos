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
    title: "Alex x Jason",
    options: [
      { name: "Alex", percentage: 65 },
      { name: "Jason", percentage: 35 },
    ],
  },
  {
    id: 2,
    title: "Maria x Sofia",
    options: [
      { name: "Maria", percentage: 48 },
      { name: "Sofia", percentage: 52 },
    ],
  },
  {
    id: 3,
    title: "Bruno x Lucas",
    options: [
      { name: "Bruno", percentage: 70 },
      { name: "Lucas", percentage: 30 },
    ],
  },
];

export default function Markets() {
  const { isMiniAppReady } = useMiniApp();
  const router = useRouter();
  const [markets, setMarkets] = useState(MOCK_MARKETS);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { address } = useAccount();

  const {
    createMarket,
    isPending,
    isConfirming,
    isConfirmed,
    error: contractError,
    hash,
  } = useCreateMarket();

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
        // Determine judge address
        let judgeAddress =
          values.judge ||
          address ||
          "0x0000000000000000000000000000000000000000";

        // Validate if it's a valid address
        if (!isAddress(judgeAddress)) {
          alert("Invalid judge address");
          return;
        }

        // Filter empty options
        const validOptions = values.options.filter((opt) => opt.trim() !== "");

        if (validOptions.length < 2) {
          alert("You need at least 2 valid options");
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
        const newMarket = {
          id: markets.length + 1,
          title: values.title,
          options: validOptions.map((name, index) => ({
            name,
            percentage:
              index === 0
                ? 100 - equalPercentage * (validOptions.length - 1)
                : equalPercentage,
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
        <section className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
          <div className="w-full max-w-md mx-auto p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading...</p>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="flex-1 min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Markets List */}
      <section className="max-w-4xl mx-auto px-4 py-8">
        <h2 className="text-xl font-bold text-gray-900 mb-6">Ongoing Bets</h2>

        <div className="space-y-4">
          {markets.map((market) => (
            <div
              key={market.id}
              className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => router.push(`/markets/${market.id}`)}
            >
              <div className="flex items-center gap-4">
                {/* Market Icon */}
                <div className="w-12 h-12 rounded-full bg-gray-300 flex-shrink-0"></div>

                {/* Market Info */}
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">
                    {market.title}
                  </h3>

                  {/* Percentage Bar */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden flex">
                        {market.options.map((option, index) => (
                          <div
                            key={index}
                            className={`h-full ${
                              index === 0 ? "bg-green-500" : "bg-red-500"
                            }`}
                            style={{ width: `${option.percentage}%` }}
                          ></div>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-xs text-gray-600">
                      {market.options.map((option, index) => (
                        <span key={index}>
                          {option.name}: {option.percentage}%
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Floating Add Button */}
      <Button
        size="icon"
        className="fixed bottom-8 right-8 w-16 h-16 bg-green-500 hover:bg-green-600 text-white rounded-full shadow-2xl transition-all hover:scale-110 z-50"
        onClick={() => setIsModalOpen(true)}
      >
        <Plus className="h-8 w-8" />
      </Button>

      {/* Create Market Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">Create bet</DialogTitle>
          </DialogHeader>

          <form onSubmit={formik.handleSubmit} className="space-y-6 mt-6">
            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title" className="text-sm font-medium">
                Title
              </Label>
              <Input
                id="title"
                name="title"
                placeholder="Enter market title"
                value={formik.values.title}
                onChange={formik.handleChange}
                className="w-full"
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description" className="text-sm font-medium">
                Description
              </Label>
              <Textarea
                id="description"
                name="description"
                placeholder="Enter market description"
                value={formik.values.description}
                onChange={formik.handleChange}
                className="w-full min-h-[100px]"
              />
            </div>

            {/* Judge */}
            <div className="space-y-2">
              <Label htmlFor="judge" className="text-sm font-medium">
                Judge
              </Label>
              <Input
                id="judge"
                name="judge"
                placeholder="Enter judge name or address"
                value={formik.values.judge}
                onChange={formik.handleChange}
                className="w-full"
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

            {/* Error message */}
            {contractError && (
              <p className="text-sm text-red-600 mt-2">
                Error: {contractError.message}
              </p>
            )}

            {/* Success message */}
            {isConfirmed && hash && (
              <p className="text-sm text-green-600 mt-2">
                ✓ Market created successfully! TX: {hash.slice(0, 10)}...
              </p>
            )}
          </form>
        </DialogContent>
      </Dialog>
    </main>
  );
}
