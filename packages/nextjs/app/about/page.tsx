"use client";

import { useEffect, useState } from "react";
import { HomePage } from "~~/components/home/HomePage";
import { getAboutData } from "~~/utils/storage";

export default function AboutPage() {
  type AboutDataType = {
    testimonials: { name: string; role: string; content: string }[];
    sections: { title: string; description: string; icon: string }[];
    features: { security: string; automation: string; analytics: string };
  };
  const [aboutData, setAboutData] = useState<AboutDataType | null>(null);
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

  return <HomePage activeTab="about" data={aboutData} />;
}
