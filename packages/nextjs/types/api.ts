export interface TagDto {
  provider: string;
  value: string;
  providers: string[];
}

export interface TokenDto {
  chainId: number;
  symbol: string;
  name: string;
  address: string;
  decimals: number;
  logoURI?: string;
  rating: number;
  eip2612?: boolean;
  isFoT?: boolean;
  tags: TagDto[];
}

export interface BadRequestErrorDto {
  statusCode: number;
  message: string;
  error: string;
}

export interface CustomTokensRequest {
  tokens: string[];
}

export interface CustomTokensAndWalletsRequest {
  tokens: string[];
  wallets: string[];
}

export type TokenBalancesResponse = Record<string, string>;

export type MultiWalletBalancesResponse = Record<string, Record<string, string>>;

export interface Line {
  time: number;
  value: number;
}

export interface LinesResponse {
  data: Line[];
}

export interface Candle {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
}

export interface CandlesResponse {
  data: Candle[];
}

// Extended interfaces for enhanced functionality
export interface TokenWithBalance extends TokenDto {
  balance?: string;
  balanceUSD?: number;
  priceUSD?: number;
  change24h?: number;
  isProtected?: boolean;
  minPercentage?: number;
}

export interface ChartDataPoint extends Line {
  formattedTime?: string;
  percentageChange?: number;
}

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
