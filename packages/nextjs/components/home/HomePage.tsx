"use client";

import { InteractiveMainContent } from "./InteractiveMainContent";

interface HomePageProps {
  activeTab: "home" | "about" | "rebalance" | "top-performers";
  onGetStarted?: () => void;
  onStartRebalancing?: () => void;
  data?: any;
}

export function HomePage({ activeTab, onGetStarted, onStartRebalancing, data }: HomePageProps) {
  return (
    <InteractiveMainContent
      activeTab={activeTab}
      onGetStarted={activeTab === "home" ? onGetStarted : undefined}
      onStartRebalancing={onStartRebalancing}
      data={data}
    />
  );
}
