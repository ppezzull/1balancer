import { 
  TokenDto, 
  TokenSearchResponse, 
  ChartResponse, 
  LinesResponse, 
  CandlesResponse,
  TokenChartData,
  WalletBalances,
  TokenBalancesResponse,
  SwapQuote,
  ApiResponse,
  TokenWithBalance
} from '../types/api';

class ApiService {
  private baseUrl = 'https://api.1inch.io/v5.2';
  private cache = new Map<string, { data: any; expiry: number }>();
  private readonly cacheTimeout = 60000; // 1 minute

  // Cache management
  private getCachedData<T>(key: string): T | null {
    const cached = this.cache.get(key);
    if (cached && Date.now() < cached.expiry) {
      return cached.data;
    }
    this.cache.delete(key);
    return null;
  }

  private setCachedData<T>(key: string, data: T, customTimeout?: number): void {
    this.cache.set(key, {
      data,
      expiry: Date.now() + (customTimeout || this.cacheTimeout)
    });
  }

  // Token management
  async searchTokens(query: string, chainId: number = 1): Promise<TokenSearchResponse> {
    const cacheKey = `tokens_${chainId}_${query}`;
    const cached = this.getCachedData<TokenSearchResponse>(cacheKey);
    if (cached) return cached;

    try {
      // Mock implementation - replace with actual API call
      const mockTokens: TokenDto[] = this.generateMockTokens(query, chainId);
      
      const response: TokenSearchResponse = {
        success: true,
        data: mockTokens,
        timestamp: Date.now(),
        totalCount: mockTokens.length,
        hasMore: false
      };

      this.setCachedData(cacheKey, response);
      return response;
    } catch (error) {
      return {
        success: false,
        error: {
          statusCode: 500,
          message: 'Failed to search tokens',
          error: 'Internal Server Error'
        },
        timestamp: Date.now(),
        totalCount: 0,
        hasMore: false
      };
    }
  }

  async getTokenDetails(address: string, chainId: number = 1): Promise<ApiResponse<TokenDto>> {
    const cacheKey = `token_${chainId}_${address}`;
    const cached = this.getCachedData<ApiResponse<TokenDto>>(cacheKey);
    if (cached) return cached;

    try {
      // Mock implementation
      const mockToken = this.generateMockToken(address, chainId);
      
      const response: ApiResponse<TokenDto> = {
        success: true,
        data: mockToken,
        timestamp: Date.now()
      };

      this.setCachedData(cacheKey, response);
      return response;
    } catch (error) {
      return {
        success: false,
        error: {
          statusCode: 404,
          message: 'Token not found',
          error: 'Not Found'
        },
        timestamp: Date.now()
      };
    }
  }

  // Chart data management
  async getTokenChart(
    symbol: string, 
    timeframe: '1h' | '24h' | '7d' | '30d' | '1y' = '24h'
  ): Promise<ChartResponse> {
    const cacheKey = `chart_${symbol}_${timeframe}`;
    const cached = this.getCachedData<ChartResponse>(cacheKey);
    if (cached) return cached;

    try {
      const chartData = this.generateMockChartData(symbol, timeframe);
      
      const response: ChartResponse = {
        success: true,
        data: chartData,
        timestamp: Date.now(),
        cached: false
      };

      // Cache chart data for longer periods
      this.setCachedData(cacheKey, response, 300000); // 5 minutes
      return response;
    } catch (error) {
      return {
        success: false,
        error: {
          statusCode: 500,
          message: 'Failed to fetch chart data',
          error: 'Internal Server Error'
        },
        timestamp: Date.now(),
        cached: false
      };
    }
  }

  // Wallet balance management
  async getWalletBalances(
    walletAddress: string, 
    chainId: number = 1
  ): Promise<ApiResponse<WalletBalances>> {
    const cacheKey = `balances_${chainId}_${walletAddress}`;
    const cached = this.getCachedData<ApiResponse<WalletBalances>>(cacheKey);
    if (cached) return cached;

    try {
      const mockBalances = this.generateMockWalletBalances(walletAddress, chainId);
      
      const response: ApiResponse<WalletBalances> = {
        success: true,
        data: mockBalances,
        timestamp: Date.now()
      };

      this.setCachedData(cacheKey, response, 30000); // 30 seconds for balance data
      return response;
    } catch (error) {
      return {
        success: false,
        error: {
          statusCode: 500,
          message: 'Failed to fetch wallet balances',
          error: 'Internal Server Error'
        },
        timestamp: Date.now()
      };
    }
  }

  // Swap quote management
  async getSwapQuote(
    fromToken: string,
    toToken: string,
    amount: string,
    chainId: number = 1
  ): Promise<ApiResponse<SwapQuote>> {
    try {
      // Mock implementation
      const mockQuote = this.generateMockSwapQuote(fromToken, toToken, amount, chainId);
      
      return {
        success: true,
        data: mockQuote,
        timestamp: Date.now()
      };
    } catch (error) {
      return {
        success: false,
        error: {
          statusCode: 500,
          message: 'Failed to get swap quote',
          error: 'Internal Server Error'
        },
        timestamp: Date.now()
      };
    }
  }

