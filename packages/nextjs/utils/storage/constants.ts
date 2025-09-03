import { Portfolio, PortfolioPerformance, PortfolioStrategy } from "../../types/balancer/portfolio";
import { UserProfile } from "../../types/balancer/user";

export const CHAIN_ID = process.env.CHAIN_ID || 8453;
export const ONEINCH_API_BASE = "https://api.1inch.dev";
export const API_KEY = process.env.ONEINCH_API_KEY!;

// Token Images - ERC-20 Token Images Only
export const TOKEN_IMAGES = {
  // Custom StableCoin with Shield and Lion
  SLD: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPCEtLSBTaGllbGQgLS0+CjxwYXRoIGQ9Ik0yMCAzNkMyMCAzNiAzNCAzMCAzNCAyMEMzNCAyMCAzNCA4IDIwIDggQzIwIDggNiA4IDYgMjBDNiAzMCAyMCAzNiAyMCAzNloiIGZpbGw9InVybCgjZ3JhZGllbnQwKSIgc3Ryb2tlPSIjMkY1NTg2IiBzdHJva2Utd2lkdGg9IjEuNSIvPgo8IS0tIExpb24gLS0+CjxnIHRyYW5zZm9ybT0idHJhbnNsYXRlKDIwLCAxMikiPgo8IS0tIExpb24gZmFjZSAtLT4KPGNpcmNsZSBjeD0iMCIgY3k9IjAiIHI9IjQiIGZpbGw9IiNGRkQ3MDAiLz4KPCEtLSBMaW9uIG1hbmUgLS0+CjxwYXRoIGQ9Ik0tMy41IC0yLjVDLTMuNSAtMy41IC0yLjUgLTQuNSAtMS41IC00LjVDLTAuNSAtNC41IDAuNSAtNC41IDEuNSAtNC41QzIuNSAtNC41IDMuNSAtMy41IDMuNSAtMi41QzMuNSAtMS41IDIuNSAtMC41IDEuNSAtMC41QzAuNSAtMC41IC0wLjUgLTAuNSAtMS41IC0wLjVDLTIuNSAtMC41IC0zLjUgLTEuNSAtMy41IC0yLjVaIiBmaWxsPSIjRkY4QzAwIi8+CjwhLS0gTGlvbiBleWVzIC0tPgo8Y2lyY2xlIGN4PSItMS4yIiBjeT0iLTAuNSIgcj0iMC42IiBmaWxsPSIjMDAwIi8+CjxjaXJjbGUgY3g9IjEuMiIgY3k9Ii0wLjUiIHI9IjAuNiIgZmlsbD0iIzAwMCIvPgo8IS0tIExpb24gbm9zZSAtLT4KPGVsbGlwc2UgY3g9IjAiIGN5PSIwLjUiIHJ4PSIxIiByeT0iMC42IiBmaWxsPSIjRkZEQjAwIi8+CjwvZz4KPCEtLSBHcmFkaWVudCBkZWZpbml0aW9uIC0tPgo8ZGVmcz4KPGxpbmVhckdyYWRpZW50IGlkPSJncmFkaWVudDAiIHgxPSIwJSIgeTE9IjAlIiB4Mj0iMTAwJSIgeTI9IjEwMCUiPgo8c3RvcCBvZmZzZXQ9IjAlIiBzdHlsZT0ic3RvcC1jb2xvcjojMkY1NTg2O3N0b3Atb3BhY2l0eToxIiAvPgo8c3RvcCBvZmZzZXQ9IjUwJSIgc3R5bGU9InN0b3AtY29sb3I6IzMzNzNCRDtzdG9wLW9wYWNpdHk6MSIgLz4KPHN0b3Agb2Zmc2V0PSIxMDAlIiBzdHlsZT0ic3RvcC1jb2xvcjojMkY1NTg2O3N0b3Atb3BhY2l0eToxIiAvPgo8L2xpbmVhckdyYWRpZW50Pgo8L2RlZnM+Cjwvc3ZnPg==",

  // Major Stablecoins (ERC-20)
  STABLE: "https://cryptologos.cc/logos/tether-usdt-logo.png", // Generic stable representation
  USDC: "https://cryptologos.cc/logos/usd-coin-usdc-logo.png",
  USDT: "https://cryptologos.cc/logos/tether-usdt-logo.png",
  DAI: "https://cryptologos.cc/logos/multi-collateral-dai-dai-logo.png",
  FRAX: "https://cryptologos.cc/logos/frax-frax-logo.png",
  BUSD: "https://cryptologos.cc/logos/binance-usd-busd-logo.png",
  TUSD: "https://cryptologos.cc/logos/trueusd-tusd-logo.png",

  // Major Cryptocurrencies
  BTC: "https://cryptologos.cc/logos/bitcoin-btc-logo.png",
  ETH: "https://cryptologos.cc/logos/ethereum-eth-logo.png",

  // DeFi Tokens (ERC-20)
  UNI: "https://cryptologos.cc/logos/uniswap-uni-logo.png",
  AAVE: "https://cryptologos.cc/logos/aave-aave-logo.png",
  COMP: "https://cryptologos.cc/logos/compound-comp-logo.png",
  MKR: "https://cryptologos.cc/logos/maker-mkr-logo.png",
  SNX: "https://cryptologos.cc/logos/synthetix-snx-logo.png",
  CRV: "https://cryptologos.cc/logos/curve-dao-token-crv-logo.png",
  SUSHI: "https://cryptologos.cc/logos/sushiswap-sushi-logo.png",
  LINK: "https://cryptologos.cc/logos/chainlink-link-logo.png",
  LDO: "https://cryptologos.cc/logos/lido-dao-ldo-logo.png",
  BAL: "https://cryptologos.cc/logos/balancer-bal-logo.png",
  YFI: "https://cryptologos.cc/logos/yearn-finance-yfi-logo.png",
  SPARK: "https://cryptologos.cc/logos/maker-mkr-logo.png", // Using MKR as placeholder
  PENDLE: "https://cryptologos.cc/logos/pendle-pendle-logo.png",

  // Layer 2 & Governance Tokens (ERC-20)
  ARB: "https://cryptologos.cc/logos/arbitrum-arb-logo.png",
  OP: "https://cryptologos.cc/logos/optimism-ethereum-op-logo.png",
  MATIC: "https://cryptologos.cc/logos/polygon-matic-logo.png",

  // Real World Assets (RWA)
  ONDO: "https://cryptologos.cc/logos/ondo-ondo-logo.png",
  CENTRIFUGE: "https://cryptologos.cc/logos/centrifuge-cfg-logo.png",
  SKY: "https://cryptologos.cc/logos/maker-mkr-logo.png", // Using MKR as placeholder for Sky
  PAXGOLD: "https://cryptologos.cc/logos/pax-gold-paxg-logo.png",

  // Exchange & Platform Tokens (ERC-20)
  BNT: "https://cryptologos.cc/logos/bancor-bnt-logo.png",
  KNC: "https://cryptologos.cc/logos/kyber-network-knc-logo.png",
  ZRX: "https://cryptologos.cc/logos/0x-zrx-logo.png",
  "1INCH": "https://cryptologos.cc/logos/1inch-1inch-logo.png",

  // Infrastructure & Oracle Tokens (ERC-20)
  GRT: "https://cryptologos.cc/logos/the-graph-grt-logo.png",
  BAND: "https://cryptologos.cc/logos/band-protocol-band-logo.png",
  ENS: "https://cryptologos.cc/logos/ethereum-name-service-ens-logo.png",

  // Gaming & NFT Tokens (ERC-20)
  SAND: "https://cryptologos.cc/logos/the-sandbox-sand-logo.png",
  MANA: "https://cryptologos.cc/logos/decentraland-mana-logo.png",
  AXS: "https://cryptologos.cc/logos/axie-infinity-axs-logo.png",

  // Meme Tokens (ERC-20)
  SHIB: "https://cryptologos.cc/logos/shiba-inu-shib-logo.png",
  PEPE: "https://cryptologos.cc/logos/pepe-pepe-logo.png",
  FLOKI: "https://cryptologos.cc/logos/floki-inu-floki-logo.png",
  DOGE: "https://cryptologos.cc/logos/dogecoin-doge-logo.png",
  PENGU: "https://seeklogo.com/images/P/pudgy-penguins-logo-84E78F2F86-seeklogo.com.png",
  BONK: "https://cryptologos.cc/logos/bonk-bonk-logo.png",
  SPX6900: "https://cryptologos.cc/logos/spx6900-spx-logo.png",
  FARTCOIN: "https://cryptologos.cc/logos/dogecoin-doge-logo.png", // Placeholder
  FDOG: "https://cryptologos.cc/logos/dogecoin-doge-logo.png", // Placeholder
  WIF: "https://cryptologos.cc/logos/dogwifhat-wif-logo.png",
};
// Token List - ERC-20 Token Objects
export const TOKENS = [
  {
    symbol: "BTC",
    name: "Bitcoin",
    price: "67,234.56",
    change: "+2.45",
    image: "https://cryptologos.cc/logos/bitcoin-btc-logo.png",
    category: "layer1",
  },
  {
    symbol: "ETH",
    name: "Ethereum",
    price: "3,678.90",
    change: "+1.78",
    image: "https://cryptologos.cc/logos/ethereum-eth-logo.png",
    category: "layer1",
  },
  {
    symbol: "USDC",
    name: "USD Coin",
    price: "1.00",
    change: "+0.01",
    image: "https://cryptologos.cc/logos/usd-coin-usdc-logo.png",
    category: "stablecoin",
  },
  {
    symbol: "USDT",
    name: "Tether",
    price: "1.00",
    change: "0.00",
    image: "https://cryptologos.cc/logos/tether-usdt-logo.png",
    category: "stablecoin",
  },
  {
    symbol: "DAI",
    name: "Dai",
    price: "1.00",
    change: "+0.02",
    image: "https://cryptologos.cc/logos/multi-collateral-dai-dai-logo.png",
    category: "stablecoin",
  },
  {
    symbol: "FRAX",
    name: "Frax",
    price: "0.999",
    change: "+0.01",
    image: "https://cryptologos.cc/logos/frax-frax-logo.png",
    category: "stablecoin",
  },
  {
    symbol: "BUSD",
    name: "Binance USD",
    price: "1.00",
    change: "0.00",
    image: "https://cryptologos.cc/logos/binance-usd-busd-logo.png",
    category: "stablecoin",
  },
  {
    symbol: "TUSD",
    name: "TrueUSD",
    price: "1.00",
    change: "+0.01",
    image: "https://cryptologos.cc/logos/trueusd-tusd-logo.png",
    category: "stablecoin",
  },

  // Major DeFi Tokens (ERC-20)
  {
    symbol: "UNI",
    name: "Uniswap",
    price: "12.45",
    change: "-1.89",
    image: "https://cryptologos.cc/logos/uniswap-uni-logo.png",
    category: "defi",
  },
  {
    symbol: "AAVE",
    name: "Aave",
    price: "156.78",
    change: "+5.67",
    image: "https://cryptologos.cc/logos/aave-aave-logo.png",
    category: "defi",
  },
  {
    symbol: "COMP",
    name: "Compound",
    price: "89.34",
    change: "+2.12",
    image: "https://cryptologos.cc/logos/compound-comp-logo.png",
    category: "defi",
  },
  {
    symbol: "MKR",
    name: "Maker",
    price: "1,834.56",
    change: "+1.78",
    image: "https://cryptologos.cc/logos/maker-mkr-logo.png",
    category: "defi",
  },
  {
    symbol: "SNX",
    name: "Synthetix",
    price: "3.42",
    change: "-3.21",
    image: "https://cryptologos.cc/logos/synthetix-snx-logo.png",
    category: "defi",
  },
  {
    symbol: "CRV",
    name: "Curve DAO",
    price: "0.87",
    change: "+4.56",
    image: "https://cryptologos.cc/logos/curve-dao-token-crv-logo.png",
    category: "defi",
  },
  {
    symbol: "SUSHI",
    name: "SushiSwap",
    price: "1.23",
    change: "-2.34",
    image: "https://cryptologos.cc/logos/sushiswap-sushi-logo.png",
    category: "defi",
  },
  {
    symbol: "LINK",
    name: "Chainlink",
    price: "18.67",
    change: "+3.45",
    image: "https://cryptologos.cc/logos/chainlink-link-logo.png",
    category: "defi",
  },
  {
    symbol: "LDO",
    name: "Lido DAO",
    price: "2.34",
    change: "+6.78",
    image: "https://cryptologos.cc/logos/lido-dao-ldo-logo.png",
    category: "defi",
  },
  {
    symbol: "BAL",
    name: "Balancer",
    price: "4.23",
    change: "+3.12",
    image: "https://cryptologos.cc/logos/balancer-bal-logo.png",
    category: "defi",
  },
  {
    symbol: "YFI",
    name: "Yearn Finance",
    price: "8,456.78",
    change: "+2.67",
    image: "https://cryptologos.cc/logos/yearn-finance-yfi-logo.png",
    category: "defi",
  },
  {
    symbol: "SPARK",
    name: "Spark Protocol",
    price: "45.67",
    change: "+3.45",
    image: "https://cryptologos.cc/logos/maker-mkr-logo.png",
    category: "defi",
  },
  {
    symbol: "PENDLE",
    name: "Pendle",
    price: "5.67",
    change: "+8.90",
    image: "https://cryptologos.cc/logos/pendle-pendle-logo.png",
    category: "defi",
  },

  // Layer 2 & Governance Tokens (ERC-20)
  {
    symbol: "ARB",
    name: "Arbitrum",
    price: "1.89",
    change: "+7.23",
    image: "https://cryptologos.cc/logos/arbitrum-arb-logo.png",
    category: "layer2",
  },
  {
    symbol: "OP",
    name: "Optimism",
    price: "2.45",
    change: "+4.56",
    image: "https://cryptologos.cc/logos/optimism-ethereum-op-logo.png",
    category: "layer2",
  },
  {
    symbol: "MATIC",
    name: "Polygon",
    price: "1.12",
    change: "+2.45",
    image: "https://cryptologos.cc/logos/polygon-matic-logo.png",
    category: "layer2",
  },

  // Real World Assets (RWA)
  {
    symbol: "ONDO",
    name: "Ondo Finance",
    price: "1.45",
    change: "+5.23",
    image: "https://cryptologos.cc/logos/ondo-ondo-logo.png",
    category: "rwa",
  },
  {
    symbol: "CENTRIFUGE",
    name: "Centrifuge",
    price: "0.78",
    change: "+2.34",
    image: "https://cryptologos.cc/logos/centrifuge-cfg-logo.png",
    category: "rwa",
  },
  {
    symbol: "SKY",
    name: "Sky Protocol",
    price: "0.123",
    change: "+1.67",
    image: "https://cryptologos.cc/logos/maker-mkr-logo.png",
    category: "rwa",
  },
  {
    symbol: "PAXGOLD",
    name: "PAX Gold",
    price: "2,678.90",
    change: "+0.45",
    image: "https://cryptologos.cc/logos/pax-gold-paxg-logo.png",
    category: "rwa",
  },

  // Exchange & Platform Tokens (ERC-20)
  {
    symbol: "BNT",
    name: "Bancor",
    price: "0.67",
    change: "+1.45",
    image: "https://cryptologos.cc/logos/bancor-bnt-logo.png",
    category: "exchange",
  },
  {
    symbol: "KNC",
    name: "Kyber Network",
    price: "0.89",
    change: "-0.78",
    image: "https://cryptologos.cc/logos/kyber-network-knc-logo.png",
    category: "exchange",
  },
  {
    symbol: "ZRX",
    name: "0x Protocol",
    price: "0.45",
    change: "+2.34",
    image: "https://cryptologos.cc/logos/0x-zrx-logo.png",
    category: "exchange",
  },
  {
    symbol: "1INCH",
    name: "1inch",
    price: "0.67",
    change: "-1.23",
    image: "https://cryptologos.cc/logos/1inch-1inch-logo.png",
    category: "exchange",
  },

  // Infrastructure & Oracle Tokens (ERC-20)
  {
    symbol: "GRT",
    name: "The Graph",
    price: "0.23",
    change: "+5.67",
    image: "https://cryptologos.cc/logos/the-graph-grt-logo.png",
    category: "infrastructure",
  },
  {
    symbol: "BAND",
    name: "Band Protocol",
    price: "1.78",
    change: "+3.45",
    image: "https://cryptologos.cc/logos/band-protocol-band-logo.png",
    category: "infrastructure",
  },
  {
    symbol: "ENS",
    name: "Ethereum Name Service",
    price: "23.45",
    change: "+1.89",
    image: "https://cryptologos.cc/logos/ethereum-name-service-ens-logo.png",
    category: "infrastructure",
  },

  // Gaming & NFT Tokens (ERC-20)
  {
    symbol: "SAND",
    name: "The Sandbox",
    price: "0.89",
    change: "+4.23",
    image: "https://cryptologos.cc/logos/the-sandbox-sand-logo.png",
    category: "gaming",
  },
  {
    symbol: "MANA",
    name: "Decentraland",
    price: "0.67",
    change: "+2.78",
    image: "https://cryptologos.cc/logos/decentraland-mana-logo.png",
    category: "gaming",
  },
  {
    symbol: "AXS",
    name: "Axie Infinity",
    price: "12.34",
    change: "+6.45",
    image: "https://cryptologos.cc/logos/axie-infinity-axs-logo.png",
    category: "gaming",
  },

  // Meme Tokens (ERC-20)
  {
    symbol: "SHIB",
    name: "Shiba Inu",
    price: "0.00002567",
    change: "+12.67",
    image: "https://cryptologos.cc/logos/shiba-inu-shib-logo.png",
    category: "meme",
  },
  {
    symbol: "PEPE",
    name: "Pepe",
    price: "0.00001234",
    change: "+23.45",
    image: "https://cryptologos.cc/logos/pepe-pepe-logo.png",
    category: "meme",
  },
  {
    symbol: "FLOKI",
    name: "Floki Inu",
    price: "0.00034567",
    change: "+8.90",
    image: "https://cryptologos.cc/logos/floki-inu-floki-logo.png",
    category: "meme",
  },
  {
    symbol: "DOGE",
    name: "Dogecoin",
    price: "0.38",
    change: "+5.67",
    image: "https://cryptologos.cc/logos/dogecoin-doge-logo.png",
    category: "meme",
  },
  {
    symbol: "PENGU",
    name: "Pudgy Penguins",
    price: "0.045",
    change: "+15.34",
    image: "https://seeklogo.com/images/P/pudgy-penguins-logo-84E78F2F86-seeklogo.com.png",
    category: "meme",
  },
  {
    symbol: "BONK",
    name: "Bonk",
    price: "0.000045",
    change: "+8.76",
    image: "https://cryptologos.cc/logos/bonk-bonk-logo.png",
    category: "meme",
  },
  {
    symbol: "SPX6900",
    name: "SPX6900",
    price: "1.23",
    change: "+12.45",
    image: "https://cryptologos.cc/logos/spx6900-spx-logo.png",
    category: "meme",
  },
  {
    symbol: "FARTCOIN",
    name: "Fartcoin",
    price: "0.0567",
    change: "+25.67",
    image: "https://cryptologos.cc/logos/dogecoin-doge-logo.png",
    category: "meme",
  },
  {
    symbol: "FDOG",
    name: "French Dog",
    price: "0.0123",
    change: "+18.90",
    image: "https://cryptologos.cc/logos/dogecoin-doge-logo.png",
    category: "meme",
  },
  {
    symbol: "WIF",
    name: "Dogwifhat",
    price: "2.34",
    change: "+7.89",
    image: "https://cryptologos.cc/logos/dogwifhat-wif-logo.png",
    category: "meme",
  },

  // AI Tokens
  {
    symbol: "TAO",
    name: "Bittensor",
    price: "567.89",
    change: "+4.56",
    image: "https://cryptologos.cc/logos/bittensor-tao-logo.png",
    category: "ai",
  },
  {
    symbol: "NEAR",
    name: "NEAR Protocol",
    price: "6.78",
    change: "+3.45",
    image: "https://cryptologos.cc/logos/near-protocol-near-logo.png",
    category: "ai",
  },
  {
    symbol: "RENDER",
    name: "Render Token",
    price: "8.90",
    change: "+6.78",
    image: "https://cryptologos.cc/logos/render-token-rndr-logo.png",
    category: "ai",
  },
  {
    symbol: "FET",
    name: "Fetch.ai",
    price: "0.78",
    change: "+2.34",
    image: "https://cryptologos.cc/logos/fetch-ai-fet-logo.png",
    category: "ai",
  },
  {
    symbol: "VIRTUAL",
    name: "Virtual Protocol",
    price: "2.45",
    change: "+5.67",
    image: "https://cryptologos.cc/logos/virtual-protocol-virtual-logo.png",
    category: "ai",
  },

  // Privacy & Security Tokens (ERC-20)
  {
    symbol: "RPL",
    name: "Rocket Pool",
    price: "45.67",
    change: "+4.23",
    image: "https://cryptologos.cc/logos/rocket-pool-rpl-logo.png",
    category: "infrastructure",
  },
  {
    symbol: "OCEAN",
    name: "Ocean Protocol",
    price: "1.23",
    change: "+1.67",
    image: "https://cryptologos.cc/logos/ocean-protocol-ocean-logo.png",
    category: "ai",
  },
] as const;

