import { onchainTable, relations } from "ponder";
import { MarketStatus } from "./src/constants";

export const markets = onchainTable("markets", (t) => ({
  id: t.text().primaryKey(), // Composite: `${chainId}-${marketId}`
  marketId: t.text().notNull(), // Original marketId from contract
  chainId: t.integer().notNull(), // Chain ID (8453 for Base)
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
  id: t.text().primaryKey(), // Composite: `${chainId}-${marketId}-${outcomeIndex}`
  marketId: t.text().notNull(), // Reference to markets.id
  chainId: t.integer().notNull(), // Chain ID
  outcomeIndex: t.integer().notNull(), // Index of the outcome (0, 1, 2, etc.)
  description: t.text().notNull(), // Description of the outcome
  totalAmount: t.bigint().notNull().default(0n), // Total amount bet on this outcome
}));

export const outcomesRelations = relations(outcomes, ({ one, many }) => ({
  market: one(markets, { fields: [outcomes.marketId], references: [markets.id] }),
  bets: many(bets),
}));

export const bets = onchainTable("bets", (t) => ({
  id: t.text().primaryKey(), // Composite: `${chainId}-${marketId}-${user}-${outcomeIndex}`
  marketId: t.text().notNull(), // Reference to markets.id
  outcomeId: t.text().notNull(), // Reference to outcomes.id
  chainId: t.integer().notNull(), // Chain ID
  user: t.hex().notNull(),
  outcomeIndex: t.integer().notNull(), // Keep for convenience
  amount: t.bigint().notNull().default(0n), // Cumulative amount bet by this user on this outcome
  lastUpdated: t.bigint().notNull(), // Timestamp of last bet placement
}));

export const betsRelations = relations(bets, ({ one }) => ({
  market: one(markets, { fields: [bets.marketId], references: [markets.id] }),
  outcome: one(outcomes, { fields: [bets.outcomeId], references: [outcomes.id] }),
}));

export const outcomeHistory = onchainTable("outcomes", (t) => ({
  id: t.text().primaryKey(), // Composite: `${chainId}-${marketId}-${outcomeIndex}-${txHash}-${eventIndex}`
  marketId: t.text().notNull(), // Reference to markets.id
  chainId: t.integer().notNull(), // Chain ID
  outcomeIndex: t.integer().notNull(), // Index of the outcome (0, 1, 2, etc.)
  bettedAmount: t.integer().notNull(), // Total amount betted on this outcome
  winningProbability: t.integer().notNull(), // Probability of this option to win

}));

/** Todo
 * 
 * [Indexer]
 * outcome history to track change on outcomes percentage
 * 
 * [SC]
 * admin should also be able to resolve market
 * define optional deadline for market
 * admin and judge can revert bet, in case of manipulation
 * 
 * [FE] 
 * enable see outcome betters when market paused/closed
 * Winner color to be the color of the option. Also better to call it "Result"
 * 
 */
// TODO
// 