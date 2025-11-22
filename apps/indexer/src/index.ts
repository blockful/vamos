import { ponder } from "ponder:registry";
import { VamosAbi } from "../abis/VamosAbi";
import { markets, outcomes, bets } from "ponder:schema";
import { MarketStatus } from "./constants";

// Helper function to handle MarketCreated for all contracts
const handleMarketCreated = async ({ event, context }: any) => {
  const { db } = context;
  
  const marketId = event.args.marketId.toString();
  
  // Insert the market
  await db.insert(markets).values({
    id: marketId,
    creator: event.args.creator,
    judge: event.args.judge,
    question: event.args.question,
    numOutcomes: event.args.outcomes.length,
    totalPool: 0n,
    status: MarketStatus.OPEN,
    winningOutcome: null,
    createdAt: event.block.timestamp,
    poolAfterFees: 0n,
    protocolFeeAmount: 0n,
    creatorFeeAmount: 0n,
    noWinners: false,
  });
  
  // Insert each outcome
  const outcomeDescriptions: string[] = event.args.outcomes;
  for (let i = 0; i < outcomeDescriptions.length; i++) {
    await db.insert(outcomes).values({
      id: `${marketId}-${i}`,
      marketId: marketId,
      outcomeIndex: i,
      description: outcomeDescriptions[i],
      totalAmount: 0n,
    });
  }
};

// Helper function to handle PredictionPlaced for all contracts
const handlePredictionPlaced = async ({ event, context }: any) => {
  const { db } = context;
  
  const marketId = event.args.marketId.toString();
  const user = event.args.user;
  const outcomeIndex = Number(event.args.outcomeId);
  const amount = event.args.amount;
  
  const outcomeId = `${marketId}-${outcomeIndex}`;
  const betId = `${marketId}-${user}-${outcomeIndex}`;
  
  // Upsert bet: insert if new, or update by adding to amount if exists
  await db
    .insert(bets)
    .values({
      id: betId,
      marketId,
      outcomeId,
      user,
      outcomeIndex,
      amount,
      lastUpdated: event.block.timestamp,
    })
    .onConflictDoUpdate((row: typeof bets.$inferSelect) => ({
      amount: row.amount + amount,
      lastUpdated: event.block.timestamp,
    }));
  
  // Update market totalPool by adding the new amount
  await db
    .update(markets, { id: marketId })
    .set((row: typeof markets.$inferSelect) => ({
      totalPool: row.totalPool + amount,
    }));
  
  // Update outcome totalAmount by adding the new amount
  await db
    .update(outcomes, { id: outcomeId })
    .set((row: typeof outcomes.$inferSelect) => ({
      totalAmount: row.totalAmount + amount,
    }));
};

// Helper function to handle MarketResolved for all contracts
const handleMarketResolved = async ({ event, context }: any) => {
  const { db, client } = context;
  
  const marketId = event.args.marketId.toString();
  const winningOutcome = Number(event.args.winningOutcome);
  
  // Fetch market data from contract to get poolAfterFees and other resolution details
  const marketData = await client.readContract({
    address: event.log.address,
    abi: VamosAbi,
    functionName: "getMarket",
    args: [event.args.marketId],
  });
  
  await db
    .update(markets, { id: marketId })
    .set({
      status: MarketStatus.RESOLVED,
      winningOutcome,
      poolAfterFees: marketData.poolAfterFees,
      protocolFeeAmount: marketData.protocolFeeAmount,
      creatorFeeAmount: marketData.creatorFeeAmount,
      noWinners: marketData.noWinners,
    });
};

// Helper function to handle MarketPaused for all contracts
const handleMarketPaused = async ({ event, context }: any) => {
  const { db } = context;
  
  await db
    .update(markets, { id: event.args.marketId.toString() })
    .set({
      status: MarketStatus.PAUSED,
    });
};

// Register handlers for Vamos contract (works across all networks)
ponder.on("Vamos:MarketCreated", handleMarketCreated);
ponder.on("Vamos:PredictionPlaced", handlePredictionPlaced);
ponder.on("Vamos:MarketResolved", handleMarketResolved);
ponder.on("Vamos:MarketPaused", handleMarketPaused);
