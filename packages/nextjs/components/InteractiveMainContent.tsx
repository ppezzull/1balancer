import { motion } from "framer-motion";
import { HeroSection } from "./HeroSection";
import { AboutSection } from "./AboutSection";
import { RebalanceSection } from "./RebalanceSection"; 
import { TopPerformersSection } from "./TopPerformersSection";

interface InteractiveMainContentProps {
  activeTab: 'home' | 'about' | 'rebalance' | 'top-performers';
  onGetStarted?: () => void;
  onStartRebalancing?: () => void;
}

export function InteractiveMainContent({ activeTab, onGetStarted, onStartRebalancing }: InteractiveMainContentProps) {
  const renderContent = () => {
    switch (activeTab) {
      case 'home':
        return <HeroSection onGetStarted={onGetStarted} />;
      case 'about':
        return <AboutSection />;
      case 'rebalance':
        return <RebalanceSection onStartRebalancing={onStartRebalancing} />;
      case 'top-performers':
        return <TopPerformersSection />;
      default:
        return <HeroSection onGetStarted={onGetStarted} />;
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