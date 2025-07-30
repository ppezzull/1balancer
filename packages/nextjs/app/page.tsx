"use client";

import { useState, useEffect } from "react";
import { HeroSection } from "../components/figma/sections/HeroSection";
import { LoadingScreen } from "../components/figma/sections/LoadingScreen";
import { DynamicBackground } from "../components/figma/interactive/DynamicBackground";
import { getServerSidePortfolioData } from "../utils/storage";

export default function HomePage() {
  const [showLoading, setShowLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'home' | 'about' | 'rebalance' | 'top-performers'>('home');

  useEffect(() => {
    // Simulate initial loading
    const timer = setTimeout(() => {
      setShowLoading(false);
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  const handleSkipLoading = () => {
    setShowLoading(false);
  };

  const handleGetStarted = () => {
    // Navigate to dashboard or wallet connection
    setActiveTab('rebalance');
    // In a real app, you would use Next.js router
    window.location.href = '/dashboard';
  };

  if (showLoading) {
    return <LoadingScreen onSkip={handleSkipLoading} />;
  }

  return (
    <main className="relative min-h-screen overflow-hidden">
      {/* Dynamic Background Effects */}
      <DynamicBackground />
      
      {/* Hero Section */}
      <div className="relative z-10">
        <HeroSection onGetStarted={handleGetStarted} />
      </div>
      
      {/* SEO Content */}
      <section className="sr-only">
        <h1>1Balancer - DeFi Portfolio Management Platform</h1>
        <p>
          The next-generation decentralized portfolio management platform that simplifies 
          and amplifies your investment strategy with innovative DeFi tools.
        </p>
        <h2>Key Features</h2>
        <ul>
          <li>Smart Portfolio Balancing with AI-powered optimization</li>
          <li>Automated Rebalancing based on market conditions</li>
          <li>Multi-chain Portfolio Management across Ethereum, Polygon, Arbitrum</li>
          <li>Real-time Performance Analytics and reporting</li>
          <li>Social Trading and Portfolio Sharing</li>
        </ul>
        <h2>Supported Networks</h2>
        <p>
          1Balancer supports portfolio management across multiple blockchain networks including 
          Ethereum, Polygon, Arbitrum, Optimism, and Base for maximum flexibility.
        </p>
      </section>
      
      {/* Structured Data for SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            "name": "1Balancer",
            "description": "DeFi Portfolio Management Platform",
            "url": "https://1balancer.com",
            "applicationCategory": "FinanceApplication",
            "operatingSystem": "Web",
            "offers": {
              "@type": "Offer",
              "price": "0",
              "priceCurrency": "USD"
            },
            "featureList": [
              "Portfolio Balancing",
              "Automated Rebalancing", 
              "Multi-chain Support",
              "Performance Analytics",
              "Social Trading"
            ]
          })
        }}
      />
    </main>
  );
}