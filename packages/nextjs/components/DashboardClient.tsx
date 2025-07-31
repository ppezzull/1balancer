"use client";

import { useState, useEffect } from "react";
import { WalletHomeSection } from "./WalletHomeSection";
import { Header } from "./Header";

interface DashboardClientProps {
  portfolioData: any;
  marketData: any;
  userData: any;
}

export function DashboardClient({ portfolioData, marketData, userData }: DashboardClientProps) {
  const [activeWalletTab, setActiveWalletTab] = useState<'home' | 'portfolio' | 'trade' | 'social' | 'profile'>('home');
  const [isWalletConnected, setIsWalletConnected] = useState(false);

  // Listen for wallet connection events
  useEffect(() => {
    const handleWalletConnection = (event: CustomEvent) => {
      setIsWalletConnected(event.detail.connected);
    };

    window.addEventListener('wallet-connection-changed', handleWalletConnection as EventListener);
    return () => window.removeEventListener('wallet-connection-changed', handleWalletConnection as EventListener);
  }, []);

  // Check initial wallet connection state
  useEffect(() => {
    // You might want to check if wallet is already connected on page load
    // This depends on your wallet connection logic
    const checkWalletConnection = () => {
      // Placeholder - implement your wallet connection check logic
      setIsWalletConnected(true); // For now, assume connected since they're on dashboard
    };

    checkWalletConnection();
  }, []);

  const handleWalletTabChange = (tab: 'home' | 'portfolio' | 'trade' | 'social' | 'profile') => {
    setActiveWalletTab(tab);
  };

  return (
    <main className="min-h-screen bg-background">
      {/* Custom Header for Dashboard */}
      <Header 
        activeTab="home" // Dashboard is not part of main navigation tabs
        onTabChange={() => {}} // No-op for dashboard
        activeWalletTab={activeWalletTab}
        onWalletTabChange={handleWalletTabChange}
        isWalletConnected={isWalletConnected}
        showWalletNavigation={true} // Show wallet navigation in dashboard
      />
      
      {/* Main Dashboard Content */}
      <div className="pt-20"> {/* Account for fixed header height */}
        <WalletHomeSection 
          activeWalletTab={activeWalletTab}
          onWalletTabChange={handleWalletTabChange}
        />
      </div>
    </main>
  );
}