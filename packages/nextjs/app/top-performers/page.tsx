"use client";

import { useEffect, useState } from "react";
import { HomePage } from "~~/components/home/HomePage";
import { TokenWithBalance } from "~~/types/api";
import { getTopPerformersData } from "~~/utils/storage";

export default function TopPerformersPage() {
  type TopPerformersDataType = {
    marketTrends: { bullish: number; bearish: number; neutral: number };
    topPerformers: TokenWithBalance[];
    timeframes: string[];
    categories: string[];
    insights: { trendingUp: number; trendingDown: number; totalMarketCap: string; dominance: string };
  };
  const [topPerformersData, setTopPerformersData] = useState<TopPerformersDataType | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const data = await getTopPerformersData();
      setTopPerformersData(data);
      setLoading(false);
    };
    fetchData();
  }, []);

  if (loading) {
    return <div className="min-h-screen bg-background animate-pulse" />;
  }

  return <HomePage activeTab="top-performers" data={topPerformersData} />;
}
