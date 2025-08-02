// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @title TradingExecutionLib
 * @dev Library for executing trades and managing token swaps
 */
library TradingExecutionLib {
    using SafeERC20 for IERC20;

    struct TradeParams {
        address tokenIn;
        address tokenOut;
        uint256 amountIn;
        uint256 minAmountOut;
        bytes routerCalldata;
    }

    struct RebalanceExecution {
        address[] sellTokens;
        uint256[] sellAmounts;
        address[] buyTokens;
        uint256[] buyAmounts;
        uint256 totalGasUsed;
        bool success;
    }

    event TradeExecuted(
        address indexed tokenIn,
        address indexed tokenOut,
        uint256 amountIn,
        uint256 amountOut,
        uint256 gasUsed
    );

    event RebalanceCompleted(
        uint256 tradesExecuted,
        uint256 totalGasUsed,
        bool success
    );

    /**
     * @dev Execute a single token swap
     * @param params Trade parameters
     * @param router Address of the DEX router
     * @return amountOut Amount of tokens received
     * @return gasUsed Gas consumed by the trade
     */
    function executeTrade(
        TradeParams memory params,
        address router
    ) external returns (uint256 amountOut, uint256 gasUsed) {
        uint256 gasStart = gasleft();
        
        // Transfer tokens to router
        IERC20(params.tokenIn).safeTransfer(router, params.amountIn);
        
        // Record balance before trade
        uint256 balanceBefore = IERC20(params.tokenOut).balanceOf(address(this));
        
        // Execute trade via router
        (bool success, ) = router.call(params.routerCalldata);
        require(success, "Trade execution failed");
        
        // Calculate received amount
        uint256 balanceAfter = IERC20(params.tokenOut).balanceOf(address(this));
        amountOut = balanceAfter - balanceBefore;
        
        require(amountOut >= params.minAmountOut, "Insufficient output amount");
        
        gasUsed = gasStart - gasleft();
        
        emit TradeExecuted(
            params.tokenIn,
            params.tokenOut,
            params.amountIn,
            amountOut,
            gasUsed
        );
    }

    /**
     * @dev Execute multiple trades for portfolio rebalancing
     * @param trades Array of trade parameters
     * @param router Address of the DEX router
     * @return execution Rebalance execution results
     */
    function executeRebalance(
        TradeParams[] memory trades,
        address router
    ) external returns (RebalanceExecution memory execution) {
        uint256 totalGas = 0;
        bool allSuccess = true;
        
        execution.sellTokens = new address[](trades.length);
        execution.sellAmounts = new uint256[](trades.length);
        execution.buyTokens = new address[](trades.length);
        execution.buyAmounts = new uint256[](trades.length);
        
        for (uint256 i = 0; i < trades.length; i++) {
            uint256 gasStart = gasleft();
            
            try IERC20(trades[i].tokenIn).transfer(router, trades[i].amountIn) {
                uint256 balanceBefore = IERC20(trades[i].tokenOut).balanceOf(address(this));
                
                (bool success, ) = router.call(trades[i].routerCalldata);
                if (success) {
                    uint256 balanceAfter = IERC20(trades[i].tokenOut).balanceOf(address(this));
                    uint256 amountOut = balanceAfter - balanceBefore;
                    
                    if (amountOut >= trades[i].minAmountOut) {
                        execution.sellTokens[i] = trades[i].tokenIn;
                        execution.sellAmounts[i] = trades[i].amountIn;
                        execution.buyTokens[i] = trades[i].tokenOut;
                        execution.buyAmounts[i] = amountOut;
                        
                        uint256 gasUsed = gasStart - gasleft();
                        totalGas += gasUsed;
                        
                        emit TradeExecuted(
                            trades[i].tokenIn,
                            trades[i].tokenOut,
                            trades[i].amountIn,
                            amountOut,
                            gasUsed
                        );
                    } else {
                        allSuccess = false;
                    }
                } else {
                    allSuccess = false;
                }
            } catch {
                allSuccess = false;
            }
        }
        
        execution.totalGasUsed = totalGas;
        execution.success = allSuccess;
        
        emit RebalanceCompleted(trades.length, totalGas, allSuccess);
    }

    /**
     * @dev Calculate slippage protection for trades
     * @param expectedOut Expected output amount
     * @param slippageTolerance Slippage tolerance in basis points (e.g., 50 = 0.5%)
     * @return minOut Minimum acceptable output amount
     */
    function calculateMinOutput(
        uint256 expectedOut,
        uint256 slippageTolerance
    ) external pure returns (uint256 minOut) {
        require(slippageTolerance <= 1000, "Slippage tolerance too high"); // Max 10%
        minOut = (expectedOut * (10000 - slippageTolerance)) / 10000;
    }

    /**
     * @dev Batch transfer tokens for efficiency
     * @param tokens Array of token addresses
     * @param amounts Array of amounts to transfer
     * @param recipient Recipient address
     */
    function batchTransfer(
        address[] memory tokens,
        uint256[] memory amounts,
        address recipient
    ) external {
        require(tokens.length == amounts.length, "Arrays length mismatch");
        
        for (uint256 i = 0; i < tokens.length; i++) {
            if (amounts[i] > 0) {
                IERC20(tokens[i]).safeTransfer(recipient, amounts[i]);
            }
        }
    }

    /**
     * @dev Emergency withdraw all tokens to owner
     * @param tokens Array of token addresses to withdraw
     * @param owner Address to receive tokens
     */
    function emergencyWithdrawAll(
        address[] memory tokens,
        address owner
    ) external {
        for (uint256 i = 0; i < tokens.length; i++) {
            IERC20 token = IERC20(tokens[i]);
            uint256 balance = token.balanceOf(address(this));
            if (balance > 0) {
                token.safeTransfer(owner, balance);
            }
        }
    }
}
