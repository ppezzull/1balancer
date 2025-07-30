# Development Guide

## Prerequisites

- Node.js 18+
- Yarn package manager
- Git

## Setup

1. Install dependencies:
```bash
yarn install
```

2. Start local blockchain:
```bash
cd packages/hardhat
yarn chain
```

3. Deploy contracts:
```bash
yarn deploy
```

4. Start frontend:
```bash
cd packages/nextjs
yarn dev
```

## Contract Development

### Structure
- **ethereum-hub/**: Fusion+ cross-chain contracts
- **portfolio/**: Portfolio management modules
- **foundation/**: 1inch protocol integrations

### Deployment
Contracts are deployed to BASE chain. Update `hardhat.config.ts` with your deployment keys.

### Testing
```bash
cd packages/hardhat
yarn test
```

## Frontend Development

### Key Hooks
- `useScaffoldReadContract`: Read contract state
- `useScaffoldWriteContract`: Write contract transactions

### 1inch API Integration
API calls are proxied through `/api/1inch/` to handle CORS.

## Cross-Chain Integration

The system integrates with NEAR Protocol contracts in the `1balancer-near` repository through:
- Event monitoring
- Orchestration layer coordination
- Atomic swap execution

## Environment Variables

Create `.env.local` in `packages/nextjs/`:
```
NEXT_PUBLIC_1INCH_API_KEY=your-api-key
NEXT_PUBLIC_BASE_RPC_URL=https://base-mainnet.g.alchemy.com/v2/your-key
```