# Vamos Indexer

Ponder indexer for the Vamos prediction market contract. Tracks markets and bets across Base, Celo, and local Anvil networks.

## Quick Start

### Local Development (Anvil)

```bash
# Start Anvil
anvil

# Set contract address
export VAMOS_ADDRESS_ANVIL=0x5FbDB2315678afecb367f032d93F642f64180aa3

# Run indexer
pnpm dev:anvil
```

### Production (Base & Celo)

```bash
# Set environment variables
export VAMOS_ADDRESS_BASE=0x...
export VAMOS_START_BLOCK_BASE=12345678
export VAMOS_ADDRESS_CELO=0x...
export VAMOS_START_BLOCK_CELO=12345678

# Run indexer
pnpm dev
```

## Environment Variables

**Anvil:**
- `VAMOS_ADDRESS_ANVIL` - Contract address (required)
- `PONDER_RPC_URL_ANVIL` - RPC URL (default: `http://127.0.0.1:8545`)

**Base:**
- `VAMOS_ADDRESS_BASE` - Contract address (required)
- `VAMOS_START_BLOCK_BASE` - Start block (required)
- `PONDER_RPC_URL_BASE` - RPC URL (default: `https://mainnet.base.org`)

**Celo:**
- `VAMOS_ADDRESS_CELO` - Contract address (required)
- `VAMOS_START_BLOCK_CELO` - Start block (required)
- `PONDER_RPC_URL_CELO` - RPC URL (default: `https://forno.celo.org`)

## Schema

**Markets Table:**
- Market details (creator, judge, question, outcomes)
- Pool amounts and fee tracking
- Resolution status

**Bets Table:**
- User predictions per market/outcome
- Cumulative bet amounts
- Timestamps

## API

The indexer exposes a GraphQL API at `http://localhost:42069/graphql` when running.

