// Core Database Types for 1Balancer Application

export type NetworkId = "all" | "ethereum" | "polygon" | "arbitrum" | "optimism" | "base";
export type Timeframe = "1D" | "1W" | "1M" | "3M" | "1Y";
export type TokenFilter = "All" | "DeFi" | "Layer2" | "Yield";

// Portfolio and Token Types
export interface TokenHolding {
  symbol: string;
  name: string;
  balance: string;
  price: string;
  value: string;
  pnl: string;
  roi: string;
  isPositive: boolean;
  network: string;
  logo?: string;
  address?: string;
}

export interface PortfolioAllocation {
  name: string;
  symbol: string;
  value: number;
  amount: string;
  color: string;
  percentage: number;
}

export interface PerformanceDataPoint {
  date: string;
  value: number;
  change?: number;
  changePercentage?: number;
}

// User and Wallet Types
export interface WalletConfig {
  address: string;
  totalValue: string;
  fullAddress: string;
  isConnected: boolean;
  network: NetworkId;
}

export interface UserProfile {
  id: string;
  username: string;
  email?: string;
  avatar?: string;
  isVerified: boolean;
  followers: number;
  following: number;
  portfoliosCreated: number;
  totalValue: number;
  joinedAt: string;
}

// Portfolio Types
export interface TokenAllocation {
  symbol: string;
  name: string;
  percentage: number;
  color: string;
  image: string;
  amount: number;
  value?: number;
  address?: string;
}

export interface PortfolioStrategy {
  description: string;
  riskLevel: 'conservative' | 'moderate' | 'aggressive';
  timeHorizon: string;
  rebalanceFrequency: string;
  targetReturn?: number;
  maxDrawdown?: number;
}

export interface PortfolioMetrics {
  likes: number;
  shares: number;
  bookmarks: number;
  comments: number;
  copiers?: number;
  totalValue?: number;
}

export interface PortfolioPerformance {
  totalValue: number;
  totalReturn: number;
  returnPercentage: number;
  dailyChange: number;
  dailyChangePercentage: number;
  weeklyChange?: number;
  monthlyChange?: number;
  yearlyChange?: number;
  maxDrawdown?: number;
  sharpeRatio?: number;
  volatility?: number;
}

export interface SharedPortfolio {
  id: string;
  name: string;
  description?: string;
  author: UserProfile;
  type: 'drift' | 'time';
  presetType: string;
  totalInvestment: number;
  allocations: TokenAllocation[];
  performance: PortfolioPerformance;
  metrics: PortfolioMetrics;
  strategy: PortfolioStrategy;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  isPublic: boolean;
  category: 'defi' | 'layer2' | 'yield' | 'growth' | 'institutional' | 'conservative';
  minimumInvestment?: number;
  fees?: {
    managementFee: number;
    performanceFee: number;
  };
}

// Market Data Types
export interface MarketData {
  symbol: string;
  name: string;
  price: number;
  change24h: number;
  changePercentage24h: number;
  volume24h: number;
  marketCap: number;
  supply: {
    circulating: number;
    total: number;
    max?: number;
  };
  logo: string;
  rank: number;
}

export interface CryptoPrice {
  symbol: string;
  price: number;
  change24h: number;
  changePercentage24h: number;
  lastUpdated: string;
}

// Rebalancing Types
export interface RebalanceConfig {
  enabled: boolean;
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly';
  threshold: number; // percentage drift threshold
  method: 'proportional' | 'threshold' | 'calendar';
  slippageTolerance: number;
  gasOptimization: boolean;
}

export interface RebalanceHistory {
  id: string;
  portfolioId: string;
  timestamp: string;
  type: 'automatic' | 'manual';
  changes: {
    from: TokenAllocation[];
    to: TokenAllocation[];
  };
  costs: {
    gas: number;
    slippage: number;
    fees: number;
  };
  status: 'pending' | 'completed' | 'failed';
  transactionHash?: string;
}

// Analytics Types
export interface AnalyticsData {
  portfolioId: string;
  timeframe: Timeframe;
  metrics: {
    totalReturn: number;
    volatility: number;
    sharpeRatio: number;
    maxDrawdown: number;
    winRate: number;
    alpha: number;
    beta: number;
  };
  benchmark?: {
    name: string;
    performance: PerformanceDataPoint[];
  };
  riskMetrics: {
    var95: number; // Value at Risk
    var99: number;
    expectedShortfall: number;
    beta: number;
    correlation: number;
  };
}

// Transaction Types
export interface Transaction {
  id: string;
  hash: string;
  type: 'buy' | 'sell' | 'rebalance' | 'deposit' | 'withdraw';
  timestamp: string;
  amount: number;
  symbol: string;
  price: number;
  value: number;
  fees: number;
  status: 'pending' | 'confirmed' | 'failed';
  network: NetworkId;
  gasUsed?: number;
  gasPrice?: number;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
  timestamp: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// Storage Types for SSR
export interface StorageConfig {
  portfolios: SharedPortfolio[];
  tokenHoldings: TokenHolding[];
  marketData: MarketData[];
  performanceData: PerformanceDataPoint[];
  walletConfig: WalletConfig;
  userProfile?: UserProfile;
  rebalanceHistory: RebalanceHistory[];
  lastUpdated: string;
}