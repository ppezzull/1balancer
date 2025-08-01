# Changelog - 1balancer NEAR Integration

## [Unreleased] - 2025-08-01

### 🔴 Critical Fixes

#### ✅ Hash Function Compatibility Fix (SHA-256 → Keccak256)
- **Contract (`utils.rs`)**: Updated to use `env::keccak256()` instead of SHA-256
- **Orchestrator (`SecretManager.ts`)**: Updated to use keccak256 for secret generation
- **Dependencies**: Added `js-sha3` dependency to orchestrator package.json
- **Impact**: Ensures cross-chain atomicity with Ethereum and other EVM chains

#### ✅ Storage Architecture Overhaul
- **StorageKey Enum**: Added proper enum variants for type-safe storage keys
- **Storage Initialization**: Updated to use enum-based key generation
- **HTLC Storage**: Fixed active HTLC storage key generation
- **ID Tracking**: Added Vector-based HTLC ID tracking for proper iteration

### 🚀 Major Enhancements

#### ✅ HTLC Management & Pagination
- **Pagination Support**: Implemented `get_active_htlcs()` with proper pagination
- **Bulk Queries**: Added `get_htlcs_paginated()` for all states with `has_more` indicator
- **Data Integrity**: Fixed empty vector issue - now returns actual HTLC data
- **Iteration**: Proper HTLC ID tracking with Vector for efficient iteration

#### ✅ Modern NEAR SDK Integration (@near-js/)
- **Complete Rewrite**: Rewrote `NEARChainCoordinator.ts` using new modular packages
- **RPC Resilience**: Added `FailoverRpcProvider` with automatic failover
- **Package Updates**: Migrated to `@near-js/client`, `@near-js/providers`, etc.
- **Error Handling**: Implemented NEAR-specific error handling and recovery

#### ✅ Batch Operations
- **Batch Creation**: Added `batch_create_htlc()` for multiple HTLC creation
- **Batch Withdrawal**: Added `batch_withdraw()` for efficient bulk withdrawals
- **Enhanced Refunds**: Improved existing `batch_refund()` method
- **Validation**: Proper input validation for all batch operations

#### ✅ Event Monitoring & Observability
- **Event Polling**: Added `get_recent_events()` method for real-time monitoring
- **Event Structure**: Created `EventLog` enum for structured event data
- **RPC Failover**: Implemented in `NEARChainCoordinator` with retry logic
- **Error Recovery**: Added comprehensive error handling and fallback strategies

### 🔧 Technical Improvements

#### Amount Handling
- Fixed NEAR amount parsing (NEAR to yoctoNEAR conversion)
- Proper denomination handling throughout the codebase

#### TypeScript Integration
- Added comprehensive TypeScript types and interfaces
- Improved type safety for NEAR-specific operations
- Enhanced IDE support and development experience

#### Error Management
- Implemented structured error handling across all components
- Added specific error types for different failure scenarios
- Improved error reporting and debugging capabilities

### 📊 Performance & Reliability

#### Event Monitoring
- Efficient event polling with configurable intervals
- Fallback strategies for network issues
- Structured event data for better processing

#### Network Resilience
- RPC failover with multiple provider support
- Automatic retry logic for transient failures
- Connection health monitoring

---

## Architecture Impact

These changes bring the NEAR integration to production-ready status with:

1. **Cross-Chain Compatibility**: Keccak256 ensures atomic swaps work seamlessly with Ethereum
2. **Scalability**: Batch operations and pagination support high-volume scenarios
3. **Reliability**: RPC failover and comprehensive error handling ensure uptime
4. **Maintainability**: Modern NEAR SDK usage and TypeScript types improve code quality
5. **Observability**: Event monitoring enables proper system monitoring and debugging

All implementations follow official NEAR API best practices and maintain full compatibility with the orchestrator service architecture.