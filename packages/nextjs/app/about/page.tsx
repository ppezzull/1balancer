"use client";

import { useState, useEffect } from "react";
import { HomePage } from "~~/components/home/HomePage";
import { getAboutData } from "~~/utils/storage";

export default function AboutPage() {
  const [aboutData, setAboutData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const data = await getAboutData();
      setAboutData(data);
      setLoading(false);
    };
    fetchData();
  }, []);

  if (loading) {
    return <div className="min-h-screen bg-background animate-pulse" />;
  }

  return (
    <HomePage 
      activeTab="about"
      data={aboutData}
    />
  );
}