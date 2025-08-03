"use client";

import { HomePage } from "~~/components/pages/HomePage";

export default function RebalancePage() {
  const handleStartRebalancing = () => {
    window.location.href = '/?wallet=true&tab=home';
  };

  return (
    <HomePage 
      activeTab="rebalance"
      onStartRebalancing={handleStartRebalancing}
      isWalletConnected={false}
    />
  );
}