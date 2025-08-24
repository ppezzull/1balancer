"use client";

import { useState, useEffect } from "react";
import { HomePage } from "~~/components/home/HomePage";
import { useWalletSSRData } from "~~/hooks/useWalletSSR";
import { getAboutSSRData, type SSRPageData, type AboutPageSSRData } from "~~/utils/ssr-data";

interface AboutPageClientProps {
  initialData: SSRPageData<AboutPageSSRData>;
}

export function AboutPageClient({ initialData }: AboutPageClientProps) {
  const walletData = useWalletSSRData();
  const [aboutData, setAboutData] = useState(initialData.data);
  const [loading, setLoading] = useState(false);

  // Refresh data when user connects wallet
  useEffect(() => {
    if (walletData.address && walletData.isConnected) {
      const refreshDataWithUser = async () => {
        setLoading(true);
        try {
          const updatedData = await getAboutSSRData(walletData.address);
          setAboutData(updatedData.data);
        } catch (error) {
          console.error('Failed to refresh about data:', error);
        } finally {
          setLoading(false);
        }
      };
      
      refreshDataWithUser();
    }
  }, [walletData.address, walletData.isConnected]);

  // Enhanced data with user context
  const enhancedData = {
    ...aboutData,
    isUserConnected: walletData.isConnected,
    userAddress: walletData.address
  };

  return (
    <HomePage 
      activeTab="about"
      data={enhancedData}
      loading={loading}
      walletData={walletData}
    />
  );
}
