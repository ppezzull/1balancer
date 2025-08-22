"use client";

import { WalletHomeSectionSimplified } from "~~/components/sections/WalletHomeSectionSimplified";

export default function WalletTrade() {
  return (
    <WalletHomeSectionSimplified 
      activeWalletTab="trade"
      onWalletTabChange={() => {}} // Navigation handled by Next.js router
    />
  );
}