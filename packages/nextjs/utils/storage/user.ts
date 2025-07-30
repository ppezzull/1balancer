import { WalletConfig, UserProfile, NetworkId, Timeframe, TokenFilter } from '../../types/database';

// Networks Configuration
export const NETWORKS = [
  { id: "all" as NetworkId, name: "All Networks", icon: "🌐" },
  { id: "ethereum" as NetworkId, name: "Ethereum", icon: "⟠" },
  { id: "polygon" as NetworkId, name: "Polygon", icon: "🔷" },
  { id: "arbitrum" as NetworkId, name: "Arbitrum", icon: "🔵" },
  { id: "optimism" as NetworkId, name: "Optimism", icon: "🔴" },
  { id: "base" as NetworkId, name: "Base", icon: "🔵" }
];

// Timeframes for Charts and Analytics
export const TIMEFRAMES: Timeframe[] = ["1D", "1W", "1M", "3M", "1Y"];

// Token Filters for Portfolio Management
export const TOKEN_FILTERS: TokenFilter[] = ["All", "DeFi", "Layer2", "Yield"];

// Wallet Configuration
export const WALLET_CONFIG: WalletConfig = {
  address: "0xa235...bc3e",
  totalValue: "$42,985.23",
  fullAddress: "0xa235f8c2d4e7b9a1c3f5e8d9b2a4c6e8f1a3b5c7d9e2f4a6b8c1d3e5f7a9b2c4e6",
  isConnected: false,
  network: "ethereum"
};

// Sample User Profile
export const DEFAULT_USER_PROFILE: UserProfile = {
  id: "user-default",
  username: "PortfolioMaster",
  email: "user@1balancer.com",
  avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face",
  isVerified: true,
  followers: 1337,
  following: 256,
  portfoliosCreated: 15,
  totalValue: 125000,
  joinedAt: "2023-06-15T10:30:00Z"
};

// Site Assets Configuration
export const SITE_ASSETS = {
  logoImage: '/logo.png'
} as const;

// Site Images for Marketing and Content
export const SITE_IMAGES = {
  heroImage: "https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=800&h=600&fit=crop&crop=center&auto=format&q=80",
  aboutImage: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600&h=400&fit=crop&crop=center&auto=format&q=80",
  dashboardPreview: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1200&h=800&fit=crop&crop=center&auto=format&q=80",
  portfolioAnalytics: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&h=600&fit=crop&crop=center&auto=format&q=80"
} as const;

// Storage Keys for Local Storage
export const STORAGE_KEYS = {
  PORTFOLIO: 'userPortfolios',
  USER_PROFILE: 'userProfile',
  WALLET_CONFIG: 'walletConfig',
  DEFAULT_PORTFOLIOS_INITIALIZED: 'defaultPortfoliosInitialized',
  THEME_PREFERENCE: 'themePreference',
  SETTINGS: 'userSettings'
} as const;

// User Settings Configuration
export interface UserSettings {
  theme: 'light' | 'dark' | 'system';
  currency: 'USD' | 'EUR' | 'BTC' | 'ETH';
  language: 'en' | 'es' | 'fr' | 'de' | 'zh';
  notifications: {
    portfolioUpdates: boolean;
    priceAlerts: boolean;
    rebalanceReminders: boolean;
    marketNews: boolean;
  };
  privacy: {
    profileVisible: boolean;
    portfoliosVisible: boolean;
    activityVisible: boolean;
  };
  trading: {
    defaultSlippage: number;
    gasOptimization: boolean;
    autoRebalance: boolean;
  };
}

export const DEFAULT_SETTINGS: UserSettings = {
  theme: 'system',
  currency: 'USD',
  language: 'en',
  notifications: {
    portfolioUpdates: true,
    priceAlerts: true,
    rebalanceReminders: true,
    marketNews: false
  },
  privacy: {
    profileVisible: true,
    portfoliosVisible: true,
    activityVisible: false
  },
  trading: {
    defaultSlippage: 0.5,
    gasOptimization: true,
    autoRebalance: false
  }
};

// Utility Functions for User Management
export const getNetworkById = (id: NetworkId) => {
  return NETWORKS.find(network => network.id === id);
};

export const getNetworkName = (id: NetworkId): string => {
  const network = getNetworkById(id);
  return network ? network.name : 'Unknown Network';
};

export const isValidTimeframe = (timeframe: string): timeframe is Timeframe => {
  return TIMEFRAMES.includes(timeframe as Timeframe);
};

export const isValidTokenFilter = (filter: string): filter is TokenFilter => {
  return TOKEN_FILTERS.includes(filter as TokenFilter);
};

// Local Storage Helper Functions
export const saveUserProfile = (profile: UserProfile): void => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(profile));
  }
};

export const getUserProfile = (): UserProfile | null => {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem(STORAGE_KEYS.USER_PROFILE);
    return stored ? JSON.parse(stored) : null;
  }
  return null;
};

export const saveWalletConfig = (config: WalletConfig): void => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEYS.WALLET_CONFIG, JSON.stringify(config));
  }
};

export const getWalletConfig = (): WalletConfig => {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem(STORAGE_KEYS.WALLET_CONFIG);
    return stored ? JSON.parse(stored) : WALLET_CONFIG;
  }
  return WALLET_CONFIG;
};

export const saveUserSettings = (settings: UserSettings): void => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  }
};

export const getUserSettings = (): UserSettings => {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    return stored ? JSON.parse(stored) : DEFAULT_SETTINGS;
  }
  return DEFAULT_SETTINGS;
};

// Connection Status Management
export const updateWalletConnection = (isConnected: boolean, address?: string): WalletConfig => {
  const currentConfig = getWalletConfig();
  const updatedConfig = {
    ...currentConfig,
    isConnected,
    address: address || currentConfig.address,
    fullAddress: address || currentConfig.fullAddress
  };
  
  saveWalletConfig(updatedConfig);
  return updatedConfig;
};

// User Profile Statistics Update
export const updateUserProfileStats = (profile: UserProfile): UserProfile => {
  const updatedProfile = {
    ...profile,
    // Add any computed stats here
  };
  
  saveUserProfile(updatedProfile);
  return updatedProfile;
};