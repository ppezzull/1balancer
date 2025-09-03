import { TokenDto } from "../1inch/token";
import { SocialComment, SocialEngagement, SocialMetrics, SocialUser } from "./social";
import { User } from "./user";

export interface SocialPortfolio {
  // The underlying portfolio object
  portfolio: Portfolio;

  // Who shared/owns this in the social context
  user: SocialUser;

  // Optional legacy token list in addition to normalized allocations
  tokens?: Array<{ symbol: string; percentage: number; amount: number }>;

  // Summary values (prefer portfolio.performance.totalValue when available)
  totalValue?: number;
  performance?: PortfolioPerformance | number; // legacy numeric supported

  // Discussion thread
  comments?: SocialComment[];

  // Engagement/counters live in portfolio.metrics and detailed booleans here
  engagement?: SocialEngagement;

  // Optional investment presets/config used in UI
  investmentType?: "drift" | "time";
  investmentConfig?: {
    initialDeposit?: number;
    monthlyInvestment?: number;
    years?: number;
  };
}

export interface Allocation {
  symbol: string;
  name?: string;
  percentage: number;
  amount?: number;
  color?: string;
  image?: string;
  token?: TokenDto | null;
}

export interface PortfolioPerformance {
  totalValue?: number;
  totalReturn?: number;
  returnPercentage?: number;
  dailyChange?: number;
  dailyChangePercentage?: number;
}

export type PortfolioMetrics = SocialMetrics;

export interface PortfolioStrategy {
  description?: string;
  riskLevel?: "conservative" | "moderate" | "aggressive" | string;
  timeHorizon?: string;
  rebalanceFrequency?: "weekly" | "monthly" | "quarterly" | "semi-annual" | string;
  driftThresholdPct?: number;
}

export interface Portfolio {
  id: string;
  name: string;
  author?: User;
  address?: string;
  isTemplate?: boolean;
  type?: "drift" | "time" | string;
  presetType?: string;
  category?: string;
  tags?: string[];
  allocations: Allocation[];
  totalInvestment?: number;
  performance?: PortfolioPerformance | number;
  metrics?: PortfolioMetrics;
  strategy?: PortfolioStrategy;
  createdAt?: string;
  isPublic?: boolean;
  template?: string | null;
  config?: {
    description?: string;
    initialDeposit?: number;
    driftThreshold?: number;
    rebalanceFrequency?: "weekly" | "monthly" | "quarterly" | "semi-annual";
  };
  // For backward compatibility with old storage shape
  rawTokens?: Array<{ symbol: string; percentage: number; amount: number }>;
}
