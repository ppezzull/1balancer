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
