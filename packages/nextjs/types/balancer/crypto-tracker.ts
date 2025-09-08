import { Line, LinesResponse } from "~~/types";

/**
 * Mainnet ERC20 token addresses for supported symbols.
 * Update this map if you want to support other chains or tokens.
 */
export const TOKEN_ADDRESS_MAP: Record<string, string> = {
  USDC: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
  USDT: "0xfde4C96c8593536E31F229EA8f37b2ADa2699bb2",
  UNI: "0xc3De830EA07524a0761646a6a4e4be0e114a3C83",
};

/**
 * A single point in a sparkline. Some sources provide only numbers, others provide
 * timestamp/value pairs — support both.
 */
export type SparklinePoint = Line;

export type Sparkline = number[] | SparklinePoint[] | LinesResponse["data"];

/**
 * Core data shape used by `LiveCryptoTicker`.
 * Keep fields small and serializable so the component can easily store/update them.
 */
export interface CryptoData {
  symbol: string; // ticker symbol, e.g. "USDC"
  name: string; // human readable name
  price: number; // latest price in USD (or display currency)
  change24h: number; // percentage change over 24h
  volume: string; // human-friendly volume string (eg "123.4M")
  marketCap: string; // human-friendly market cap string (eg "12.3B")
  trend: "up" | "down"; // quick indicator for color/arrow
  sparkline: Sparkline; // small recent-series for mini-chart

  // Optional metadata commonly available from token lists / APIs
  address?: string;
  decimals?: number;
  lastUpdated?: number; // epoch ms
}

/**
 * Lightweight UI state for the ticker component. Exported so other parts of the app
 * can type interactions with the ticker.
 */
export interface CryptoTickerState {
  data: CryptoData[];
  hoveredCrypto?: string | null;
  clickedCrypto?: string | null;
  isLoading?: boolean;
  error?: string | null;
}
