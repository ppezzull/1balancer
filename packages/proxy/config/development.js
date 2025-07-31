module.exports = {
  // Server configuration
  port: process.env.PROXY_PORT || 3001,
  
  // CORS configuration
  cors: {
    origin: [
      'http://localhost:3000',  // NextJS frontend
      'http://localhost:3002',  // Alternative frontend port
      'http://localhost:8545',  // Hardhat node
      'http://127.0.0.1:3000',
      'http://127.0.0.1:3002',
      'http://127.0.0.1:8545'
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
  },

  // 1inch API configuration
  oneInch: {
    apiUrl: process.env.ONEINCH_API_URL || 'https://api.1inch.dev',
    apiKey: process.env.ONEINCH_API_KEY,
    chains: {
      1: { name: 'ethereum', enabled: true },
      8453: { name: 'base', enabled: true },
      137: { name: 'polygon', enabled: true },
      42161: { name: 'arbitrum', enabled: true },
      10: { name: 'optimism', enabled: true },
      56: { name: 'bsc', enabled: true }
    }
  },

  // Rate limiting
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000, // Higher limit for development
    skipSuccessfulRequests: false,
    skipFailedRequests: false
  },

  // Logging
  logging: {
    level: 'debug',
    format: 'dev',
    logRequests: true,
    logResponses: true,
    logErrors: true
  },

  // Price feeds configuration
  priceFeeds: {
    coingecko: {
      url: 'https://api.coingecko.com/api/v3',
      rateLimit: 50 // requests per minute
    },
    chainlink: {
      enabled: false // Can be enabled when needed
    }
  },

  // Development specific settings
  development: {
    mockResponses: false,
    delayResponses: 0, // milliseconds
    errorRate: 0, // 0-1, for testing error handling
    verboseErrors: true
  },

  // Security headers (relaxed for development)
  security: {
    helmet: {
      contentSecurityPolicy: false,
      crossOriginEmbedderPolicy: false
    }
  }
};