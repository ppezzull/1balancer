"use client";

import { WalletHomeSectionSimplified } from "~~/components/WalletHomeSectionSimplified";

export default function WalletPortfolio() {
  return (
    <WalletHomeSectionSimplified 
      activeWalletTab="portfolio"
      onWalletTabChange={() => {}} // Navigation handled by Next.js router
    />
  );
}