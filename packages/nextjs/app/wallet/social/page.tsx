"use client";

import { WalletHomeSectionSimplified } from "~~/components/sections/WalletHomeSectionSimplified";

export default function WalletSocial() {
  return (
    <WalletHomeSectionSimplified 
      activeWalletTab="social"
      onWalletTabChange={() => {}} // Navigation handled by Next.js router
    />
  );
}