"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { usePrivy } from "@privy-io/react-auth";
import { HomePage } from "~~/components/pages/HomePage";
import { getRebalanceData } from "~~/utils/storage";

export default function RebalancePage() {
  const router = useRouter();
  const { ready, authenticated } = usePrivy();
  const [rebalanceData, setRebalanceData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const data = await getRebalanceData();
      setRebalanceData(data);
      setLoading(false);
    };
    fetchData();
  }, []);

  const handleStartRebalancing = () => {
    if (ready && authenticated) {
      router.push('/wallet');
    } else {
      // If not authenticated, the HomePage component will handle wallet connection
    }
  };

  if (loading) {
    return <div className="min-h-screen bg-background animate-pulse" />;
  }

  return (
    <HomePage 
      activeTab="rebalance"
      onStartRebalancing={handleStartRebalancing}
      data={rebalanceData}
    />
  );
}