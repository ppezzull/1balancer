module.exports = {
  // Server configuration
  port: process.env.PORT || 3001,
  
  // CORS configuration
  cors: {
    origin: process.env.ALLOWED_ORIGINS 
      ? process.env.ALLOWED_ORIGINS.split(',')
      : ['https://1balancer.vercel.app'], // Replace with your production domain
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

  // Rate limiting (stricter for production)
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    skipSuccessfulRequests: false,
    skipFailedRequests: false,
    standardHeaders: true,
    legacyHeaders: false
  },

  // Logging
  logging: {
    level: 'error',
    format: 'combined',
    logRequests: false,
    logResponses: false,
    logErrors: true
  },

  // Price feeds configuration
  priceFeeds: {
    coingecko: {
      url: 'https://api.coingecko.com/api/v3',
      rateLimit: 50 // requests per minute
    }
  },

  // Production specific settings
  development: {
    mockResponses: false,
    delayResponses: 0,
    errorRate: 0,
    verboseErrors: false
  },

  // Security headers (strict for production)
  security: {
    helmet: {
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", "'unsafe-inline'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", "data:", "https:"],
          connectSrc: ["'self'", "https://api.1inch.dev", "https://api.coingecko.com"]
        }
      },
      crossOriginEmbedderPolicy: true,
      hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true
      }
    }
  }
};