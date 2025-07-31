# Portfolio Management Contracts

This directory contains the 1Balancer core business logic for portfolio management.

## Contracts Description

### BalancerFactory

The factory contract that enables users to create their own balancer instances tailored to their preferred asset-management strategies.
Main functions:
- createBalancer -> create a new balancer instance and fund it with the specified tokens and percentages
- getBalancer -> get a balancer instance by address
- getBalancers -> get all balancer instances
- getBalancerCount -> get the number of balancer instances
- getBalancersByOwner -> get all balancer instances owned by the specified address
- getBalancersByOwnerAndName -> get all balancer instances owned by the specified address and with the specified name


### StableLimit Module is LimitOrder

The StableLimit module implements a sophisticated stablecoin trading strategy based on limit orders to capitalize on minor price deviations from their peg. This allows for automated profit generation from the natural volatility of stablecoins.

#### Use Case: Stablecoin Arbitrage

**Scenario 1: Buying at a Discount (Purchase at 0.998)**

In this scenario, a limit order is set to buy a stablecoin (e.g., USDC) when its price drops slightly below its peg (e.g., 1 USD). This is based on the expectation that the price will return to its pegged value, allowing for a profit.

-   **Action**: Set a limit buy order for USDC at 0.998 USD, using another stablecoin like USDT or DAI as the purchasing currency.
-   **Example**: An order is set to buy 10,000 USDC at a price of 0.998 USDT per USDC. When the order is executed, 9,980 USDT are spent to obtain 10,000 USDC.
-   **Objective**: Once the price of USDC returns to 1.000 USDT, the 10,000 USDC can be sold for 10,000 USDT, realizing a profit of 20 USDT.

**Scenario 2: Selling at a Premium (Sale at 1.001)**

In this scenario, a limit order is set to sell a stablecoin (e.g., USDC) when its price rises slightly above its peg. This is based on the expectation that the price will return to its pegged value, allowing the stablecoin to be repurchased at a lower price, thus realizing a profit.

-   **Action**: Set a limit sell order for USDC at 1.001 USD, using another stablecoin like USDT or DAI as the purchasing currency.
-   **Example**: An order is set to sell 10,000 USDC at a price of 1.001 USDT per USDC. When the order is executed, 10,010 USDT are received.
-   **Objective**: Once the price of USDC returns to 1.000 USDT, the 10,000 USDC can be repurchased for 10,000 USDT, realizing a profit of 10 USDT.

**Simultaneous Implementation:**

The true power of this strategy lies in the simultaneous implementation of both scenarios. Limit orders are set to both buy at a discount and sell at a premium. This way, one is positioned to profit from any small deviation from the peg, regardless of the direction.

**Advanced Strategies and Optimizations**

The basic strategy can be further optimized through several advanced techniques:

-   **Dynamic Scaling**: Instead of using fixed prices (e.g., 0.998 and 1.002), a dynamic scaling system can be implemented that adapts the target prices based on recent historical volatility. In periods of higher volatility, the spreads can be widened to capture larger movements.
-   **Multiple Orders**: Instead of setting a single limit order for each direction, a "ladder" of orders can be created at progressively more advantageous prices, with decreasing volumes. For example:
    -   **Buy**: 40% of capital at 0.998, 30% at 0.997, 20% at 0.996, 10% at 0.995
    -   **Sell**: 40% of capital at 1.002, 30% at 1.003, 20% at 1.004, 10% at 1.005

### BaseBalancer Module is StableLimit

The shared foundational module providing basic percentage-based allocation functionality. This module integrates directly with the 1inch Price Feed Aggregator Contract to fetch tokens' real-time values, comparing them to current balances and ensuring precise allocation logic. It has a name and a description and it is owned by the user that deployed it.
Main functions:
- setPercentages -> set the percentages of the tokens
- fundWallet -> fund the wallet with the specified tokens and percentages
- withdrawFunds -> withdraw the specified amount of funds from the wallet
- constructor -> name, description, owner, tokens, percentages, priceFeed address. Tokens and percentages are arrays of the same length and a minimum of 2 tokens are required. 
- comparePercentages -> fetch the values of the tokens and compare them to the percentages and returns if the portfolio is rebalanced or not and returns imbalance amounts for each token

Attributes:
- name
- description
- owner
- tokens
- percentages
- priceFeed
- wallet
- totalValue

### DriftBalancer is BaseBalancer + LimitOrder

The DriftBalancer contract combines the functionalities of the BaseBalancer and LimitOrder modules. It is designed for automated, drift-based rebalancing of a diversified crypto asset portfolio. When the portfolio's composition deviates from the target percentages beyond a specified threshold, this contract automatically executes the necessary trades to restore the desired balance.

### TimeBalancer is BaseBalancer + Chainlink Automation + 1inch Fusion

The TimeBalancer contract integrates the BaseBalancer's logic with Chainlink Automation and the 1inch Fusion protocol. This combination allows for scheduled, time-based portfolio rebalancing. Users can set specific intervals (e.g., daily, weekly) at which the contract will automatically execute swaps to maintain the desired asset distribution, ensuring the portfolio stays aligned with the user's strategy without manual intervention.