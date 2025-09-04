// Social types for the social section component
import type { Portfolio } from "./portfolio";
import type { PortfolioPerformance } from "./portfolio";
import type { User } from "./user";

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

export interface SocialComment {
  id: string;
  userId: string;
  username: string;
  avatar?: string;
  content: string;
  timestamp: string;
  likes: number;
  isLiked: boolean;
}

export interface SocialUser extends User {
  isFollowing?: boolean;
  isVerified?: boolean;
  level?: string;
  bio?: string;
}

export interface SocialMetrics {
  likes: number;
  comments: number;
  shares: number;
  views: number;
  bookmarks: number;
}

export interface SocialEngagement {
  isLiked: boolean;
  isBookmarked: boolean;
  isShared: boolean;
}

export interface SocialTags {
  tags: string[];
  categories: string[];
}
