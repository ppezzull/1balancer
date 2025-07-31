const express = require('express');
const cors = require('cors');
const { createProxyMiddleware } = require('http-proxy-middleware');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const morgan = require('morgan');
const oneInchRoutes = require('./middleware/1inch-routes');
require('dotenv').config();

// Load environment-specific configuration
const env = process.env.NODE_ENV || 'development';
const config = require(`./config/${env}`);

const app = express();
const PORT = config.port;

// Security middleware
app.use(helmet(config.security.helmet));
app.use(morgan(config.logging.format));

// CORS configuration
app.use(cors(config.cors));

// Rate limiting
const limiter = rateLimit(config.rateLimit);

// Apply rate limiting to API routes
app.use('/api/', limiter);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 1inch API proxy configuration
const oneInchProxy = createProxyMiddleware({
  target: config.oneInch.apiUrl,
  changeOrigin: true,
  pathRewrite: {
    '^/api/1inch': '', // Remove /api/1inch prefix
  },
  onProxyReq: (proxyReq, req, res) => {
    // Add API key header if available
    if (config.oneInch.apiKey) {
      proxyReq.setHeader('Authorization', `Bearer ${config.oneInch.apiKey}`);
    }
    
    // Log requests in development
    if (config.logging.logRequests) {
      console.log(`[1inch] ${req.method} ${req.url} -> ${proxyReq.path}`);
    }
  },
  onProxyRes: (proxyRes, req, res) => {
    // Add CORS headers to response
    proxyRes.headers['Access-Control-Allow-Origin'] = '*';
    proxyRes.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS';
    proxyRes.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization';
    
    if (config.logging.logResponses) {
      console.log(`[1inch] Response: ${proxyRes.statusCode} for ${req.url}`);
    }
  },
  onError: (err, req, res) => {
    if (config.logging.logErrors) {
      console.error('[1inch] Proxy error:', err);
    }
    res.status(500).json({ 
      error: 'Proxy error', 
      message: config.development.verboseErrors ? err.message : 'Internal server error'
    });
  }
});

// Apply 1inch routes middleware first
app.use('/api/1inch', oneInchRoutes);

// Apply 1inch proxy to specific routes
app.use('/api/1inch', oneInchProxy);

// Price feed aggregator proxy (for multiple sources)
const priceFeedProxy = createProxyMiddleware({
  target: 'https://api.coingecko.com/api/v3',
  changeOrigin: true,
  pathRewrite: {
    '^/api/prices': '',
  }
});

app.use('/api/prices', priceFeedProxy);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Start server
app.listen(PORT, () => {
  console.log(`CORS proxy server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`1inch API URL: ${process.env.ONEINCH_API_URL || 'https://api.1inch.dev'}`);
  console.log(`API Key configured: ${!!process.env.ONEINCH_API_KEY}`);
});