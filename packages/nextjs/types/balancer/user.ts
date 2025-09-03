export interface User {
  username: string;
  avatar: string;
  followers: number;
  description: string;
  joinDate: string;
  totalPortfolios: number;
  publicPortfolios: number;
  totalInvestment: number;
  bestPerformance: number;
}

export interface UserProfile {
  id?: string;
  username: string;
  avatar?: string;
  description?: string;
  joinDate?: string;
  totalPortfolios?: number;
  publicPortfolios?: number;
  totalInvestment?: number;
  bestPerformance?: number;
  isFirstTime?: boolean;
  profileUrl?: string;
}
