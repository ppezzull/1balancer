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

// Page-specific data
export const homePageData = {
  hero: {
    title: "Rebalance Your Portfolio Automatically",
    subtitle: "The first non-custodial DeFi protocol for automated portfolio rebalancing. Set your strategy, maintain control, let smart contracts do the work.",
    features: ["Non-Custodial", "1inch Integration", "Automated"],
    badges: "Next-Gen DeFi Portfolio Management"
  },
  stats: {
    totalValueLocked: "$2.5M",
    totalRebalances: "12,450",
    activeUsers: "3,200",
    avgApy: "8.5%"
  }
};

export const aboutPageData = {
  sections: [
    {
      title: "Portfolio Management",
      description: "Connect your wallet, monitor balances, fund your portfolio, and withdraw assets directly from our smart contracts.",
      icon: "wallet"
    },
    {
      title: "Automated Rebalancing", 
      description: "Set target allocations and let our smart contracts automatically rebalance your portfolio based on market conditions.",
      icon: "refresh"
    },
    {
      title: "Top Performance Analysis",
      description: "Analyze top-performing strategies in /top-performers and adapt your approach based on successful portfolio configurations.",
      icon: "chart"
    }
  ],
  features: {
    security: "Advanced security protocols",
    automation: "Set-and-forget automation",
    analytics: "Real-time analytics dashboard"
  }
};

export const rebalancePageData = {
  cashIsKing: {
    title: "Cash is KING",
    subtitle: "Passive income generation.",
    description: "Utilizes micro-volatility to earn APY between 3-15% on stablecoins",
    minApy: 3,
    maxApy: 15,
    benefits: [
      { title: "Low Risk", desc: "Stablecoin focused", icon: "🛡️" },
      { title: "Micro-Volatility", desc: "Smart arbitrage", icon: "📈" },
      { title: "Passive Income", desc: "Automated earning", icon: "💰" }
    ]
  },
  features: [
    {
      title: "Automated",
      description: "Automatic rebalancing based on predefined thresholds",
      color: "from-emerald-400 via-cyan-400 to-indigo-500"
    },
    {
      title: "Intelligent", 
      description: "Real-time market analysis for optimal decisions",
      color: "from-blue-400 via-purple-400 to-pink-500"
    },
    {
      title: "Secure",
      description: "Advanced security protocols for your funds", 
      color: "from-green-400 via-teal-400 to-blue-500"
    }
  ],
  howItWorks: [
    { step: "1", title: "Set Targets", desc: "Define your ideal portfolio allocation" },
    { step: "2", title: "Monitor", desc: "AI continuously tracks market conditions" },
    { step: "3", title: "Analyze", desc: "Algorithm identifies rebalancing opportunities" },
    { step: "4", title: "Execute", desc: "Automated trades maintain your strategy" }
  ]
};

export const topPerformersPageData = {
  topPerformers: mockTopPerformers,
  timeframes: ["24h", "7d", "30d", "90d"],
  categories: ["All", "DeFi", "Layer 1", "Stablecoins", "NFT"],
  insights: {
    trendingUp: 12,
    trendingDown: 5,
    totalMarketCap: "$2.1T",
    dominance: "BTC: 42.5%"
  }
};

// Storage keys
export const STORAGE_KEYS = {
  USER_PREFERENCES: 'user_preferences',
  PORTFOLIO_CONFIG: 'portfolio_config', 
  THEME_SETTINGS: 'theme_settings',
  WALLET_CACHE: 'wallet_cache',
  CHART_SETTINGS: 'chart_settings',
  HOME_DATA: 'home_data',
  ABOUT_DATA: 'about_data', 
  REBALANCE_DATA: 'rebalance_data',
  TOP_PERFORMERS_DATA: 'top_performers_data'
} as const;

// SSR Data Fetching Functions
export const getHomeData = async () => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 100));
  return {
    ...homePageData,
    tokens: mockTokensWithBalance.slice(0, 3),
    chartData: mockChartData.slice(-7) // Last 7 days
  };
};

export const getAboutData = async () => {
  await new Promise(resolve => setTimeout(resolve, 150));
  return {
    ...aboutPageData,
    testimonials: [
      { name: "Alex Chen", role: "DeFi Trader", content: "1Balancer revolutionized my portfolio management" },
      { name: "Sarah Kim", role: "Crypto Investor", content: "Automated rebalancing saved me hours of manual work" }
    ]
  };
};

export const getRebalanceData = async () => {
  await new Promise(resolve => setTimeout(resolve, 120));
  return {
    ...rebalancePageData,
    portfolioStats: {
      totalRebalances: 1250,
      avgGains: "12.3%",
      riskReduction: "23%"
    }
  };
};

export const getTopPerformersData = async () => {
  await new Promise(resolve => setTimeout(resolve, 200));
  return {
    ...topPerformersPageData,
    marketTrends: {
      bullish: 67,
      bearish: 23,
      neutral: 10
    }
  };
};