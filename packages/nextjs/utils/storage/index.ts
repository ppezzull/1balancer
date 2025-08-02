import { TokenDto, TokenWithBalance, PortfolioToken, ChartDataPoint } from "../../types/api";

// Mock data for development and testing
export const mockTokens: TokenDto[] = [
  {
    chainId: 1,
    symbol: "ETH",
    name: "Ethereum",
    address: "0x0000000000000000000000000000000000000000",
    decimals: 18,
    logoURI: "https://tokens.1inch.io/0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee.png",
    rating: 5,
    eip2612: false,
    isFoT: false,
    tags: [
      {
        provider: "1inch",
        value: "native",
        providers: ["1inch"]
      }
    ]
  },
  {
    chainId: 1,
    symbol: "USDC",
    name: "USD Coin",
    address: "0xa0b86a33e6b7b3d8230b4f53e24b6067beb8aeb2",
    decimals: 6,
    logoURI: "https://tokens.1inch.io/0xa0b86a33e6b7b3d8230b4f53e24b6067beb8aeb2.png",
    rating: 5,
    eip2612: true,
    isFoT: false,
    tags: [
      {
        provider: "1inch",
        value: "stablecoin",
        providers: ["1inch"]
      }
    ]
  },
  {
    chainId: 1,
    symbol: "BTC",
    name: "Bitcoin",
    address: "0x2260fac5e5542a773aa44fbcfedf7c193bc2c599",
    decimals: 8,
    logoURI: "https://tokens.1inch.io/0x2260fac5e5542a773aa44fbcfedf7c193bc2c599.png",
    rating: 5,
    eip2612: false,
    isFoT: false,
    tags: [
      {
        provider: "1inch",
        value: "wrapped",
        providers: ["1inch"]
      }
    ]
  }
];

export const mockTokensWithBalance: TokenWithBalance[] = mockTokens.map((token, index) => ({
  ...token,
  balance: ["1000.00", "2500.50", "0.5"][index],
  balanceUSD: [3000, 2500.50, 30000][index],
  priceUSD: [3000, 1, 60000][index],
  change24h: [2.5, -0.1, 5.2][index],
  isProtected: index === 0,
  minPercentage: index === 0 ? 30 : undefined
}));

export const mockPortfolioTokens: PortfolioToken[] = mockTokensWithBalance.map((token, index) => ({
  ...token,
  allocation: [40, 35, 25][index],
  targetAmount: [40, 35, 25][index],
  currentAmount: [45, 30, 25][index],
  needsRebalancing: index < 2
}));

export const mockChartData: ChartDataPoint[] = Array.from({ length: 30 }, (_, i) => ({
  time: Date.now() - (29 - i) * 24 * 60 * 60 * 1000,
  value: 3000 + Math.random() * 500 - 250,
  formattedTime: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toLocaleDateString(),
  percentageChange: (Math.random() - 0.5) * 10
}));

export const mockTopPerformers: TokenWithBalance[] = [
  {
    ...mockTokens[0],
    balance: "1.5",
    balanceUSD: 4500,
    priceUSD: 3000,
    change24h: 15.2
  },
  {
    ...mockTokens[2],
    balance: "0.2",
    balanceUSD: 12000,
    priceUSD: 60000,
    change24h: 8.7
  },
  {
    chainId: 1,
    symbol: "LINK",
    name: "Chainlink",
    address: "0x514910771af9ca656af840dff83e8264ecf986ca",
    decimals: 18,
    logoURI: "https://tokens.1inch.io/0x514910771af9ca656af840dff83e8264ecf986ca.png",
    rating: 4,
    eip2612: false,
    isFoT: false,
    tags: [
      {
        provider: "1inch",
        value: "oracle",
        providers: ["1inch"]
      }
    ],
    balance: "500",
    balanceUSD: 7500,
    priceUSD: 15,
    change24h: 6.3
  }
];

// Storage utilities
export const getStorageItem = <T>(key: string, defaultValue: T): T => {
  if (typeof window === 'undefined') return defaultValue;
  
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.error(`Error reading ${key} from localStorage:`, error);
    return defaultValue;
  }
};

export const setStorageItem = <T>(key: string, value: T): void => {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Error writing ${key} to localStorage:`, error);
  }
};

export const removeStorageItem = (key: string): void => {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.error(`Error removing ${key} from localStorage:`, error);
  }
};

// Storage keys
export const STORAGE_KEYS = {
  USER_PREFERENCES: 'user_preferences',
  PORTFOLIO_CONFIG: 'portfolio_config',
  THEME_SETTINGS: 'theme_settings',
  WALLET_CACHE: 'wallet_cache',
  CHART_SETTINGS: 'chart_settings'
} as const;