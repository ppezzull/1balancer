"use client";

import { WalletHomeSectionSimplified } from "~~/components/wallet/WalletHomeSectionSimplified";

export default function WalletHome() {
  return (
    <WalletHomeSectionSimplified 
      activeWalletTab="home"
      onWalletTabChange={() => {}} // Navigation handled by Next.js router
    />
  );
}