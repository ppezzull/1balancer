"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { usePrivy } from "@privy-io/react-auth";
import { HomePage } from "~~/components/pages/HomePage";
import { useWalletSSRData } from "~~/hooks/useWalletSSR";
import { getHomeSSRData, type SSRPageData, type HomePageSSRData } from "~~/utils/ssr-data";

interface HomePageClientProps {
  initialData: SSRPageData<HomePageSSRData>;
}

export function HomePageClient({ initialData }: HomePageClientProps) {
  const router = useRouter();
  const { ready, authenticated } = usePrivy();
  const walletData = useWalletSSRData();
  const [homeData, setHomeData] = useState(initialData.data);
  const [loading, setLoading] = useState(false);

  // Refresh data when user connects wallet
  useEffect(() => {
    if (walletData.address && walletData.isConnected) {
      const refreshDataWithUser = async () => {
        setLoading(true);
        try {
          const updatedData = await getHomeSSRData(walletData.address);
          setHomeData(updatedData.data);
        } catch (error) {
          console.error('Failed to refresh home data:', error);
        } finally {
          setLoading(false);
        }
      };
      
      refreshDataWithUser();
    }
  }, [walletData.address, walletData.isConnected]);

  const handleGetStarted = () => {
    if (ready && authenticated && walletData.isConnected) {
      router.push('/wallet');
    } else {
      // If not authenticated, trigger wallet connection
      walletData.connectWallet();
    }
  };

  const handleStartRebalancing = () => {
    if (ready && authenticated && walletData.isConnected) {
      router.push('/rebalance');
    } else {
      // If not authenticated, trigger wallet connection
      walletData.connectWallet();
    }
  };

  // Enhanced data with user context
  const enhancedData = {
    ...homeData,
    userPortfolio: walletData.portfolioTokens,
    totalPortfolioValue: walletData.totalValue,
    isUserConnected: walletData.isConnected,
    userAddress: walletData.address
  };

  return (
    <HomePage 
      activeTab="home"
      onGetStarted={handleGetStarted}
      onStartRebalancing={handleStartRebalancing}
      data={enhancedData}
      loading={loading}
      walletData={walletData}
    />
  );
}