// Portfolio Mock Data - ERC-20 Tokens Only
type DefaultPortfolioSeed = Required<Pick<Portfolio, "name" | "allocations" | "isTemplate" | "isPublic" | "type">> & {
  performance: Required<Pick<PortfolioPerformance, "totalValue" | "returnPercentage">>;
  strategy?: PortfolioStrategy;
  config?: Portfolio["config"];
  category?: string;
  tags?: string[];
  presetType?: string;
};

export const DEFAULT_PORTFOLIOS: DefaultPortfolioSeed[] = [
  {
    isTemplate: true,
    name: "1Balancer EndGame",
    allocations: [
      { symbol: "STABLE", percentage: 50, amount: 5000 },
      { symbol: "BTC", percentage: 30, amount: 3000 },
      { symbol: "ETH", percentage: 20, amount: 2000 },
    ],
    performance: { totalValue: 10000, returnPercentage: 8.45 },
    isPublic: true,
    strategy: {
      description:
        "Conservative long-term strategy focusing on stability with major cryptocurrency exposure. Perfect for risk-averse investors seeking steady growth with minimal volatility.",
      riskLevel: "conservative",
    },
    type: "drift",
    config: { driftThreshold: 5 },
  },
  {
    isTemplate: true,
    name: "1Balancer Gomora",
    allocations: [
      { symbol: "STABLE", percentage: 40, amount: 4000 },
      { symbol: "BTC", percentage: 30, amount: 3000 },
      { symbol: "ETH", percentage: 20, amount: 2000 },
      { symbol: "LINK", percentage: 10, amount: 1000 },
    ],
    performance: { totalValue: 10000, returnPercentage: 12.67 },
    isPublic: true,
    strategy: {
      description:
        "Balanced approach with oracle exposure through Chainlink. Combines stability with growth potential from established cryptocurrencies and infrastructure protocols.",
      riskLevel: "moderate",
    },
    type: "time",
    config: { rebalanceFrequency: "monthly" },
  },
  {
    isTemplate: true,
    name: "1Balancer Tanos",
    allocations: [
      { symbol: "STABLE", percentage: 30, amount: 3000 },
      { symbol: "BTC", percentage: 25, amount: 2500 },
      { symbol: "ETH", percentage: 20, amount: 2000 },
      { symbol: "LINK", percentage: 10, amount: 1000 },
      { symbol: "PENDLE", percentage: 10, amount: 1000 },
      { symbol: "UNI", percentage: 5, amount: 500 },
    ],
    performance: { totalValue: 10000, returnPercentage: 15.23 },
    isPublic: true,
    strategy: {
      description:
        "Diversified portfolio with DeFi exposure including DeFi protocols for enhanced returns and yield generation.",
      riskLevel: "aggressive",
    },
    type: "drift",
    config: { driftThreshold: 3 },
  },
  {
    isTemplate: true,
    name: "Real Yield RWA",
    allocations: [
      { symbol: "STABLE", percentage: 25, amount: 2500 },
      { symbol: "ONDO", percentage: 10, amount: 1000 },
      { symbol: "CENTRIFUGE", percentage: 20, amount: 2000 },
      { symbol: "SKY", percentage: 15, amount: 1500 },
      { symbol: "PAXGOLD", percentage: 20, amount: 2000 },
      { symbol: "LINK", percentage: 10, amount: 1000 },
    ],
    performance: { totalValue: 10000, returnPercentage: 18.95 },
    isPublic: true,
    strategy: {
      description:
        "RWA-focused portfolio with exposure to tokenized real-world assets, gold, and DeFi protocols for yield generation.",
      riskLevel: "moderate",
    },
    type: "drift",
    config: { driftThreshold: 4 },
  },
  {
    isTemplate: true,
    name: "DeFi Powerhouse",
    allocations: [
      { symbol: "STABLE", percentage: 20, amount: 2000 },
      { symbol: "AAVE", percentage: 20, amount: 2000 },
      { symbol: "UNI", percentage: 20, amount: 2000 },
      { symbol: "CRV", percentage: 20, amount: 2000 },
      { symbol: "COMP", percentage: 20, amount: 2000 },
    ],
    performance: { totalValue: 10000, returnPercentage: 22.34 },
    isPublic: true,
    strategy: {
      description:
        "DeFi-focused portfolio with equal allocation to top protocols for diversified yield and governance exposure.",
      riskLevel: "aggressive",
    },
    type: "time",
    config: { rebalanceFrequency: "quarterly" },
  },
  {
    isTemplate: true,
    name: "ETH Maxi",
    allocations: [{ symbol: "ETH", percentage: 100, amount: 10000 }],
    performance: { totalValue: 10000, returnPercentage: 45.67 },
    isPublic: true,
    strategy: {
      description: "Single asset portfolio for Ethereum maximalists seeking pure ETH exposure.",
      riskLevel: "aggressive",
    },
    type: "drift",
    config: { driftThreshold: 0 },
  },
  {
    isTemplate: true,
    name: "BTC Maxi",
    allocations: [{ symbol: "BTC", percentage: 100, amount: 10000 }],
    performance: { totalValue: 10000, returnPercentage: 28.91 },
    isPublic: true,
    strategy: {
      description: "Single asset portfolio for Bitcoin maximalists seeking pure BTC exposure.",
      riskLevel: "aggressive",
    },
    type: "drift",
    config: { driftThreshold: 0 },
  },
];
export const CRYPTOCURRENCY_DATA = [
  {
    symbol: "LDO",
    name: "Lido DAO",
    network: "Ethereum",
    balance: "524.32",
    price: "$2.34",
    value: "$1,226.91",
    pnl: "+$345.67",
    roi: "+39.20%",
    change24h: "+6.78%",
    isPositive: true,
  },
  {
    symbol: "ARB",
    name: "Arbitrum",
    network: "Arbitrum",
    balance: "567.89",
    price: "$1.89",
    value: "$1,073.31",
    pnl: "+$334.56",
    roi: "+45.26%",
    change24h: "+7.23%",
    isPositive: true,
  },
  {
    symbol: "SNX",
    name: "Synthetix",
    network: "Ethereum",
    balance: "278.45",
    price: "$3.42",
    value: "$952.30",
    pnl: "-$123.45",
    roi: "-11.47%",
    change24h: "-3.21%",
    isPositive: false,
  },
];
// Portfolio Token Mock Data - ERC-20 Tokens Only
export const MOCK_PORTFOLIO_TOKENS = [
  {
    symbol: "ARB",
    name: "Arbitrum",
    network: "Arbitrum",
    balance: "567.89",
    price: "$1.89",
    value: "$1,073.31",
    pnl: "+$334.56",
    roi: "+45.26%",
    change24h: "+7.23%",
    isPositive: true,
  },
  {
    symbol: "SNX",
    name: "Synthetix",
    network: "Ethereum",
    balance: "278.45",
    price: "$3.42",
    value: "$952.30",
    pnl: "-$123.45",
    roi: "-11.47%",
    change24h: "-3.21%",
    isPositive: false,
  },
  {
    symbol: "CRV",
    name: "Curve DAO",
    network: "Ethereum",
    balance: "1,034.78",
    price: "$0.87",
    value: "$900.26",
    pnl: "+$156.78",
    roi: "+21.09%",
    change24h: "+4.56%",
    isPositive: true,
  },
  {
    symbol: "MKR",
    name: "Maker",
    network: "Ethereum",
    balance: "0.456",
    price: "$1,834.56",
    value: "$836.96",
    pnl: "+$178.45",
    roi: "+27.09%",
    change24h: "+1.78%",
    isPositive: true,
  },
] as const;

