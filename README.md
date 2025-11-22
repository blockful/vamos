# Vamos Predictable Market

A decentralized prediction market platform built on Ethereum with a modern tech stack.

## 📁 Monorepo Structure

This is a monorepo managed by **Turborepo** and **pnpm workspaces**:

```
vamos/
├── apps/
│   ├── contracts/      # Solidity smart contracts (Foundry)
│   ├── indexer/        # Blockchain indexer (Ponder)
│   └── web/           # Frontend application (Next.js)
├── .env               # Centralized environment variables
└── package.json       # Root package with convenient scripts
```

## 🚀 Quick Start

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Setup Environment Variables

Create a `.env` file in the root directory. See [ENV_SETUP.md](./ENV_SETUP.md) for details.

### 3. Start Development

```bash
# Run all apps
pnpm dev

# Or run specific apps
pnpm web:dev              # Start web app
pnpm indexer:dev          # Start indexer
pnpm contracts:build      # Build contracts
```

## 📚 Documentation

- **[MONOREPO_GUIDE.md](./MONOREPO_GUIDE.md)** - How to use the monorepo, run scripts, and manage packages
- **[ENV_SETUP.md](./ENV_SETUP.md)** - Environment variables configuration
- **[FARCASTER_SETUP.md](./FARCASTER_SETUP.md)** - Farcaster integration setup

## 🏗️ Apps

### `@vamos/contracts`
Solidity smart contracts for the prediction market, built with Foundry.

**Key Commands:**
- `pnpm contracts:build` - Compile contracts
- `pnpm contracts:test` - Run tests
- `pnpm contracts:deploy:vamos` - Deploy Vamos contract
- `pnpm contracts:deploy:token` - Deploy prediction token

### `@vamos/indexer`
Real-time blockchain indexer built with Ponder for efficient data querying.

**Key Commands:**
- `pnpm indexer:dev` - Start indexer in development
- `pnpm indexer:start` - Start indexer in production

### `@vamos/web`
Next.js frontend with Farcaster Frame integration and Web3 connectivity.

**Key Commands:**
- `pnpm web:dev` - Start dev server
- `pnpm web:build` - Build for production
- `pnpm web:start` - Start production server

## 🛠️ Tech Stack

- **Smart Contracts**: Solidity, Foundry, OpenZeppelin
- **Indexer**: Ponder, PostgreSQL
- **Frontend**: Next.js 14, TypeScript, Tailwind CSS
- **Web3**: wagmi, viem, Farcaster SDK
- **Monorepo**: Turborepo, pnpm workspaces

## 📦 Common Commands

```bash
pnpm build              # Build all apps
pnpm dev                # Run all apps in development
pnpm lint               # Lint all apps
pnpm type-check         # Type check all apps
pnpm clean              # Clean build artifacts
```

## 🔗 Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [Foundry Documentation](https://book.getfoundry.sh/)
- [Ponder Documentation](https://ponder.sh/)
- [Turborepo Documentation](https://turbo.build/repo/docs)
- [Farcaster Frames](https://docs.farcaster.xyz/developers/frames/)
