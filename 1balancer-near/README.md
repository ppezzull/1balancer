# 1Balancer NEAR Integration

This directory contains scripts and configuration for the NEAR Protocol integration in 1Balancer.

## Important Note

The NEAR smart contract functionality has been integrated directly into the orchestrator service as TypeScript/JavaScript code using the modern `@near-js/*` packages. This provides better integration with the cross-chain orchestration logic.

## Architecture

The NEAR integration consists of:

1. **NEARChainCoordinator** (`packages/orchestrator/src/core/NEARChainCoordinator.ts`)
   - Manages HTLC operations on NEAR
   - Handles event monitoring
   - Implements RPC failover

2. **HTLC Contract Interface**
   - Contract address: Configured via `NEAR_HTLC_CONTRACT` env variable
   - Supports atomic swaps with Keccak256 hash function
   - Batch operations for efficiency

## Scripts

- `./scripts/deploy-local.sh` - Sets up local development environment with NEAR support

## Usage

### Local Development

```bash
# From project root
yarn near:deploy

# Or from this directory
./scripts/deploy-local.sh
```

### Configuration

Set these environment variables in your `.env` file:

```env
# NEAR Configuration
NEAR_NETWORK_ID=testnet
NEAR_RPC_URL=https://rpc.testnet.near.org
NEAR_HTLC_CONTRACT=fusion-htlc.testnet
NEAR_MASTER_ACCOUNT=your-account.testnet
NEAR_PRIVATE_KEY=ed25519:your-private-key
```

### Integration Tests

NEAR integration tests are part of the orchestrator test suite:

```bash
cd packages/orchestrator
yarn test:integration
```

## Key Features

- ✅ Keccak256 hash function (Ethereum compatible)
- ✅ Batch HTLC operations
- ✅ Event monitoring with RPC failover
- ✅ Modern @near-js/* SDK integration
- ✅ Proper storage patterns with StorageKey enum
- ✅ HTLC pagination support

## Future Enhancements

- [ ] Rust smart contract implementation (if needed for performance)
- [ ] Mainnet deployment scripts
- [ ] Advanced monitoring and analytics