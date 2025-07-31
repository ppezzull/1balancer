import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../../config';
import { createLogger } from '../../utils/logger';

const logger = createLogger('auth-middleware');

export interface AuthRequest extends Request {
  apiKey?: string;
  userId?: string;
}

export function authenticate(req: AuthRequest, res: Response, next: NextFunction): void {
  try {
    // Check for API key in header
    const apiKey = req.headers['x-api-key'] as string;
    
    if (apiKey) {
      // Validate API key
      if (validateApiKey(apiKey)) {
        req.apiKey = apiKey;
        logger.debug('API key authentication successful');
        return next();
      } else {
        logger.warn('Invalid API key attempted', { apiKey: apiKey.substring(0, 8) + '...' });
        return res.status(401).json({ error: 'Invalid API key' });
      }
    }

    // Check for JWT token
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      
      try {
        const decoded = jwt.verify(token, config.security.jwtSecret) as any;
        req.userId = decoded.userId;
        logger.debug('JWT authentication successful', { userId: decoded.userId });
        return next();
      } catch (error) {
        logger.warn('Invalid JWT token', { error });
        return res.status(401).json({ error: 'Invalid token' });
      }
    }

    // No authentication provided
    logger.warn('No authentication provided');
    res.status(401).json({ error: 'Authentication required' });
  } catch (error) {
    logger.error('Authentication error', { error });
    res.status(500).json({ error: 'Authentication error' });
  }
}

function validateApiKey(apiKey: string): boolean {
  // In production, this would check against a database or cache
  // For demo, we'll use a simple comparison
  const validApiKeys = [
    config.security.apiKeySecret,
    'demo-api-key', // For testing
  ];
  
  return validApiKeys.includes(apiKey);
}

// Optional middleware for endpoints that don't require auth
export function optionalAuth(req: AuthRequest, res: Response, next: NextFunction): void {
  const apiKey = req.headers['x-api-key'] as string;
  const authHeader = req.headers.authorization;
  
  if (apiKey || authHeader) {
    return authenticate(req, res, next);
  }
  
  next();
}