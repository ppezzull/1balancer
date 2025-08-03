"use client";

import { useSearchParams } from "next/navigation";
import { HomePage } from "~~/components/pages/HomePage";
import { WalletPage } from "~~/components/pages/WalletPage";

export default function Home() {
  const searchParams = useSearchParams();
  const showWallet = searchParams.get('wallet') === 'true';
  const walletTab = searchParams.get('tab') as 'home' | 'portfolio' | 'trade' | 'social' | 'profile' | 'create-portfolio' || 'home';

  const handleGetStarted = () => {
    window.location.href = '/?wallet=true&tab=home';
  };

  const handleStartRebalancing = () => {
    window.location.href = '/?wallet=true&tab=home';
  };

  if (showWallet) {
    return (
      <WalletPage 
        activeWalletTab={walletTab}
        onWalletTabChange={(tab) => {
          window.location.href = `/?wallet=true&tab=${tab}`;
        }}
      />
    );
  }

  return (
    <HomePage 
      activeTab="home"
      onGetStarted={handleGetStarted}
      onStartRebalancing={handleStartRebalancing}
      isWalletConnected={false}
    />
  );
}
