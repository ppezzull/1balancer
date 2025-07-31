import rateLimit from 'express-rate-limit';
import { config } from '../../config';
import { createLogger } from '../../utils/logger';

const logger = createLogger('rate-limiter');

// Create rate limiter instance
export const rateLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.maxRequests,
  message: {
    error: 'Too many requests',
    message: 'You have exceeded the rate limit. Please try again later.',
    retryAfter: config.rateLimit.windowMs / 1000,
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn('Rate limit exceeded', {
      ip: req.ip,
      path: req.path,
      method: req.method,
    });
    res.status(429).json({
      error: 'Too many requests',
      message: 'You have exceeded the rate limit. Please try again later.',
      retryAfter: Math.ceil(config.rateLimit.windowMs / 1000),
    });
  },
  skip: (req) => {
    // Skip rate limiting for health checks
    return req.path === '/health';
  },
  keyGenerator: (req) => {
    // Use API key if available, otherwise use IP
    const apiKey = req.headers['x-api-key'] as string;
    return apiKey || req.ip || 'unknown';
  },
});

// Create stricter rate limiter for sensitive endpoints
export const strictRateLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 10, // 10 requests per window
  message: {
    error: 'Too many requests',
    message: 'Rate limit exceeded for this endpoint',
  },
});

// Create a custom rate limiter for WebSocket connections
export const wsRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // 100 events per minute
  message: {
    error: 'Too many WebSocket events',
  },
});