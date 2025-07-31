// Re-export types from various modules
export * from '../core/SessionManager';
export * from '../core/DutchAuctionSimulator';
export * from '../core/SecretManager';

// Additional common types
export interface Chain {
  id: string;
  name: string;
  rpcUrl: string;
  chainId: number;
}

export interface Token {
  address: string;
  symbol: string;
  decimals: number;
  chain: string;
}

export interface SwapPair {
  source: Token;
  destination: Token;
  rate?: string;
}

export interface OrderMetadata {
  sessionId: string;
  orderHash: string;
  limitOrder: any;
  signature: string;
  createdAt: number;
}

export interface EventData {
  chain: string;
  contractAddress: string;
  eventName: string;
  args: any;
  blockNumber: number;
  transactionHash: string;
  timestamp: number;
}

export interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  uptime: number;
  timestamp: string;
  connections: {
    [service: string]: boolean;
  };
  metrics?: any;
  errors?: string[];
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  metadata?: {
    timestamp: number;
    requestId: string;
  };
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

export interface WebSocketMessage {
  type: string;
  payload: any;
  timestamp: number;
  id?: string;
}

export interface AuthPayload {
  apiKey?: string;
  token?: string;
  userId?: string;
  permissions?: string[];
}

export enum LogLevel {
  ERROR = 'error',
  WARN = 'warn',
  INFO = 'info',
  DEBUG = 'debug',
}

export interface LogEntry {
  level: LogLevel;
  message: string;
  module: string;
  timestamp: string;
  metadata?: any;
}

// Contract interfaces
export interface ImmutablesStruct {
  maker: string;
  taker: string;
  token: string;
  amount: string;
  safetyDeposit: string;
  hashlockHash: string;
  timelocks: TimelocksStruct;
  orderHash: string;
  chainId: number;
}

export interface TimelocksStruct {
  srcWithdrawal: number;
  srcPublicWithdrawal: number;
  srcCancellation: number;
  srcDeployedAt: number;
  dstWithdrawal: number;
  dstCancellation: number;
  dstDeployedAt: number;
}

// 1inch types
export interface LimitOrderStruct {
  salt: string;
  maker: string;
  receiver: string;
  makerAsset: string;
  takerAsset: string;
  makingAmount: string;
  takingAmount: string;
  makerTraits: string;
}

export interface OrderSignature {
  r: string;
  vs: string;
}

// NEAR types
export interface NearAccount {
  accountId: string;
  publicKey?: string;
  balance?: string;
}

export interface NearTransaction {
  signerId: string;
  receiverId: string;
  actions: NearAction[];
  nonce?: number;
  blockHash?: string;
}

export interface NearAction {
  type: 'Transfer' | 'FunctionCall' | 'CreateAccount' | 'DeployContract';
  params: any;
}

// Error types
export class OrchestrationError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500,
    public details?: any
  ) {
    super(message);
    this.name = 'OrchestrationError';
  }
}

export class ValidationError extends OrchestrationError {
  constructor(message: string, details?: any) {
    super(message, 'VALIDATION_ERROR', 400, details);
    this.name = 'ValidationError';
  }
}

export class NotFoundError extends OrchestrationError {
  constructor(resource: string) {
    super(`${resource} not found`, 'NOT_FOUND', 404);
    this.name = 'NotFoundError';
  }
}

export class UnauthorizedError extends OrchestrationError {
  constructor(message = 'Unauthorized') {
    super(message, 'UNAUTHORIZED', 401);
    this.name = 'UnauthorizedError';
  }
}

export class ConflictError extends OrchestrationError {
  constructor(message: string) {
    super(message, 'CONFLICT', 409);
    this.name = 'ConflictError';
  }
}