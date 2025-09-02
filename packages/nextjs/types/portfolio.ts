export interface TokenAllocation {
  symbol: string;
  name: string;
  percentage: number;
  color: string;
  image: string;
  amount: number;
}

export interface SharedPortfolio {
  id: string;
  name: string;
  author: {
    username: string;
    avatar: string;
    isVerified: boolean;
    followers: number;
  };
  type: "autoinvest" | "manual";
  presetType: string;
  totalInvestment: number;
  allocations: TokenAllocation[];
  performance: {
    totalValue: number;
    totalReturn: number;
    returnPercentage: number;
    dailyChange: number;
    dailyChangePercentage: number;
  };
  metrics: {
    likes: number;
    shares: number;
    bookmarks: number;
    comments: number;
  };
  strategy: {
    description: string;
    riskLevel: "conservative" | "moderate" | "aggressive";
    timeHorizon: string;
    rebalanceFrequency: string;
  };
  tags: string[];
  createdAt: string;
  isPublic: boolean;
  category: "defi" | "layer2" | "yield" | "growth" | "institutional";
}
