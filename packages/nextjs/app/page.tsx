"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { usePrivy } from "@privy-io/react-auth";
import { HomePage } from "~~/components/pages/HomePage";
import { getHomeData } from "~~/utils/storage";

export default function Home() {
  const router = useRouter();
  const { ready, authenticated } = usePrivy();
  const [homeData, setHomeData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Simulate SSR data fetching on client
  useEffect(() => {
    const fetchData = async () => {
      const data = await getHomeData();
      setHomeData(data);
      setLoading(false);
    };
    fetchData();
  }, []);

  const handleGetStarted = () => {
    if (ready && authenticated) {
      router.push('/wallet');
    } else {
      // If not authenticated, the HomePage component will handle wallet connection
      // and then we can redirect after successful connection
    }
  };

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
      activeTab="home"
      onGetStarted={handleGetStarted}
      onStartRebalancing={handleStartRebalancing}
      data={homeData}
    />
  );
}
