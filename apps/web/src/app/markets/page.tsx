"use client";
import { useMiniApp } from "@/contexts/miniapp-context";
import { useState } from "react";
import Image from "next/image";

// Mock data for markets
const MOCK_MARKETS = [
  {
    id: 1,
    title: "Match: Alex x Jason",
    options: [
      { name: "Alex", percentage: 65 },
      { name: "Jason", percentage: 35 },
    ],
  },
  {
    id: 2,
    title: "Match: Maria x Sofia",
    options: [
      { name: "Maria", percentage: 48 },
      { name: "Sofia", percentage: 52 },
    ],
  },
  {
    id: 3,
    title: "Match: Bruno x Lucas",
    options: [
      { name: "Bruno", percentage: 70 },
      { name: "Lucas", percentage: 30 },
    ],
  },
];

export default function Markets() {
  const { context, isMiniAppReady } = useMiniApp();
  const [markets] = useState(MOCK_MARKETS);

  // Extract user data from context
  const user = context?.user;
  const displayName = user?.displayName || user?.username || "User";
  const pfpUrl = user?.pfpUrl;

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
      <button
        className="fixed bottom-8 right-8 w-16 h-16 bg-green-500 hover:bg-green-600 text-white rounded-full shadow-2xl flex items-center justify-center transition-all hover:scale-110 z-50"
        onClick={() => {
          // TODO: Implement add new market functionality
          console.log("Add new market");
        }}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-8 w-8"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 4v16m8-8H4"
          />
        </svg>
      </button>
    </main>
  );
}
