# Vamos (vamos.fun) - Prediction Market Contracts

## Overview

vamos.fun is a multi-outcome prediction market smart contract where users create markets, place predictions, and claim winnings proportionally.

## Features

- **Multi-outcome markets**: Create markets with 2+ possible outcomes
- **Pool-based mechanism**: Winners split the entire pot proportionally
- **Single ERC20 token**: Uses one token for all predictions across markets
- **Fee distribution**: Protocol and market creator fees configured at deployment
- **Market pausing**: Critical step before resolution - judges pause markets to prevent new predictions
- **Refund mechanism**: Full refunds if no one predicted the winning outcome
- **Secure**: Uses OpenZeppelin's battle-tested contracts (ReentrancyGuard, SafeERC20, Ownable)

## Market Lifecycle

1. **Create** - Anyone creates a market with a question, outcomes, and designated judge
2. **Predict** - Users place predictions on outcomes while market is active
3. **Pause** - Judge pauses the market to stop new predictions (crucial before resolution)
4. **Resolve** - Judge declares the winning outcome
5. **Claim** - Winners claim their proportional share, or users claim refunds if no winners

## Core Functions

- `createMarket()` - Create a new prediction market
- `placePrediction()` - Bet tokens on an outcome
- `pauseMarket()` - Stop new predictions before resolution
- `resolveMarket()` - Judge declares winning outcome
- `claimWinnings()` - Winners claim their share
- `claimRefund()` - Claim refund if no winners

## Security

- Reentrancy protection on all token transfers
- Market resolution requires designated judge address
- Uses SafeERC20 for robust token handling

## Testing

Run tests:
```bash
forge test
```

## Built With

- Solidity 0.8.13
- OpenZeppelin Contracts
- Foundry

