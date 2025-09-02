"use client";

import { useEffect, useState } from "react";
import { HomePage } from "~~/components/home/HomePage";
import { useWalletSSRData } from "~~/hooks/useWalletSSR";

interface AboutPageClientProps {
  initialData: any;
}

export function AboutPageClient({ initialData }: AboutPageClientProps) {
  const walletData = useWalletSSRData();
  const [aboutData, setAboutData] = useState(initialData.data);
  // const [loading, setLoading] = useState(false);

  // Refresh data when user connects wallet
  useEffect(() => {
    if (walletData.address && walletData.isConnected) {
      const refreshDataWithUser = async () => {
        try {
          // Replace with actual data fetch logic, e.g. getAboutSSRData(walletData.address)
          // For now, just set aboutData to walletData.address for demonstration
          // const updatedData = await getAboutSSRData(walletData.address);
          // setAboutData(updatedData.data);
          setAboutData(walletData.address);
        } catch (error) {
          console.error("Failed to refresh about data:", error);
        }
      };
      refreshDataWithUser();
    }
  }, [walletData.address, walletData.isConnected]);

  // Enhanced data with user context
  const enhancedData = {
    ...aboutData,
    isUserConnected: walletData.isConnected,
    userAddress: walletData.address,
  };

  return <HomePage activeTab="about" data={enhancedData} />;
}
