# Portfolio Contracts Documentation

This document provides a detailed explanation of the contracts in the portfolio and mocks directories.

## Portfolio Contracts

The portfolio contracts are designed to create and manage automated asset balancing strategies.

### `OptimizedTimeBalancer.sol`

**Inherits:** `OptimizedBaseBalancer`

**Purpose:** This contract triggers a rebalancing event based on a predefined time interval. It is ideal for strategies that require periodic rebalancing, regardless of market conditions.

**Key Functionality:**

*   `constructor`: Initializes the contract with the rebalancing interval.
*   `triggerTimeRebalance()`: Checks if the rebalancing interval has passed and, if so, emits a `RebalanceNeeded` event.
*   `setRebalanceInterval()`: Allows the owner to update the rebalancing interval.

### `OptimizedDriftBalancer.sol`

**Inherits:** `OptimizedBaseBalancer`

**Purpose:** This contract triggers a rebalancing event when the allocation of any asset drifts from its target percentage by a predefined amount. This is useful for strategies that aim to maintain a specific asset allocation.

**Key Functionality:**

*   `constructor`: Initializes the contract with the drift percentage.
*   `triggerRebalance()`: Checks the current asset allocation and, if the drift exceeds the defined percentage, emits a `RebalanceNeeded` event.
*   `updateDriftPercentage()`: Allows the owner to update the drift percentage.

### `OptimizedBaseBalancer.sol`

**Inherits:** `Ownable`, `ReentrancyGuard`, `OptimizedStableLimit`

**Purpose:** This is the core contract that provides the fundamental asset management and portfolio valuation logic. It is an abstract contract that is inherited by the specific balancer implementations.

**Key Functionality:**

*   `fund()`: Allows the owner to fund the contract with assets.
*   `withdraw()`: Allows the owner to withdraw assets.
*   `updateAssetMapping()`: Allows the owner to update the target asset allocation.
*   `getTotalValue()`: Returns the total value of the portfolio in ETH.
*   `getPrice()`: Returns the price of a specific asset in ETH.
*   `getPortfolioAnalysis()`: Returns a basic analysis of the portfolio, including its value, stablecoin ratio, and whether it is balanced.

### `OptimizedStableLimit.sol`

**Inherits:** `Ownable`, `Pausable`, `AutomationCompatibleInterface`, `IERC1271`

**Purpose:** This contract implements a sophisticated stablecoin grid trading strategy. It integrates with Chainlink Automation to trigger rebalancing when stablecoin prices deviate and uses a limit order protocol to execute trades.

**Key Functionality:**

*   `checkUpkeep()`: Implements the Chainlink Automation interface to check if a rebalance is needed.
*   `performUpkeep()`: Executes the rebalancing logic when triggered by Chainlink Automation.
*   `createRebalanceOrder()`: Creates a rebalancing limit order.
*   `createStablecoinGridOrder()`: Creates a stablecoin grid limit order.
*   `isValidSignature()`: Implements the EIP-1271 interface for signature validation.

### `OptimizedBalancerFactory.sol`

**Inherits:** `Ownable`

**Purpose:** This contract is a factory for creating and managing `OptimizedTimeBalancer` and `OptimizedDriftBalancer` instances.

**Key Functionality:**

*   `createDriftBalancer()`: Deploys a new `OptimizedDriftBalancer` contract.
*   `createTimeBalancer()`: Deploys a new `OptimizedTimeBalancer` contract.

### Libraries

*   **`StablecoinGridLib.sol`:** Provides the logic for generating grid trading orders for stablecoins.
*   **`LimitOrderLib.sol`:** Provides the logic for creating and managing 1inch limit orders.
*   **`PortfolioAnalysisLib.sol`:** Provides the logic for checking if an asset is within its target allocation and for calculating the ratio of stablecoins in the portfolio.
ocks Contracts

## Mocks Contracts

The mocks contracts are used for testing purposes.

### `MockERC20.sol`

**Purpose:** A standard mock ERC20 token.

### `MockAggregationRouter.sol`

**Purpose:** A minimal mock of the 1inch aggregation router.

### `MockLimitOrderProtocol.sol`

**Purpose:** A mock of the 1inch limit order protocol.

### `MockSpotPriceAggregator.sol`

**Purpose:** A mock of a spot price aggregator with configurable prices.
