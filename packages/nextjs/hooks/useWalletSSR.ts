import { useState, useEffect, useCallback } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { useAccount, useChainId } from "wagmi";
import { 
  TokenWithBalance, 
  PortfolioToken, 
  WalletBalances 
} from "~~/types/api";
import { getUserWalletData } from "~~/utils/ssr-data";

export interface UseWalletSSRData {
  // Wallet connection state
  address?: string;
  chainId?: number;
  isConnected: boolean;
  isConnecting: boolean;
  
  // Data state
  walletData?: WalletBalances;
  portfolioTokens?: PortfolioToken[];
  totalValue: number;
  loading: boolean;
  error?: string;
  
  // Actions
  refreshData: () => Promise<void>;
  connectWallet: () => void;
  disconnectWallet: () => void;
}

export function useWalletSSRData(): UseWalletSSRData {
  const { ready, authenticated, login, logout } = usePrivy();
  const { address, isConnected, isConnecting } = useAccount();
  const chainId = useChainId();
  
  const [walletData, setWalletData] = useState<WalletBalances>();
  const [portfolioTokens, setPortfolioTokens] = useState<PortfolioToken[]>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>();
  
  // Get total portfolio value
  const totalValue = portfolioTokens?.reduce((total, token) => 
    total + (token.balanceUSD || 0), 0
  ) || 0;
  
  // Fetch wallet data when address changes
  const refreshData = useCallback(async () => {
    if (!address || !isConnected) {
      setWalletData(undefined);
      setPortfolioTokens(undefined);
      return;
    }
    
    setLoading(true);
    setError(undefined);
    
    try {
      const data = await getUserWalletData(address, chainId);
      setWalletData(data);
      
      // Transform wallet balances to portfolio tokens
      // This would typically fetch from your API or contract
      const tokens: PortfolioToken[] = Object.entries(data.tokens).map((entry, index) => {
        const [tokenAddress, balance] = entry;
        
        // Mock token data - in real app, fetch from token registry
        let allocation = 25; // default
        let targetAmount = 25; // default
        let currentAmount = 25; // default
        
        if (index === 0) {
          allocation = 40;
          targetAmount = 40;
          currentAmount = 45;
        } else if (index === 1) {
          allocation = 35;
          targetAmount = 35;
          currentAmount = 30;
        }
        
        return {
          chainId: data.chainId,
          symbol: ['ETH', 'USDC', 'BTC'][index] || 'UNKNOWN',
          name: ['Ethereum', 'USD Coin', 'Bitcoin'][index] || 'Unknown Token',
          address: tokenAddress,
          decimals: [18, 6, 8][index] || 18,
          rating: 5,
          eip2612: false,
          isFoT: false,
          tags: [],
          balance,
          balanceUSD: parseFloat(balance) * [3000, 1, 60000][index] || 0,
          priceUSD: [3000, 1, 60000][index] || 0,
          change24h: (Math.random() - 0.5) * 10,
          allocation,
          targetAmount,
          currentAmount,
          needsRebalancing: index < 2
        };
      });
      
      setPortfolioTokens(tokens);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch wallet data');
      console.error('Error fetching wallet data:', err);
    } finally {
      setLoading(false);
    }
  }, [address, isConnected, chainId]);
  
  // Fetch data when wallet connects
  useEffect(() => {
    if (ready && authenticated && address && isConnected) {
      refreshData();
    }
  }, [ready, authenticated, address, isConnected, refreshData]);
  
  // Connect wallet
  const connectWallet = useCallback(() => {
    if (!ready) return;
    
    if (!authenticated) {
      login();
    }
  }, [ready, authenticated, login]);
  
  // Disconnect wallet
  const disconnectWallet = useCallback(() => {
    logout();
    setWalletData(undefined);
    setPortfolioTokens(undefined);
    setError(undefined);
  }, [logout]);
  
  return {
    address,
    chainId,
    isConnected: ready && authenticated && isConnected,
    isConnecting,
    walletData,
    portfolioTokens,
    totalValue,
    loading,
    error,
    refreshData,
    connectWallet,
    disconnectWallet
  };
}

// Hook for getting user address for SSR data fetching
export function useUserAddress(): string | undefined {
  const { ready, authenticated, user } = usePrivy();
  const { address } = useAccount();
  
  if (!ready || !authenticated) return undefined;
  
  // Prefer wagmi address, fallback to privy user address
  return address || user?.wallet?.address;
}

// Hook for enhanced token data with user context
export function useTokenWithUserData(symbol: string) {
  const [tokenData, setTokenData] = useState<TokenWithBalance>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>();
  const userAddress = useUserAddress();
  
  const fetchTokenData = useCallback(async () => {
    setLoading(true);
    setError(undefined);
    
    try {
      // This would call your actual API
      // For now, using mock data
      const mockToken: TokenWithBalance = {
        chainId: 1,
        symbol,
        name: symbol === 'ETH' ? 'Ethereum' : symbol,
        address: '0x0000000000000000000000000000000000000000',
        decimals: 18,
        rating: 5,
        eip2612: false,
        isFoT: false,
        tags: [],
        balance: userAddress ? '1.5' : undefined,
        balanceUSD: userAddress ? 4500 : undefined,
        priceUSD: 3000,
        change24h: (Math.random() - 0.5) * 10
      };
      
      setTokenData(mockToken);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch token data');
    } finally {
      setLoading(false);
    }
  }, [symbol, userAddress]);
  
  useEffect(() => {
    fetchTokenData();
  }, [fetchTokenData]);
  
  return { tokenData, loading, error, refetch: fetchTokenData };
}