// Networks Configuration - ERC-20 Compatible Networks
export const NETWORKS = [
  { id: "all", name: "All networks", value: "$42,985.23" },
  { id: "ethereum", name: "Ethereum", value: "$39,721.67" },
  { id: "arbitrum", name: "Arbitrum", value: "$1,073.31" },
  { id: "optimism", name: "Optimism", value: "$840.15" },
  { id: "polygon", name: "Polygon", value: "$1,350.10" },
  { id: "base", name: "Base", value: "$0.00" },
  { id: "linea", name: "Linea", value: "$0.00" },
  { id: "zksync", name: "zkSync Era", value: "$0.00" },
] as const;

// Timeframes
export const TIMEFRAMES = ["24H", "1W", "1M", "1Y", "3Y"] as const;

// Token Filters
export const TOKEN_FILTERS = ["All", "Active", "Closed"] as const;

// Wallet Configuration - Updated with ERC-20 portfolio value
export const WALLET_CONFIG = {
  address: "0xa235...bc3e",
  totalValue: "$42,985.23",
  fullAddress: "0xa235f8c2d4e7b9a1c3f5e8d9b2a4c6e8f1a3b5c7d9e2f4a6b8c1d3e5f7a9b2c4e6",
} as const;

// Site Images/Assets
export const SITE_ASSETS = {
  // Add other site images here as needed
  logoImage: "/logo.png",
} as const;

