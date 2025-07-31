import { PortfolioAllocation, PerformanceDataPoint, SharedPortfolio, TokenAllocation } from '../../types/database';

// Portfolio Distribution Data for Charts
export const PORTFOLIO_DATA: PortfolioAllocation[] = [
  { name: "Ethereum", symbol: "ETH", value: 45, amount: "2.5 ETH", color: "#627EEA", percentage: 45 },
  { name: "USDC", symbol: "USDC", value: 25, amount: "5,000 USDC", color: "#2775CA", percentage: 25 },
  { name: "Uniswap", symbol: "UNI", value: 10, amount: "125 UNI", color: "#FF007A", percentage: 10 },
  { name: "Aave", symbol: "AAVE", value: 12, amount: "15.5 AAVE", color: "#B6509E", percentage: 12 },
  { name: "Chainlink", symbol: "LINK", value: 8, amount: "85.2 LINK", color: "#375BD2", percentage: 8 }
];

// Performance Chart Data
export const PERFORMANCE_DATA: PerformanceDataPoint[] = [
  { date: "Jan", value: 15000, change: 0, changePercentage: 0 },
  { date: "Feb", value: 18500, change: 3500, changePercentage: 23.33 },
  { date: "Mar", value: 22000, change: 3500, changePercentage: 18.92 },
  { date: "Apr", value: 28500, change: 6500, changePercentage: 29.55 },
  { date: "May", value: 32000, change: 3500, changePercentage: 12.28 },
  { date: "Jun", value: 29500, change: -2500, changePercentage: -7.81 },
  { date: "Jul", value: 35000, change: 5500, changePercentage: 18.64 },
  { date: "Aug", value: 42000, change: 7000, changePercentage: 20.00 },
  { date: "Sep", value: 38500, change: -3500, changePercentage: -8.33 },
  { date: "Oct", value: 45000, change: 6500, changePercentage: 16.88 },
  { date: "Nov", value: 42985, change: -2015, changePercentage: -4.48 },
  { date: "Dec", value: 46500, change: 3515, changePercentage: 8.18 }
];

