import { TokenDto } from "../1inch/token";
import { SocialMetrics } from "./social";
import { User } from "./user";

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

export interface PortfolioConfig {
  description?: string;
  // Strategy fields
  riskLevel?: "conservative" | "moderate" | "aggressive" | string;
  timeHorizon?: string;
  rebalanceFrequency?: "weekly" | "monthly" | "quarterly" | "semi-annual" | string;
  driftThresholdPct?: number;

  // Investment preset fields
  initialDeposit?: number;
  driftThreshold?: number;
  monthlyInvestment?: number;
  years?: number;
}

export interface Portfolio {
  id: string;
  name: string;
  author?: User;
  address?: string;
  type?: "drift" | "time" | string;
  presetType?: string;
  category?: string;
  tags?: string[];
  allocations: Allocation[];
  totalInvestment?: number;
  performance?: PortfolioPerformance | number;
  metrics?: SocialMetrics;
  // Unified configuration that includes both strategy and investment presets
  config?: PortfolioConfig;
  createdAt?: string;
  isPublic?: boolean;
  template?: string | null;
}
