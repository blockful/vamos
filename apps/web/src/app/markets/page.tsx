"use client";
import { useMiniApp } from "@/contexts/miniapp-context";
import { useState } from "react";
import { useFormik } from "formik";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
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
        options: [
          { name: values.optionA, percentage: 50 },
          { name: values.optionB, percentage: 50 },
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

            {/* Option A */}
            <div className="space-y-2">
              <Label htmlFor="optionA" className="text-sm font-medium">
                Option A
              </Label>
              <Input
                id="optionA"
                name="optionA"
                placeholder="Enter first option"
                value={formik.values.optionA}
                onChange={formik.handleChange}
                className="w-full"
              />
            </div>

            {/* Option B */}
            <div className="space-y-2">
              <Label htmlFor="optionB" className="text-sm font-medium">
                Option B
              </Label>
              <Input
                id="optionB"
                name="optionB"
                placeholder="Enter second option"
                value={formik.values.optionB}
                onChange={formik.handleChange}
                className="w-full"
              />
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-6 text-lg"
            >
              Create
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </main>
  );
}
