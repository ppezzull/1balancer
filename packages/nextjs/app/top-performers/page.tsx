"use client";

import { useState, useEffect } from "react";
import { HomePage } from "~~/components/pages/HomePage";
import { getTopPerformersData } from "~~/utils/storage";

export default function TopPerformersPage() {
  const [topPerformersData, setTopPerformersData] = useState(null);
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

  return (
    <HomePage 
      activeTab="top-performers"
      data={topPerformersData}
    />
  );
}