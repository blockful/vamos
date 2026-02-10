# Environment Variables Setup

This document explains the environment variables required for the web application.

## Required Environment Variables

Create a `.env.local` file in `apps/web/` with the following variables:

### Application Configuration
```env
NEXT_PUBLIC_URL=http://localhost:3000
NEXT_PUBLIC_APP_ENV=development
JWT_SECRET=your-jwt-secret-here
```

### Farcaster Mini App Configuration
```env
NEXT_PUBLIC_FARCASTER_HEADER=
NEXT_PUBLIC_FARCASTER_PAYLOAD=
NEXT_PUBLIC_FARCASTER_SIGNATURE=
```

### WalletConnect Configuration (Required for Mobile Wallets)
```env
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id_here
```

**Important:** WalletConnect is required for mobile wallet connections to work on iPhone and other mobile devices. Without this, users won't get a popup to open their wallet app.

### Highlighted Market (Optional)
```env
NEXT_PUBLIC_HIGHLIGHTED_MARKET_ID=8453-0
```

**Optional:** Set this to pin and highlight a specific market at the top of the list. The value should be in the format `chainId-marketId` (e.g., `8453-0` for market 0 on Base). If not set, markets are displayed in chronological order.

To get your WalletConnect Project ID:
1. Visit [WalletConnect Cloud](https://cloud.walletconnect.com/)
2. Create a new project
3. Copy your Project ID

For detailed setup instructions, see [WALLETCONNECT_SETUP.md](./WALLETCONNECT_SETUP.md)

### Network-Specific Contract Addresses

The application automatically uses the correct contract addresses based on the connected network.

#### Base Network
```env
NEXT_PUBLIC_VAMOS_ADDRESS_BASE=0x...
NEXT_PUBLIC_TOKEN_ADDRESS_BASE=0x...
```

## How It Works

- The frontend automatically detects which network the user is connected to
- Contract addresses are retrieved based on the active chain ID
- If a network doesn't have configured addresses, operations will fail with a clear error message

## Supported Networks

- **Base** (Chain ID: 8453)

