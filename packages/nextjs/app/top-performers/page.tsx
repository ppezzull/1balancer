"use client";

import { HomePage } from "~~/components/pages/HomePage";

export default function TopPerformersPage() {
  return (
    <HomePage 
      activeTab="top-performers"
      isWalletConnected={false}
    />
  );
}