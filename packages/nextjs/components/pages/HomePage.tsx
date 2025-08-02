import { InteractiveMainContent } from "../components/InteractiveMainContent";

interface HomePageProps {
  activeTab: 'home' | 'about' | 'rebalance' | 'top-performers';
  onGetStarted?: () => void;
  onStartRebalancing?: () => void;
  isWalletConnected?: boolean;
}

export function HomePage({ activeTab, onGetStarted, onStartRebalancing, isWalletConnected }: HomePageProps) {
  return (
    <InteractiveMainContent 
      activeTab={activeTab} 
      onGetStarted={activeTab === 'home' ? onGetStarted : undefined}
      onStartRebalancing={onStartRebalancing}
      isWalletConnected={isWalletConnected}
    />
  );
}