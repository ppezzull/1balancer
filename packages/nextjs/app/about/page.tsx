"use client";

import { HomePage } from "~~/components/pages/HomePage";

export default function AboutPage() {
  return (
    <HomePage 
      activeTab="about"
      isWalletConnected={false}
    />
  );
}