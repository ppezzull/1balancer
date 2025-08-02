import { useState, useEffect } from "react";
import { WalletHomeSectionSimplified } from "../components/WalletHomeSectionSimplified";
import { PieChartCreator } from "../components/PieChartCreator";

interface WalletPageProps {
  activeWalletTab: 'home' | 'portfolio' | 'trade' | 'social' | 'profile' | 'create-portfolio';
  onWalletTabChange: (tab: 'home' | 'portfolio' | 'trade' | 'social' | 'profile' | 'create-portfolio') => void;
}

export function WalletPage({ activeWalletTab, onWalletTabChange }: WalletPageProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);

  // Listen for template selection navigation event
  useEffect(() => {
    const handleNavigateToCreator = (event: CustomEvent) => {
      setSelectedTemplate(event.detail.template);
      onWalletTabChange('create-portfolio');
    };

    window.addEventListener('navigate-to-portfolio-creator', handleNavigateToCreator as EventListener);
    return () => window.removeEventListener('navigate-to-portfolio-creator', handleNavigateToCreator as EventListener);
  }, [onWalletTabChange]);

  // Check for stored template on mount
  useEffect(() => {
    const storedTemplate = localStorage.getItem('selectedPortfolioTemplate');
    if (storedTemplate && activeWalletTab === 'create-portfolio') {
      try {
        setSelectedTemplate(JSON.parse(storedTemplate));
      } catch (error) {
        console.error('Error parsing stored template:', error);
      }
    }
  }, [activeWalletTab]);

  if (activeWalletTab === 'create-portfolio') {
    return (
      <div className="min-h-screen bg-background">
        <PieChartCreator 
          initialTemplate={selectedTemplate}
          onBack={() => {
            // Clear stored template and navigate back
            localStorage.removeItem('selectedPortfolioTemplate');
            setSelectedTemplate(null);
            onWalletTabChange('home');
          }}
        />
      </div>
    );
  }

  return (
    <WalletHomeSectionSimplified 
      activeWalletTab={activeWalletTab}
      onWalletTabChange={onWalletTabChange}
    />
  );
}