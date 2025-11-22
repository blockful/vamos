import { onchainTable } from "ponder";

export const markets = onchainTable("markets", (t) => ({
  id: t.text().primaryKey(), // marketId as string
  creator: t.hex().notNull(),
  judge: t.hex().notNull(),
  question: t.text().notNull(),
  numOutcomes: t.integer().notNull(),
  outcomes: t.text().array().notNull(), // Array of outcome descriptions
  totalPool: t.bigint().notNull().default(0n),
  resolved: t.boolean().notNull().default(false),
  winningOutcome: t.integer(), // Nullable until resolved
  createdAt: t.bigint().notNull(), // Block timestamp
  poolAfterFees: t.bigint().notNull().default(0n),
  protocolFeeAmount: t.bigint().notNull().default(0n),
  creatorFeeAmount: t.bigint().notNull().default(0n),
  noWinners: t.boolean().notNull().default(false),
  paused: t.boolean().notNull().default(false),
}));

export const bets = onchainTable("bets", (t) => ({
  id: t.text().primaryKey(), // Composite: `${marketId}-${user}-${outcomeId}`
  marketId: t.text().notNull(), // Reference to markets.id (no FK constraint)
  user: t.hex().notNull(),
  outcomeId: t.integer().notNull(),
  amount: t.bigint().notNull().default(0n), // Cumulative amount bet by this user on this outcome
  lastUpdated: t.bigint().notNull(), // Timestamp of last bet placement
}));
