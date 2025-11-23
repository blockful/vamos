import { onchainTable, relations } from "ponder";
import { MarketStatus } from "./src/constants";

export const markets = onchainTable("markets", (t) => ({
  id: t.text().primaryKey(), // marketId as string
  creator: t.hex().notNull(),
  judge: t.hex().notNull(),
  question: t.text().notNull(),
  numOutcomes: t.integer().notNull(),
  totalPool: t.bigint().notNull().default(0n),
  status: t.text().notNull().default(MarketStatus.OPEN), // "OPEN", "PAUSED", or "RESOLVED"
  winningOutcome: t.integer(), // Nullable until resolved
  createdAt: t.bigint().notNull(), // Block timestamp
  poolAfterFees: t.bigint().notNull().default(0n),
  protocolFeeAmount: t.bigint().notNull().default(0n),
  creatorFeeAmount: t.bigint().notNull().default(0n),
  noWinners: t.boolean().notNull().default(false),
}));

export const marketsRelations = relations(markets, ({ many }) => ({
  outcomes: many(outcomes),
  bets: many(bets),
}));

export const outcomes = onchainTable("outcomes", (t) => ({
  id: t.text().primaryKey(), // Composite: `${marketId}-${outcomeIndex}`
  marketId: t.text().notNull(), // Reference to markets.id
  outcomeIndex: t.integer().notNull(), // Index of the outcome (0, 1, 2, etc.)
  description: t.text().notNull(), // Description of the outcome
  totalAmount: t.bigint().notNull().default(0n), // Total amount bet on this outcome
}));

export const outcomesRelations = relations(outcomes, ({ one, many }) => ({
  market: one(markets, { fields: [outcomes.marketId], references: [markets.id] }),
  bets: many(bets),
}));

export const bets = onchainTable("bets", (t) => ({
  id: t.text().primaryKey(), // Composite: `${marketId}-${user}-${outcomeIndex}`
  marketId: t.text().notNull(), // Reference to markets.id
  outcomeId: t.text().notNull(), // Reference to outcomes.id
  user: t.hex().notNull(),
  outcomeIndex: t.integer().notNull(), // Keep for convenience
  amount: t.bigint().notNull().default(0n), // Cumulative amount bet by this user on this outcome
  lastUpdated: t.bigint().notNull(), // Timestamp of last bet placement
}));

export const betsRelations = relations(bets, ({ one }) => ({
  market: one(markets, { fields: [bets.marketId], references: [markets.id] }),
  outcome: one(outcomes, { fields: [bets.outcomeId], references: [outcomes.id] }),
}));
