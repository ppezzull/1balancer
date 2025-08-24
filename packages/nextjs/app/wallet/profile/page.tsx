"use client";

import { WalletHomeSectionSimplified } from "~~/components/wallet/WalletHomeSectionSimplified";

export default function WalletProfile() {
  return (
    <WalletHomeSectionSimplified 
      activeWalletTab="profile"
      onWalletTabChange={() => {}} // Navigation handled by Next.js router
    />
  );
}