  // Mock data generators
  private generateMockTokens(query: string, chainId: number): TokenDto[] {
    const mockTokens = [
      'ETH', 'USDC', 'USDT', 'WBTC', 'UNI', 'LINK', 'AAVE', 'COMP',
      'MKR', 'SUSHI', 'CRV', 'YFI', 'SNX', 'BAL', 'MATIC', 'ATOM'
    ];

    return mockTokens
      .filter(symbol => 
        symbol.toLowerCase().includes(query.toLowerCase()) || 
        query.length === 0
      )
      .slice(0, 10)
      .map((symbol, index) => ({
        chainId,
        symbol,
        name: `${symbol} Token`,
        address: `0x${Math.random().toString(16).substr(2, 40)}`,
        decimals: 18,
        logoURI: `https://assets.coingecko.com/coins/images/${index + 1}/large/${symbol.toLowerCase()}.png`,
        rating: Math.floor(Math.random() * 5) + 1,
        eip2612: Math.random() > 0.5,
        isFoT: Math.random() > 0.8,
        tags: [
          {
            provider: 'coingecko',
            value: 'defi',
            providers: ['coingecko', '1inch']
          }
        ]
      }));
  }

  private generateMockToken(address: string, chainId: number): TokenDto {
    return {
      chainId,
      symbol: 'MOCK',
      name: 'Mock Token',
      address,
      decimals: 18,
      logoURI: 'https://assets.coingecko.com/coins/images/1/large/bitcoin.png',
      rating: 4,
      eip2612: true,
      isFoT: false,
      tags: [
        {
          provider: 'coingecko',
          value: 'defi',
          providers: ['coingecko', '1inch']
        }
      ]
    };
  }

  private generateMockChartData(symbol: string, timeframe: string): TokenChartData {
    const points = this.getTimeframePoints(timeframe);
    const basePrice = Math.random() * 1000 + 100;
    const lines: LinesResponse = {
      data: Array.from({ length: points }, (_, i) => ({
        time: Date.now() - (points - i) * this.getTimeframeInterval(timeframe),
        value: basePrice + (Math.random() - 0.5) * basePrice * 0.1 * Math.sin(i / 10)
      }))
    };

    return {
      symbol,
      timeframe: timeframe as any,
      lines,
      lastUpdated: Date.now()
    };
  }

  private generateMockWalletBalances(walletAddress: string, chainId: number): WalletBalances {
    const tokens: TokenBalancesResponse = {
      '0xA0b86a33E6b1F3dD12f848f5a1da5b8Cf3e4D88F': (Math.random() * 10).toFixed(6), // ETH
      '0xA0b86a33E6b1F3dD12f848f5a1da5b8Cf3e4D88G': (Math.random() * 1000).toFixed(2), // USDC
      '0xA0b86a33E6b1F3dD12f848f5a1da5b8Cf3e4D88H': (Math.random() * 500).toFixed(2), // USDT
    };

    return {
      wallet: walletAddress,
      chainId,
      tokens,
      totalUSD: Object.values(tokens).reduce((sum, balance) => 
        sum + parseFloat(balance) * (Math.random() * 2000 + 100), 0
      ),
      lastUpdated: Date.now()
    };
  }

  private generateMockSwapQuote(
    fromToken: string, 
    toToken: string, 
    amount: string, 
    chainId: number
  ): SwapQuote {
    const fromTokenData = this.generateMockToken(fromToken, chainId);
    const toTokenData = this.generateMockToken(toToken, chainId);
    
    return {
      fromToken: fromTokenData,
      toToken: toTokenData,
      fromAmount: amount,
      toAmount: (parseFloat(amount) * (0.95 + Math.random() * 0.1)).toFixed(6),
      price: (0.95 + Math.random() * 0.1).toFixed(6),
      priceImpact: Math.random() * 2,
      gas: (Math.random() * 100000 + 50000).toFixed(0),
      protocols: ['1inch', 'Uniswap V3', 'SushiSwap']
    };
  }

  private getTimeframePoints(timeframe: string): number {
    switch (timeframe) {
      case '1h': return 60;
      case '24h': return 24;
      case '7d': return 168;
      case '30d': return 720;
      case '1y': return 365;
      default: return 24;
    }
  }

  private getTimeframeInterval(timeframe: string): number {
    switch (timeframe) {
      case '1h': return 60000; // 1 minute
      case '24h': return 3600000; // 1 hour
      case '7d': return 3600000; // 1 hour
      case '30d': return 3600000; // 1 hour
      case '1y': return 86400000; // 1 day
      default: return 3600000;
    }
  }

  // Utility methods
  clearCache(): void {
    this.cache.clear();
  }

  getCacheSize(): number {
    return this.cache.size;
  }
}

export const apiService = new ApiService();
export default apiService;