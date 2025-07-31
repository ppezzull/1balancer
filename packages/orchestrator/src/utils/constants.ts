// Common constants used throughout the orchestration service

export const CHAINS = {
  BASE: 'base',
  ETHEREUM: 'ethereum',
  POLYGON: 'polygon',
  NEAR: 'near',
} as const;

export const CHAIN_IDS = {
  BASE_MAINNET: 8453,
  BASE_SEPOLIA: 84532,
  ETHEREUM_MAINNET: 1,
  ETHEREUM_SEPOLIA: 11155111,
  POLYGON_MAINNET: 137,
  POLYGON_MUMBAI: 80001,
} as const;

export const TOKEN_ADDRESSES = {
  // BASE Sepolia
  BASE_USDC: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
  BASE_WETH: '0x4200000000000000000000000000000000000006',
  
  // NEAR
  NEAR_USDT: 'usdt.near',
  NEAR_USDC: 'usdc.near',
  NEAR_WNEAR: 'wrap.near',
} as const;

export const SESSION_STATES = {
  INITIALIZED: 'initialized',
  EXECUTING: 'executing',
  SOURCE_LOCKING: 'source_locking',
  SOURCE_LOCKED: 'source_locked',
  DESTINATION_LOCKING: 'destination_locking',
  BOTH_LOCKED: 'both_locked',
  REVEALING_SECRET: 'revealing_secret',
  COMPLETED: 'completed',
  CANCELLING: 'cancelling',
  CANCELLED: 'cancelled',
  FAILED: 'failed',
  TIMEOUT: 'timeout',
  REFUNDING: 'refunding',
  REFUNDED: 'refunded',
} as const;

export const WEBSOCKET_EVENTS = {
  // Client -> Server
  AUTH: 'auth',
  SUBSCRIBE: 'subscribe',
  UNSUBSCRIBE: 'unsubscribe',
  
  // Server -> Client
  CONNECTED: 'connected',
  AUTHENTICATED: 'authenticated',
  SUBSCRIBED: 'subscribed',
  UNSUBSCRIBED: 'unsubscribed',
  SESSION_UPDATE: 'session_update',
  SESSION_SNAPSHOT: 'session_snapshot',
  PRICE_UPDATE: 'price_update',
  ALERT: 'alert',
  ERROR: 'error',
} as const;

export const TIMEOUTS = {
  SOURCE_WITHDRAWAL: 300, // 5 minutes
  SOURCE_PUBLIC_WITHDRAWAL: 600, // 10 minutes
  SOURCE_CANCELLATION: 900, // 15 minutes
  DESTINATION_WITHDRAWAL: 240, // 4 minutes
  DESTINATION_CANCELLATION: 840, // 14 minutes
  SESSION_EXPIRATION: 7200, // 2 hours
} as const;

export const FEES = {
  PROTOCOL_BASIS_POINTS: 30, // 0.3%
  NETWORK: {
    BASE: '0.001', // ETH
    ETHEREUM: '0.005', // ETH
    POLYGON: '0.01', // MATIC
    NEAR: '0.01', // NEAR
  },
} as const;

export const ERROR_CODES = {
  // General errors
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  CONFLICT: 'CONFLICT',
  TOO_MANY_REQUESTS: 'TOO_MANY_REQUESTS',
  
  // Session errors
  SESSION_NOT_FOUND: 'SESSION_NOT_FOUND',
  SESSION_EXPIRED: 'SESSION_EXPIRED',
  SESSION_INVALID_STATE: 'SESSION_INVALID_STATE',
  SESSION_LIMIT_REACHED: 'SESSION_LIMIT_REACHED',
  
  // Swap errors
  SWAP_FAILED: 'SWAP_FAILED',
  INSUFFICIENT_BALANCE: 'INSUFFICIENT_BALANCE',
  SLIPPAGE_EXCEEDED: 'SLIPPAGE_EXCEEDED',
  
  // Chain errors
  CHAIN_CONNECTION_FAILED: 'CHAIN_CONNECTION_FAILED',
  TRANSACTION_FAILED: 'TRANSACTION_FAILED',
  BLOCK_NOT_FOUND: 'BLOCK_NOT_FOUND',
  
  // Secret errors
  SECRET_NOT_FOUND: 'SECRET_NOT_FOUND',
  SECRET_ALREADY_REVEALED: 'SECRET_ALREADY_REVEALED',
  SECRET_EXPIRED: 'SECRET_EXPIRED',
  SECRET_MISMATCH: 'SECRET_MISMATCH',
} as const;

export const DUTCH_AUCTION = {
  DEFAULT_DURATION_SECONDS: 300, // 5 minutes
  URGENCY_MULTIPLIERS: {
    fast: 0.5,
    normal: 1.0,
    slow: 2.0,
  },
  PRICE_IMPACT_THRESHOLDS: {
    SMALL: 10000, // < $10k: 0.1%
    MEDIUM: 100000, // < $100k: 0.3%
    LARGE: 1000000, // < $1M: 0.5%
  },
  PRICE_IMPACTS: {
    SMALL: 0.001, // 0.1%
    MEDIUM: 0.003, // 0.3%
    LARGE: 0.005, // 0.5%
    XLARGE: 0.01, // 1%
  },
} as const;

// Type helpers
export type Chain = typeof CHAINS[keyof typeof CHAINS];
export type SessionState = typeof SESSION_STATES[keyof typeof SESSION_STATES];
export type WebSocketEvent = typeof WEBSOCKET_EVENTS[keyof typeof WEBSOCKET_EVENTS];
export type ErrorCode = typeof ERROR_CODES[keyof typeof ERROR_CODES];