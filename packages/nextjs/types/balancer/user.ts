// Unified User type (merges previous User and UserProfile)
export interface User {
  id?: string;
  username: string;
  avatar?: string;
  description?: string;
  joinDate?: string;
  followers?: number;
  totalPortfolios?: number;
  publicPortfolios?: number;
  totalInvestment?: number;
  bestPerformance?: number;
  isFirstTime?: boolean;
  profileUrl?: string;
}
