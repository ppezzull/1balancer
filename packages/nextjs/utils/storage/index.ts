// Main Storage Index - Centralized Data Management for 1Balancer
// This file provides a clean SSR-compatible interface for all application data

// Re-export all storage modules
export * from './tokens';
export * from './portfolio';
export * from './user';

// Import types for SSR data structure
import { StorageConfig, PerformanceDataPoint } from '../../types/database';
import { TOKEN_HOLDINGS, CRYPTOCURRENCY_DATA, CURRENT_PRICES } from './tokens';
import { PORTFOLIO_DATA, PERFORMANCE_DATA, SHARED_PORTFOLIOS } from './portfolio';
import { WALLET_CONFIG, DEFAULT_USER_PROFILE } from './user';

// SSR Data Fetching Functions
export async function getServerSidePortfolioData(): Promise<StorageConfig> {
  // Simulate server-side data fetching
  // In a real app, this would fetch from your database/API
  
  return {
    portfolios: SHARED_PORTFOLIOS,
    tokenHoldings: TOKEN_HOLDINGS,
    marketData: CRYPTOCURRENCY_DATA,
    performanceData: PERFORMANCE_DATA,
    walletConfig: WALLET_CONFIG,
    userProfile: DEFAULT_USER_PROFILE,
    rebalanceHistory: [], // Would be fetched from API
    lastUpdated: new Date().toISOString()
  };
}

export async function getServerSideMarketData() {
  // Simulate API call to get real-time market data
  return {
    prices: CURRENT_PRICES,
    marketData: CRYPTOCURRENCY_DATA,
    lastUpdated: new Date().toISOString()
  };
}

export async function getServerSideUserData(userId?: string) {
  // Simulate user-specific data fetching
  return {
    profile: DEFAULT_USER_PROFILE,
    walletConfig: WALLET_CONFIG,
    settings: {}, // User settings would be fetched here
    lastUpdated: new Date().toISOString()
  };
}

// Client-side data fetching hooks compatibility
export function usePortfolioData() {
  // This would be implemented as a React hook for client-side usage
  return {
    portfolios: SHARED_PORTFOLIOS,
    loading: false,
    error: null,
    refetch: () => Promise.resolve()
  };
}

export function useMarketData() {
  return {
    data: CRYPTOCURRENCY_DATA,
    prices: CURRENT_PRICES,
    loading: false,
    error: null,
    refetch: () => Promise.resolve()
  };
}

export function useUserData() {
  return {
    profile: DEFAULT_USER_PROFILE,
    walletConfig: WALLET_CONFIG,
    loading: false,
    error: null,
    refetch: () => Promise.resolve()
  };
}

// Data validation and transformation utilities
export function validateStorageData(data: Partial<StorageConfig>): data is StorageConfig {
  return !!(
    data.portfolios &&
    data.tokenHoldings &&
    data.marketData &&
    data.performanceData &&
    data.walletConfig &&
    data.lastUpdated
  );
}

export function transformStorageData(data: StorageConfig) {
  // Transform data for different UI components
  return {
    portfolioChartData: data.performanceData,
    tokenList: data.tokenHoldings,
    marketOverview: data.marketData.slice(0, 10), // Top 10 for overview
    walletSummary: {
      totalValue: data.walletConfig.totalValue,
      address: data.walletConfig.address,
      isConnected: data.walletConfig.isConnected
    }
  };
}

// Cache management for better performance
class DataCache {
  private cache = new Map();
  private ttl = 5 * 60 * 1000; // 5 minutes

  set(key: string, data: any) {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  get(key: string) {
    const item = this.cache.get(key);
    if (!item) return null;
    
    if (Date.now() - item.timestamp > this.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    return item.data;
  }

  clear() {
    this.cache.clear();
  }
}

export const dataCache = new DataCache();

// SSR-compatible data fetching with caching
export async function getDataWithCache(key: string, fetcher: () => Promise<any>) {
  // Check cache first
  const cached = dataCache.get(key);
  if (cached) return cached;
  
  // Fetch fresh data
  const data = await fetcher();
  dataCache.set(key, data);
  
  return data;
}

// Export constants for backward compatibility
export { TIMEFRAMES, TOKEN_FILTERS, NETWORKS, STORAGE_KEYS } from './user';
export { TOKEN_IMAGES, getTokenImage } from './tokens';
export { getPortfolioById, getTopPerformingPortfolios } from './portfolio';