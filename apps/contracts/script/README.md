# Vamos Deployment Scripts

This directory contains deployment scripts for the Vamos prediction market contract.

## Quick Start

For a simple deployment:
```bash
cd apps/contracts
export PREDICTION_TOKEN=0x... # Your ERC20 token address
forge script script/Deploy.s.sol:Deploy --rpc-url $RPC_URL --broadcast
```

For a complete lifecycle demo on Anvil:
```bash
cd apps/contracts
anvil # In a separate terminal
forge script script/DeployAndDemoLifecycle.s.sol:DeployAndDemoLifecycle --rpc-url http://localhost:8545 --broadcast -vv
```

---

## Deploy.s.sol

Simple deployment script for production use.

### Environment Variables
- `PREDICTION_TOKEN` (required): Address of the ERC20 token to use for predictions
- `PROTOCOL_FEE_RATE` (optional): Protocol fee in basis points (default: 200 = 2%)
- `CREATOR_FEE_RATE` (optional): Creator fee in basis points (default: 300 = 3%)

### Example Usage

```bash
# Deploy with custom token
export PREDICTION_TOKEN=0x6B175474E89094C44Da98b954EedeAC495271d0F # DAI on mainnet
export PROTOCOL_FEE_RATE=150  # 1.5%
export CREATOR_FEE_RATE=250   # 2.5%

forge script script/Deploy.s.sol:Deploy \
  --rpc-url $RPC_URL \
  --broadcast \
  --verify
```

---

## DeployAndDemoLifecycle.s.sol

A comprehensive deployment script that demonstrates the full lifecycle of the Vamos prediction market contract.

### What This Script Does

1. **Deploy Contracts**: Deploys a mock ERC20 token and the Vamos contract with 2% protocol fee and 3% creator fee
2. **Mint Tokens**: Distributes 10,000 DEMO tokens to three test users
3. **Create Markets**: Creates three different types of markets:
   - Binary weather prediction (2 outcomes)
   - Sports championship (3 outcomes)
   - Crypto price prediction (3 outcomes, will have no winners)
4. **Place Predictions**: Multiple users place predictions on different outcomes
5. **Pause Market**: Demonstrates pause functionality to prevent frontrunning
6. **Resolve Markets**: Resolves all markets with different scenarios:
   - Normal resolution with winners
   - Multiple winners sharing the pool
   - No winners scenario (triggering refunds)
7. **Claim Winnings/Refunds**: Users claim their winnings or refunds
8. **Display Summary**: Shows final balances and market states

### Running on Anvil (Local Testnet)

#### Step 1: Start Anvil

In a terminal, start the Anvil local testnet:

```bash
anvil
```

Keep this terminal running.

#### Step 2: Run the Script

In another terminal, navigate to the contracts directory and run:

```bash
cd apps/contracts
forge script script/DeployAndDemoLifecycle.s.sol:DeployAndDemoLifecycle --rpc-url http://localhost:8545 --broadcast -vvv
```

### Command Breakdown

- `forge script`: Runs a Foundry script
- `script/DeployAndDemoLifecycle.s.sol:DeployAndDemoLifecycle`: Path and contract name
- `--rpc-url http://localhost:8545`: Connect to Anvil (default port)
- `--broadcast`: Actually execute transactions on the network
- `-vvv`: Verbose output (shows detailed logs)

### Expected Output

The script will output detailed logs showing:
- Contract deployment addresses
- Market creation events
- Prediction placements
- Pause demonstration
- Market resolutions with fee distributions
- Claims and refunds
- Final balance summary

### Running on Other Networks

To deploy on a real network, you'll need to:

1. Set up your private key:
```bash
export PRIVATE_KEY_OWNER=0x...
```

2. Run with the appropriate RPC URL:
```bash
forge script script/DeployAndDemoLifecycle.s.sol:DeployAndDemoLifecycle \
  --rpc-url $RPC_URL \
  --broadcast \
  --verify
```

### Key Features Demonstrated

- ✅ Market creation with different outcome counts
- ✅ Multiple users placing predictions
- ✅ Pause functionality (frontrunning prevention)
- ✅ Fee distribution (protocol + creator fees)
- ✅ Proportional winnings calculation
- ✅ No-winner refund scenario
- ✅ ReentrancyGuard protection
- ✅ SafeERC20 usage

### Architecture Notes

The script uses Foundry's `Script` base contract which provides:
- `vm.broadcast()`: Sends transactions from specific addresses
- `vm.startBroadcast()/stopBroadcast()`: Batch transactions
- `console.log()`: Debug output
- Test address generation via `vm.addr()`

### Lifecycle Summary

```
Deploy → Mint → Create Markets → Place Bets → Pause → Resolve → Claim → Summary
   ↓       ↓          ↓              ↓          ↓        ↓        ↓       ↓
Token + Vamos    3 Markets     9 Predictions  Market  3 Markets Winners  Balances
                               across users   Frozen  Decided   Paid     Verified
```