// Portfolio management utilities
export const PORTFOLIO_STORAGE_KEY = "userPortfolios";
export const USER_PROFILE_STORAGE_KEY = "userProfile";
export const DEFAULT_PORTFOLIOS_INITIALIZED_KEY = "defaultPortfoliosInitialized";

// Default Portfolios Configuration - EXACT percentages from user's image
// (removed duplicate older DEFAULT_PORTFOLIOS block using deprecated shape)

// Function to initialize default portfolios immediately on app startup
export const initializeDefaultPortfolios = (): Portfolio[] => {
  const hasInitialized = localStorage.getItem(DEFAULT_PORTFOLIOS_INITIALIZED_KEY);
  const existingPortfolios = getPortfolios();

  // Always return existing portfolios if they exist
  if (existingPortfolios.length > 0) {
    console.log(`📊 Found ${existingPortfolios.length} existing portfolios`);
    return existingPortfolios;
  }

  // Only initialize if not done before AND no existing portfolios
  if (!hasInitialized) {
    const portfoliosWithIds = DEFAULT_PORTFOLIOS.map((portfolio, index) => ({
      ...portfolio,
      id: `default-${Date.now()}-${index}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
    }));

    localStorage.setItem(PORTFOLIO_STORAGE_KEY, JSON.stringify(portfoliosWithIds));
    localStorage.setItem(DEFAULT_PORTFOLIOS_INITIALIZED_KEY, "true");

    // Update user profile stats
    updateUserProfileStats();

    console.log(`✅ Initialized ${portfoliosWithIds.length} default portfolios:`);
    portfoliosWithIds.forEach(p => console.log(`   - ${p.name} (${p.allocations.length} allocations)`));

    return portfoliosWithIds as unknown as Portfolio[];
  }

  return existingPortfolios;
};

// Function to reset portfolios (useful for testing or user request)
export const resetDefaultPortfolios = (): Portfolio[] => {
  // Clear existing data
  localStorage.removeItem(PORTFOLIO_STORAGE_KEY);
  localStorage.removeItem(DEFAULT_PORTFOLIOS_INITIALIZED_KEY);

  // Re-initialize
  return initializeDefaultPortfolios();
};

// Function to add missing default portfolios (if user has some but not all)
export const ensureAllDefaultPortfolios = (): Portfolio[] => {
  const existingPortfolios = getPortfolios();
  const existingNames = existingPortfolios.map(p => p.name);

  const missingPortfolios = DEFAULT_PORTFOLIOS.filter(
    defaultP => defaultP.name && !existingNames.includes(defaultP.name),
  );

  if (missingPortfolios.length > 0) {
    const newPortfolios = missingPortfolios.map((portfolio, index) => ({
      ...portfolio,
      id: `default-missing-${Date.now()}-${index}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
    }));

    const updatedPortfolios = [...existingPortfolios, ...(newPortfolios as unknown as Portfolio[])];
    localStorage.setItem(PORTFOLIO_STORAGE_KEY, JSON.stringify(updatedPortfolios));
    updateUserProfileStats();

    console.log(`➕ Added ${newPortfolios.length} missing default portfolios`);
    return updatedPortfolios;
  }

  return existingPortfolios;
};

