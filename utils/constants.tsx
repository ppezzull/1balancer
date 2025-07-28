// Token Images
export const TOKEN_IMAGES = {
  BTC: 'https://images.unsplash.com/photo-1518546305927-5a555bb7020d?w=64&h=64&fit=crop&auto=format',
  ETH: 'https://images.unsplash.com/photo-1641580318671-98a048ad5299?w=64&h=64&fit=crop&auto=format',
  USDC: 'https://images.unsplash.com/photo-1640340434855-6084b1f4901c?w=64&h=64&fit=crop&auto=format',
  UNI: 'https://images.unsplash.com/photo-1622630998477-20aa696ecb05?w=64&h=64&fit=crop&auto=format',
} as const;

// Portfolio Mock Data
export const PORTFOLIO_DATA = [
  { name: 'BTC', value: 50, amount: '$7,266.42', color: '#F7931A' },
  { name: 'ETH', value: 30, amount: '$4,359.85', color: '#627EEA' },
  { name: 'USDC', value: 20, amount: '$2,906.57', color: '#2775CA' }
] as const;

// Performance Chart Data
export const PERFORMANCE_DATA = [
  { date: 'Jan', value: 8500 },
  { date: 'Feb', value: 9200 },
  { date: 'Mar', value: 8800 },
  { date: 'Apr', value: 11200 },
  { date: 'May', value: 12800 },
  { date: 'Jun', value: 13900 },
  { date: 'Jul', value: 14532 }
] as const;

// Token Holdings Mock Data
export const TOKEN_HOLDINGS = [
  {
    symbol: "BTC",
    name: "Bitcoin",
    network: "Native",
    balance: "0.1567",
    price: "$46,380",
    value: "$7,266.42",
    pnl: "+$1,234.56",
    roi: "+20.44%",
    change24h: "+3.24%",
    isPositive: true
  },
  {
    symbol: "ETH", 
    name: "Ethereum",
    network: "Native",
    balance: "1.8932",
    price: "$2,304",
    value: "$4,359.85",
    pnl: "+$892.34",
    roi: "+25.69%",
    change24h: "+5.67%",
    isPositive: true
  },
  {
    symbol: "USDC",
    name: "USD Coin",
    network: "Ethereum",
    balance: "2,906.57",
    price: "$1.00",
    value: "$2,906.57",
    pnl: "+$12.34",
    roi: "+0.43%",
    change24h: "+0.01%",
    isPositive: true
  },
  {
    symbol: "UNI",
    name: "Uniswap",
    network: "Ethereum", 
    balance: "45.23",
    price: "$8.92",
    value: "$403.45",
    pnl: "-$67.89",
    roi: "-14.43%",
    change24h: "-2.34%",
    isPositive: false
  }
] as const;

// Networks Configuration
export const NETWORKS = [
  { id: "all", name: "All networks", value: "$14,532.84" },
  { id: "ethereum", name: "Ethereum", value: "$7,669.87" },
  { id: "bitcoin", name: "Bitcoin", value: "$7,266.42" },
  { id: "polygon", name: "Polygon", value: "$0.00" }
] as const;

// Timeframes
export const TIMEFRAMES = ["24H", "1W", "1M", "1Y", "3Y"] as const;

// Token Filters
export const TOKEN_FILTERS = ["All", "Active", "Closed"] as const;

// Wallet Configuration
export const WALLET_CONFIG = {
  address: "0xa235...bc3e",
  totalValue: "$14,532.84",
  fullAddress: "0xa235f8c2d4e7b9a1c3f5e8d9b2a4c6e8f1a3b5c7d9e2f4a6b8c1d3e5f7a9b2c4e6"
} as const;

// Site Images/Assets
export const SITE_ASSETS = {
  // Add other site images here as needed
  logoImage: 'figma:asset/4ec3ac8d40639284c043d1d5a8d06d0449713468.png'
} as const;

// Type definitions
export type TokenSymbol = keyof typeof TOKEN_IMAGES;
export type NetworkId = typeof NETWORKS[number]['id'];
export type Timeframe = typeof TIMEFRAMES[number];
export type TokenFilter = typeof TOKEN_FILTERS[number];
export type TokenHolding = typeof TOKEN_HOLDINGS[number];