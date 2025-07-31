const express = require('express');
const router = express.Router();

/**
 * 1inch API Routes Middleware
 * Handles specific 1inch API endpoints with proper transformations
 */

// Swagger/OpenAPI spec
router.get('/swagger/v6.0/:chain/swagger.json', (req, res, next) => {
  req.url = `/v6.0/${req.params.chain}/swagger/swagger.json`;
  next();
});

// Token list
router.get('/swap/v6.0/:chain/tokens', (req, res, next) => {
  req.url = `/v6.0/${req.params.chain}/tokens`;
  next();
});

// Liquidity sources
router.get('/swap/v6.0/:chain/liquidity-sources', (req, res, next) => {
  req.url = `/v6.0/${req.params.chain}/liquidity-sources`;
  next();
});

// Quote endpoint
router.get('/swap/v6.0/:chain/quote', (req, res, next) => {
  req.url = `/v6.0/${req.params.chain}/quote`;
  next();
});

// Swap endpoint
router.get('/swap/v6.0/:chain/swap', (req, res, next) => {
  req.url = `/v6.0/${req.params.chain}/swap`;
  next();
});

// Approve transaction
router.get('/swap/v6.0/:chain/approve/transaction', (req, res, next) => {
  req.url = `/v6.0/${req.params.chain}/approve/transaction`;
  next();
});

// Approve allowance
router.get('/swap/v6.0/:chain/approve/allowance', (req, res, next) => {
  req.url = `/v6.0/${req.params.chain}/approve/allowance`;
  next();
});

// Approve spender
router.get('/swap/v6.0/:chain/approve/spender', (req, res, next) => {
  req.url = `/v6.0/${req.params.chain}/approve/spender`;
  next();
});

// Orderbook endpoints
router.get('/orderbook/v4.0/:chain', (req, res, next) => {
  req.url = `/orderbook/v4.0/${req.params.chain}`;
  next();
});

// Create order
router.post('/orderbook/v4.0/:chain/order', (req, res, next) => {
  req.url = `/orderbook/v4.0/${req.params.chain}/order`;
  next();
});

// Get orders by maker
router.get('/orderbook/v4.0/:chain/address/:address/orders', (req, res, next) => {
  req.url = `/orderbook/v4.0/${req.params.chain}/address/${req.params.address}/orders`;
  next();
});

// Get order by hash
router.get('/orderbook/v4.0/:chain/order/:orderHash', (req, res, next) => {
  req.url = `/orderbook/v4.0/${req.params.chain}/order/${req.params.orderHash}`;
  next();
});

// Fill order
router.post('/orderbook/v4.0/:chain/fill', (req, res, next) => {
  req.url = `/orderbook/v4.0/${req.params.chain}/fill`;
  next();
});

// Fusion endpoints
router.get('/fusion/relayers/v2.0/:chain/relayers/addresses/active', (req, res, next) => {
  req.url = `/fusion/relayers/v2.0/${req.params.chain}/relayers/addresses/active`;
  next();
});

// Get quotes
router.post('/fusion/quoter/v2.0/:chain/quote/receive', (req, res, next) => {
  req.url = `/fusion/quoter/v2.0/${req.params.chain}/quote/receive`;
  next();
});

// Place order
router.post('/fusion/relayers/v2.0/:chain/order/submit', (req, res, next) => {
  req.url = `/fusion/relayers/v2.0/${req.params.chain}/order/submit`;
  next();
});

// Get order status
router.get('/fusion/relayers/v2.0/:chain/order/:orderHash/status', (req, res, next) => {
  req.url = `/fusion/relayers/v2.0/${req.params.chain}/order/${req.params.orderHash}/status`;
  next();
});

// Cancel order
router.post('/fusion/relayers/v2.0/:chain/order/:orderHash/cancel', (req, res, next) => {
  req.url = `/fusion/relayers/v2.0/${req.params.chain}/order/${req.params.orderHash}/cancel`;
  next();
});

// Price endpoints for aggregation
router.get('/price/v1.1/:chain', (req, res, next) => {
  req.url = `/price/v1.1/${req.params.chain}`;
  next();
});

// Gas price oracle
router.get('/gas-price/v1.5/:chain', (req, res, next) => {
  req.url = `/gas-price/v1.5/${req.params.chain}`;
  next();
});

// Chain constants
const SUPPORTED_CHAINS = {
  1: 'ethereum',
  8453: 'base',
  137: 'polygon',
  42161: 'arbitrum',
  10: 'optimism',
  56: 'bsc'
};

// Middleware to validate chain ID
router.use((req, res, next) => {
  const chainId = req.params.chain;
  if (chainId && !SUPPORTED_CHAINS[chainId]) {
    return res.status(400).json({
      error: 'Unsupported chain',
      message: `Chain ${chainId} is not supported`,
      supportedChains: SUPPORTED_CHAINS
    });
  }
  next();
});

module.exports = router;