// Utility functions for portfolio management
export const savePortfolio = (portfolio: Portfolio) => {
  const existingPortfolios = getPortfolios();
  const updatedPortfolios = [...existingPortfolios, portfolio];
  localStorage.setItem(PORTFOLIO_STORAGE_KEY, JSON.stringify(updatedPortfolios));

  // Update user profile stats
  updateUserProfileStats();
};

export const getPortfolios = (): Portfolio[] => {
  const saved = localStorage.getItem(PORTFOLIO_STORAGE_KEY);
  return saved ? JSON.parse(saved) : [];
};

export const updatePortfolio = (portfolioId: string, updates: Partial<Portfolio>) => {
  const portfolios = getPortfolios();
  const updatedPortfolios = portfolios.map(p => (p.id === portfolioId ? { ...p, ...updates } : p));
  localStorage.setItem(PORTFOLIO_STORAGE_KEY, JSON.stringify(updatedPortfolios));
  updateUserProfileStats();
};

export const deletePortfolio = (portfolioId: string) => {
  const portfolios = getPortfolios();
  const updatedPortfolios = portfolios.filter(p => p.id !== portfolioId);
  localStorage.setItem(PORTFOLIO_STORAGE_KEY, JSON.stringify(updatedPortfolios));
  updateUserProfileStats();
};

export const getUserProfile = (): UserProfile | null => {
  const saved = localStorage.getItem(USER_PROFILE_STORAGE_KEY);
  return saved ? JSON.parse(saved) : null;
};

export const updateUserProfileStats = () => {
  const profile = getUserProfile();
  if (!profile) return;

  const portfolios = getPortfolios();
  const updatedProfile: UserProfile = {
    ...profile,
    totalPortfolios: portfolios.length,
    publicPortfolios: portfolios.filter(p => p.isPublic).length,
    totalInvestment: portfolios.reduce((sum, p) => sum + (p.performance?.totalValue ?? 0), 0),
    bestPerformance: Math.max(...portfolios.map(p => p.performance?.returnPercentage ?? 0), 0),
  };

  localStorage.setItem(USER_PROFILE_STORAGE_KEY, JSON.stringify(updatedProfile));
};

// Type definitions
export type TokenSymbol = keyof typeof TOKEN_IMAGES;
export type NetworkId = (typeof NETWORKS)[number]["id"];
export type Timeframe = (typeof TIMEFRAMES)[number];
export type TokenFilter = (typeof TOKEN_FILTERS)[number];
export type CryptocurrencyData = (typeof CRYPTOCURRENCY_DATA)[number];
