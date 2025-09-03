import {
  BadRequestErrorDto,
  CustomTokensAndWalletsRequest,
  CustomTokensRequest,
  MultiWalletBalancesResponse,
  TokenBalancesResponse,
} from "./token";
import { CandlesResponse, Line, LinesResponse } from "./tokenCharts";

// ...existing code...
export interface TokenDto {
  chainId: number;
  symbol: string;
  name: string;
  address: string;
  decimals: number;
  logoURI: string;
  rating: number;
  eip2612: boolean;
  isFoT: boolean;
  tags: Array<{ provider: string; tag: string }>;
}

export interface Comment {
  id: string;
  author: string;
  avatar?: string;
  content: string;
  createdAt: string;
  likes?: number;
  replies?: Comment[];
}

export interface TokenAllocation {
  symbol: string;
  name?: string;
  percentage: number;
  amount?: number;
  color?: string;
  image?: string;
  // Optional protection metadata used by the UI (not all sources provide this)
  isProtected?: boolean;
  minPercentage?: number;
}

export interface ChartDataPoint {
  time: number;
  value: number;
  formattedTime?: string;
  percentageChange?: number;
}

// Reuse and extend existing token/chart types
export type TokenWithBalance = TokenDto & {
  balance?: string;
  balanceUSD?: number;
  priceUSD?: number;
  change24h?: number;
  isProtected?: boolean;
  minPercentage?: number;
};

export interface ChartDataPoint extends Line {
  formattedTime?: string;
  percentageChange?: number;
}

// Additional interfaces added above

export interface TokenChartData {
  symbol: string;
  timeframe: "1h" | "24h" | "7d" | "30d" | "1y";
  lines: LinesResponse;
  candles?: CandlesResponse;
  lastUpdated: number;
}

export interface PortfolioToken extends TokenWithBalance {
  allocation?: number;
  targetAmount?: number;
  currentAmount?: number;
  needsRebalancing?: boolean;
}

// Re-export commonly used request/response types from token.ts
export type {
  BadRequestErrorDto,
  CustomTokensRequest,
  CustomTokensAndWalletsRequest,
  TokenBalancesResponse,
  MultiWalletBalancesResponse,
};

// API Response wrappers
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: BadRequestErrorDto;
  timestamp: number;
}

export interface TokenSearchResponse extends ApiResponse<TokenDto[]> {
  totalCount: number;
  hasMore: boolean;
}

export interface ChartResponse extends ApiResponse<TokenChartData> {
  cached: boolean;
  cacheExpiry?: number;
}

// Wallet integration types
export interface WalletConnection {
  address: string;
  chainId: number;
  isConnected: boolean;
  provider: "metamask" | "walletconnect" | "coinbase" | "other";
}

export interface WalletBalances {
  wallet: string;
  chainId: number;
  tokens: TokenBalancesResponse;
  totalUSD: number;
  lastUpdated: number;
}

// Trading types
export interface SwapQuote {
  fromToken: TokenDto;
  toToken: TokenDto;
  fromAmount: string;
  toAmount: string;
  price: string;
  priceImpact: number;
  gas: string;
  protocols: string[];
}

export interface SwapTransaction {
  quote: SwapQuote;
  transactionHash?: string;
  status: "pending" | "confirmed" | "failed";
  timestamp: number;
}