// Sample Shared Portfolios Data
export const SHARED_PORTFOLIOS: SharedPortfolio[] = [
  {
    id: "portfolio-1",
    name: "DeFi Blue Chips",
    description: "Conservative DeFi portfolio focused on established protocols",
    author: {
      id: "user-1",
      username: "DeFiMaster",
      avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=32&h=32&fit=crop&crop=face",
      isVerified: true,
      followers: 1250,
      following: 89,
      portfoliosCreated: 12,
      totalValue: 500000,
      joinedAt: "2023-01-15"
    },
    type: "drift",
    presetType: "Conservative DeFi",
    totalInvestment: 50000,
    allocations: [
      {
        symbol: "ETH",
        name: "Ethereum",
        percentage: 40,
        color: "#627EEA",
        image: "https://cryptologos.cc/logos/ethereum-eth-logo.png",
        amount: 20000,
        value: 22000
      },
      {
        symbol: "USDC",
        name: "USD Coin",
        percentage: 30,
        color: "#2775CA",
        image: "https://cryptologos.cc/logos/usd-coin-usdc-logo.png",
        amount: 15000,
        value: 15000
      },
      {
        symbol: "AAVE",
        name: "Aave",
        percentage: 15,
        color: "#B6509E",
        image: "https://cryptologos.cc/logos/aave-aave-logo.png",
        amount: 7500,
        value: 8200
      },
      {
        symbol: "UNI",
        name: "Uniswap",
        percentage: 15,
        color: "#FF007A",
        image: "https://cryptologos.cc/logos/uniswap-uni-logo.png",
        amount: 7500,
        value: 8100
      }
    ],
    performance: {
      totalValue: 53300,
      totalReturn: 3300,
      returnPercentage: 6.6,
      dailyChange: 234.56,
      dailyChangePercentage: 0.44,
      weeklyChange: 1200,
      monthlyChange: 2100,
      yearlyChange: 8900,
      maxDrawdown: -12.5,
      sharpeRatio: 1.24,
      volatility: 18.5
    },
    metrics: {
      likes: 324,
      shares: 89,
      bookmarks: 156,
      comments: 45,
      copiers: 67
    },
    strategy: {
      description: "Focus on established DeFi protocols with strong fundamentals and consistent yields. Rebalanced monthly to maintain target allocations.",
      riskLevel: "conservative",
      timeHorizon: "12-24 months",
      rebalanceFrequency: "Monthly",
      targetReturn: 12,
      maxDrawdown: 15
    },
    tags: ["DeFi", "Conservative", "Blue Chip", "Yield"],
    createdAt: "2024-01-15T10:30:00Z",
    updatedAt: "2024-01-28T14:22:00Z",
    isPublic: true,
    category: "defi",
    minimumInvestment: 1000,
    fees: {
      managementFee: 0.5,
      performanceFee: 10
    }
  },
  {
    id: "portfolio-2", 
    name: "Layer 2 Growth",
    description: "High-growth portfolio focused on Layer 2 scaling solutions",
    author: {
      id: "user-2",
      username: "L2Expert",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=32&h=32&fit=crop&crop=face",
      isVerified: true,
      followers: 890,
      following: 234,
      portfoliosCreated: 8,
      totalValue: 350000,
      joinedAt: "2023-03-20"
    },
    type: "time",
    presetType: "Growth",
    totalInvestment: 25000,
    allocations: [
      {
        symbol: "ARB",
        name: "Arbitrum",
        percentage: 35,
        color: "#28A0F0",
        image: "https://cryptologos.cc/logos/arbitrum-arb-logo.png",
        amount: 8750,
        value: 10200
      },
      {
        symbol: "OP",
        name: "Optimism",
        percentage: 30,
        color: "#FF0420",
        image: "https://cryptologos.cc/logos/optimism-ethereum-op-logo.png",
        amount: 7500,
        value: 8900
      },
      {
        symbol: "MATIC",
        name: "Polygon",
        percentage: 25,
        color: "#8247E5",
        image: "https://cryptologos.cc/logos/polygon-matic-logo.png",
        amount: 6250,
        value: 7100
      },
      {
        symbol: "ETH",
        name: "Ethereum",
        percentage: 10,
        color: "#627EEA",
        image: "https://cryptologos.cc/logos/ethereum-eth-logo.png",
        amount: 2500,
        value: 2800
      }
    ],
    performance: {
      totalValue: 29000,
      totalReturn: 4000,
      returnPercentage: 16.0,
      dailyChange: 456.78,
      dailyChangePercentage: 1.6,
      weeklyChange: 2300,
      monthlyChange: 3800,
      yearlyChange: 12500,
      maxDrawdown: -25.2,
      sharpeRatio: 0.89,
      volatility: 35.2
    },
    metrics: {
      likes: 567,
      shares: 123,
      bookmarks: 234,
      comments: 78,
      copiers: 145
    },
    strategy: {
      description: "Aggressive growth strategy targeting Layer 2 ecosystem tokens with high upside potential. Active rebalancing based on market conditions.",
      riskLevel: "aggressive",
      timeHorizon: "6-18 months",
      rebalanceFrequency: "Weekly",
      targetReturn: 25,
      maxDrawdown: 30
    },
    tags: ["Layer2", "Growth", "Scaling", "High Risk"],
    createdAt: "2024-01-10T09:15:00Z",
    updatedAt: "2024-01-29T11:45:00Z",
    isPublic: true,
    category: "layer2",
    minimumInvestment: 500,
    fees: {
      managementFee: 1.0,
      performanceFee: 15
    }
  }
];

// Portfolio Management Functions
export const getPortfolioById = (id: string): SharedPortfolio | undefined => {
  return SHARED_PORTFOLIOS.find(portfolio => portfolio.id === id);
};

export const getPortfoliosByCategory = (category: string): SharedPortfolio[] => {
  return SHARED_PORTFOLIOS.filter(portfolio => portfolio.category === category);
};

export const getPortfoliosByRiskLevel = (riskLevel: string): SharedPortfolio[] => {
  return SHARED_PORTFOLIOS.filter(portfolio => portfolio.strategy.riskLevel === riskLevel);
};

export const getTopPerformingPortfolios = (limit: number = 10): SharedPortfolio[] => {
  return SHARED_PORTFOLIOS
    .sort((a, b) => b.performance.returnPercentage - a.performance.returnPercentage)
    .slice(0, limit);
};

export const calculatePortfolioValue = (allocations: TokenAllocation[]): number => {
  return allocations.reduce((total, allocation) => total + (allocation.value || allocation.amount), 0);
};

export const calculatePortfolioReturn = (currentValue: number, initialInvestment: number): { 
  absoluteReturn: number; 
  percentageReturn: number; 
} => {
  const absoluteReturn = currentValue - initialInvestment;
  const percentageReturn = (absoluteReturn / initialInvestment) * 100;
  
  return { absoluteReturn, percentageReturn };
};