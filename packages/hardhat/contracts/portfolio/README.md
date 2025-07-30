# Portfolio Management Contracts

This directory contains the 1Balancer core business logic for portfolio management.

## Contracts Description

### BalancerFactory

A factory contract that enables users to create their own balancer instances tailored to their preferred asset-management strategies.

### BaseBalancer Module

A shared foundational module providing basic percentage-based allocation functionality. This module integrates directly with the 1inch Price Feed Aggregator Contract to fetch tokens' real-time values, comparing them to current balances and ensuring precise allocation logic.

### StableLimit Module

Implements highly precise "stress limit orders" for stablecoins (e.g., USDC and USDT) with a minimal drift threshold of 0.001, ensuring stablecoin portfolios remain tightly balanced with negligible slippage. This module also leverages the 1inch Price Feed Aggregator Contract to maintain accurate stablecoin valuations.

### DriftBalancer

Uses the StableLimit and BaseBalancer modules to establish automatic drift-based rebalancing, enabling efficient and automatic management of diversified crypto asset portfolios.

### TimeBalancer

Combines the StableLimit and BaseBalancer logic with Chainlink Automation and the 1inch Fusion protocol to execute timely swaps, automatically maintaining desired portfolio distributions based on preset percentages.