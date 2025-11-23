"use client";
import { useMiniApp } from "@/contexts/miniapp-context";
import { useState } from "react";
import { useFormik } from "formik";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import Image from "next/image";
import { useAccount } from "wagmi";
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

// Mock data for markets
const MOCK_MARKETS = [
  {
    id: 1,
    title: "Tennis Match: Alex vs Jason",
    status: "BETS OPEN",
    volume: "$100.00",
    icon: "🎾",
    options: [
      { name: "Alex", percentage: 80, color: "bg-[#A4D18E]" },
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
      { name: "Alex", percentage: 80, color: "bg-[#A4D18E]" },
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

  // Extract user data from context
  const user = context?.user;
  const pfpUrl = user?.pfpUrl;

  // Formik form
  const formik = useFormik({
    initialValues: {
      title: "",
      description: "",
      judge: "",
      optionA: "",
      optionB: "",
    },
    onSubmit: (values) => {
      // Add new market to the list
      const newMarket = {
        id: markets.length + 1,
        title: values.title,
        status: "BETS OPEN",
        volume: "$0.00",
        icon: "📊",
        options: [
          { name: values.optionA, percentage: 50, color: "bg-[#A4D18E]" },
          { name: values.optionB, percentage: 50, color: "bg-yellow-200" },
        ],
      };
      setMarkets([...markets, newMarket]);
      setIsModalOpen(false);
      formik.resetForm();
    },
  });

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
      <section className="px-2 pb-2">
        <div className="max-w-2xl mx-auto space-y-2">
          {markets.map((market) => (
            <div
              key={market.id}
              className={`rounded-2xl p-5 hover:shadow-lg transition-all cursor-pointer active:scale-95 ${
                market.status === "BETS OPEN"
                  ? "bg-[#FCFDF5]"
                  : "bg-gray-100"
              }`}
              onClick={() => router.push(`/markets/${market.id}`)}
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 text-2xl ${
                  market.status === "BETS OPEN"
                    ? "bg-[#FEABEF]"
                    : "bg-gray-400"
                }`}>
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
                        boxShadow: "0 0 0 0 rgba(204, 102, 186, 0.7)"
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
                <p className="text-sm text-gray-600">Volume: {market.volume}</p>
              </div>

              {/* Options - Bar Chart Style */}
              <div className="space-y-2">
                {market.options.map((option, index) => (
                  <div key={index} className="relative h-8 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${option.color} flex items-center px-3 transition-all duration-300 ${
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

            {/* Option A */}
            <div className="space-y-2">
              <Label htmlFor="optionA" className="text-sm font-medium text-black">
                Option A
              </Label>
              <Input
                id="optionA"
                name="optionA"
                placeholder="Enter first option"
                value={formik.values.optionA}
                onChange={formik.handleChange}
                className="w-full border-gray-300"
              />
            </div>

            {/* Option B */}
            <div className="space-y-2">
              <Label htmlFor="optionB" className="text-sm font-medium text-black">
                Option B
              </Label>
              <Input
                id="optionB"
                name="optionB"
                placeholder="Enter second option"
                value={formik.values.optionB}
                onChange={formik.handleChange}
                className="w-full border-gray-300"
              />
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full bg-[#FEABEF] hover:bg-[#ff9be0] text-black font-semibold py-6 text-lg"
            >
              Create
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </main>
  );
}
