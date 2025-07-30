# Portfolio Management Contracts

This directory contains the 1Balancer core business logic for portfolio management.

## Structure

- **factory/**: BalancerFactory contracts for user-specific portfolio creation
- **modules/**: Portfolio management modules
  - BaseBalancer: Percentage-based allocation with 1inch price feeds
  - StableLimit: Precise stablecoin management (0.001 drift)
  - DriftBalancer: Automatic drift-based rebalancing
  - TimeBalancer: Chainlink Automation + 1inch Fusion integration
- **automation/**: Chainlink integration for automated rebalancing

## Architecture

These contracts implement the application layer of the three-layer architecture, providing automated portfolio rebalancing with cross-chain support.