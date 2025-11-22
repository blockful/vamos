# Schema Relations - Markets, Outcomes, and Bets

## Database Structure

### Tables

1. **markets** - All prediction markets
2. **outcomes** - All possible outcomes for each market
3. **bets** - All bets placed by users on specific outcomes

### Relationships

```
markets (1) ──→ (many) outcomes
markets (1) ──→ (many) bets
outcomes (1) ──→ (many) bets
```

## Schema Details

### Markets Table
- `id`: Market ID (primary key)
- `creator`: Market creator address
- `judge`: Judge address who can resolve the market
- `question`: The prediction question
- `numOutcomes`: Number of possible outcomes
- `totalPool`: Total amount bet across all outcomes
- `status`: "OPEN", "PAUSED", or "RESOLVED"
- `winningOutcome`: Index of winning outcome (null until resolved)
- `createdAt`: Block timestamp
- `poolAfterFees`: Pool amount after fees deducted
- `protocolFeeAmount`: Protocol fee amount
- `creatorFeeAmount`: Creator fee amount
- `noWinners`: Boolean indicating if there are no winners

**Relations:**
- `outcomes`: many outcomes
- `bets`: many bets

### Outcomes Table
- `id`: Composite primary key `${marketId}-${outcomeIndex}`
- `marketId`: Reference to markets.id
- `outcomeIndex`: Index of the outcome (0, 1, 2, etc.)
- `description`: Description of the outcome
- `totalAmount`: Total amount bet on this outcome

**Relations:**
- `market`: one market
- `bets`: many bets

### Bets Table
- `id`: Composite primary key `${marketId}-${user}-${outcomeIndex}`
- `marketId`: Reference to markets.id
- `outcomeId`: Reference to outcomes.id
- `user`: User address
- `outcomeIndex`: Index of the outcome (kept for convenience)
- `amount`: Cumulative amount bet by this user on this outcome
- `lastUpdated`: Timestamp of last bet placement

**Relations:**
- `market`: one market
- `outcome`: one outcome

**Note:** Each bet is unique per (market + user + outcome). If a user places multiple bets on the same outcome, the amounts are aggregated.

## Query Examples

### TypeScript (Drizzle Query API)

```typescript
import { markets, outcomes, bets } from "ponder:schema";

// Get a market with all its outcomes
const market = await db.sql.query.markets.findFirst({
  where: eq(markets.id, "1"),
  with: { outcomes: true },
});

// Get a market with all its bets
const marketWithBets = await db.sql.query.markets.findFirst({
  where: eq(markets.id, "1"),
  with: { bets: true },
});

// Get a market with outcomes and bets for each outcome
const fullMarket = await db.sql.query.markets.findFirst({
  where: eq(markets.id, "1"),
  with: { 
    outcomes: { 
      with: { bets: true } 
    } 
  },
});

// Get an outcome with its market and all bets on it
const outcome = await db.sql.query.outcomes.findFirst({
  where: eq(outcomes.id, "1-0"),
  with: { 
    market: true,
    bets: true 
  },
});

// Get a bet with its market and outcome details
const bet = await db.sql.query.bets.findFirst({
  where: eq(bets.id, "1-0x123...-0"),
  with: { 
    market: true,
    outcome: true 
  },
});
```

### GraphQL API

```graphql
# Get a market with its outcomes
query {
  market(id: "1") {
    id
    question
    creator
    judge
    status
    totalPool
    outcomes {
      items {
        id
        outcomeIndex
        description
        totalAmount
      }
    }
  }
}

# Get a market with outcomes and their bets
query {
  market(id: "1") {
    id
    question
    outcomes {
      items {
        outcomeIndex
        description
        totalAmount
        bets {
          items {
            user
            amount
            lastUpdated
          }
        }
      }
    }
  }
}

# Get all bets for a specific outcome
query {
  outcome(id: "1-0") {
    description
    totalAmount
    market {
      question
    }
    bets {
      items {
        user
        amount
        lastUpdated
      }
    }
  }
}

# Get all bets by a specific user
query {
  bets(where: { user: "0x123..." }) {
    items {
      amount
      lastUpdated
      market {
        question
        status
      }
      outcome {
        description
      }
    }
  }
}

# Get all markets with their total bets
query {
  markets {
    items {
      id
      question
      totalPool
      status
      bets {
        totalCount
      }
      outcomes {
        items {
          description
          totalAmount
        }
      }
    }
  }
}
```

## Event Handlers

When events are processed:

1. **MarketCreated**: 
   - Creates market record
   - Creates outcome records for each possible outcome

2. **PredictionPlaced**:
   - Creates/updates bet record (aggregates amounts)
   - Updates market's totalPool
   - Updates outcome's totalAmount

3. **MarketResolved**:
   - Updates market status to "RESOLVED"
   - Sets winningOutcome
   - Records fee amounts

4. **MarketPaused**:
   - Updates market status to "PAUSED"

