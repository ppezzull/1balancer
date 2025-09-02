"use client";

import { About } from "../about/About";
import { Rebalance } from "../rebalance/Rebalance";
import { TopPerformersSection } from "../top-performers/TopPerformersSection";
import { Home } from "./Home";
import { motion } from "motion/react";

interface InteractiveMainContentProps {
  activeTab: "home" | "about" | "rebalance" | "top-performers";
  onGetStarted?: () => void;
  onStartRebalancing?: () => void;
  data?: any;
}

export function InteractiveMainContent({
  activeTab,
  onGetStarted,
  onStartRebalancing,
  data,
}: InteractiveMainContentProps) {
  const renderContent = () => {
    switch (activeTab) {
      case "home":
        return <Home onGetStarted={onGetStarted} data={data} />;
      case "about":
        return <About onGetStarted={onGetStarted} data={data} />;
      case "rebalance":
        return <Rebalance onStartRebalancing={onStartRebalancing} />;
      case "top-performers":
        return <TopPerformersSection />;
      default:
        return <Home onGetStarted={onGetStarted} data={data} />;
    }
  };

  return (
    <div className="w-full h-full flex items-center justify-center relative">
      <div className="w-full h-full flex items-center justify-center">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
          className="w-full"
        >
          {renderContent()}
        </motion.div>
      </div>
    </div>
  );
}
