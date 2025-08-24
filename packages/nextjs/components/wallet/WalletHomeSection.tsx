import React, { useState, useEffect, useCallback } from "react";
import { CryptoDetailScreen } from "~~/components/trade/CryptoDetailScreen";
import { UserProfileSection } from "~~/components/profile/UserProfileSection";
import { SocialSection } from "~~/components/social/SocialSection";
import { TradeSection } from "~~/components/trade/TradeSection";
import { PortfolioSection } from "~~/components/portfolio/PortfolioSection";
import { PieChartCreator } from "~~/components/shared/PieChartCreator";
import { WalletHero } from "./WalletHero";
import { WalletStats } from "./WalletStats";
import { PortfolioOptions } from "./PortfolioOptions";
import { TemplateSelectionModal } from "./TemplateSelectionModal";
import { RebalanceConfigModal } from "./RebalanceConfigModal";
import { initializeDefaultPortfolios } from "~~/utils/constants";
import { toast } from "sonner";

interface WalletHomeSectionProps {
  activeWalletTab: 'home' | 'portfolio' | 'trade' | 'social' | 'profile';
  onWalletTabChange: (tab: 'home' | 'portfolio' | 'trade' | 'social' | 'profile') => void;
}

export function WalletHomeSection({ activeWalletTab, onWalletTabChange }: WalletHomeSectionProps) {
  const [showCreatePortfolio, setShowCreatePortfolio] = useState(false);
  const [selectedCrypto, setSelectedCrypto] = useState<any>(null);
  const [defaultPortfolios, setDefaultPortfolios] = useState<any[]>([]);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const [showRebalanceConfigModal, setShowRebalanceConfigModal] = useState(false);
  const [rebalanceType, setRebalanceType] = useState<'drift' | 'time'>('drift');
  const [rebalanceConfig, setRebalanceConfig] = useState({
    drift: {
      threshold: 5,
      rebalanceAmount: 1000
    },
    time: {
      frequency: 'monthly',
      amount: 500
    }
  });

  // Load default portfolios on component mount
  useEffect(() => {
    try {
      const portfolios = initializeDefaultPortfolios();
      setDefaultPortfolios(portfolios);
    } catch (error) {
      console.error("Error loading default portfolios:", error);
    }
  }, []);

  const handleBackFromDetail = useCallback(() => {
    setSelectedCrypto(null);
  }, []);

  const handlePresetSelect = useCallback((presetId: string) => {
    const preset = defaultPortfolios.find(p => p.id === presetId);
    if (preset) {
      toast.success(`Portfolio "${preset.name}" loaded!`, {
        description: `Ready to customize and deploy your ${preset.name} strategy`,
        duration: 3000,
      });
      
      onWalletTabChange('portfolio');
    }
  }, [defaultPortfolios, onWalletTabChange]);

  const handleTemplateSelect = useCallback((template: any) => {
    setSelectedTemplate(template);
    setShowTemplateModal(false);
    setShowRebalanceConfigModal(true);
  }, []);

  const handleRebalanceConfigSubmit = useCallback(() => {
    if (!selectedTemplate) return;

    try {
      const existingPortfolios = localStorage.getItem("user-portfolios");
      const portfolios = existingPortfolios ? JSON.parse(existingPortfolios) : [];
      
      const newPortfolio = {
        ...selectedTemplate,
        id: `portfolio_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: `My ${selectedTemplate.name}`,
        createdAt: new Date().toISOString(),
        isTemplate: false,
        isPublic: false,
        customized: true,
        investmentType: rebalanceType,
        rebalanceConfig: rebalanceType === 'drift' ? {
          driftThreshold: rebalanceConfig.drift.threshold
        } : {
          rebalanceFrequency: rebalanceConfig.time.frequency as 'weekly' | 'monthly' | 'quarterly'
        }
      };
      
      portfolios.push(newPortfolio);
      localStorage.setItem("user-portfolios", JSON.stringify(portfolios));
      
      setShowRebalanceConfigModal(false);
      setSelectedTemplate(null);
      setRebalanceType('drift');
      
      toast.success(`Portfolio "${selectedTemplate.name}" added successfully!`, {
        description: `Template with ${rebalanceType} rebalancing has been added to your portfolios.`,
        duration: 4000,
      });
      
      setTimeout(() => {
        onWalletTabChange('portfolio');
      }, 500);
      
    } catch (error) {
      console.error("Error adding template to portfolio:", error);
      toast.error("Failed to add portfolio template", {
        description: "Please try again later",
      });
    }
  }, [selectedTemplate, rebalanceType, rebalanceConfig, onWalletTabChange]);

  const handleOpenTemplates = useCallback(() => {
    setShowTemplateModal(true);
  }, []);

  // Show crypto detail screen if one is selected
  if (selectedCrypto) {
    return (
      <CryptoDetailScreen 
        crypto={selectedCrypto} 
        onBack={handleBackFromDetail}
      />
    );
  }

  if (activeWalletTab === 'portfolio') {
    return <PortfolioSection />;
  }

  if (activeWalletTab === 'profile') {
    return <UserProfileSection />;
  }

  if (activeWalletTab === 'social') {
    return <SocialSection />;
  }

  if (activeWalletTab === 'trade') {
    return <TradeSection />;
  }

  if (showCreatePortfolio) {
    return (
      <PieChartCreator 
        onBack={() => {
          setShowCreatePortfolio(false);
        }}
      />
    );
  }

  return (
    <div className="min-h-screen">
      <div className="px-4 sm:px-6 py-6 space-y-8">
        <WalletHero />
        <WalletStats defaultPortfolios={defaultPortfolios} />
        <PortfolioOptions 
          onCreateCustom={() => setShowCreatePortfolio(true)}
          onOpenTemplates={handleOpenTemplates}
          defaultPortfolios={defaultPortfolios}
        />

        <TemplateSelectionModal
          isOpen={showTemplateModal}
          onClose={() => setShowTemplateModal(false)}
          templates={defaultPortfolios}
          onSelect={handleTemplateSelect}
        />

        <RebalanceConfigModal
          isOpen={showRebalanceConfigModal}
          onClose={() => setShowRebalanceConfigModal(false)}
          selectedTemplate={selectedTemplate}
          rebalanceType={rebalanceType}
          setRebalanceType={setRebalanceType}
          rebalanceConfig={rebalanceConfig}
          setRebalanceConfig={setRebalanceConfig}
          onSubmit={handleRebalanceConfigSubmit}
        />
      </div>
    </div>
  );
}