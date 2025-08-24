"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion } from "motion/react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~~/components/shared/card";
import { Button } from "~~/components/shared/button";
import { Badge } from "~~/components/shared/badge";
import { 
  PieChart, 
  ArrowRight, 
  DollarSign, 
  BarChart3, 
  Zap, 
  Sparkles, 
  Users,
  Rocket,
  Shield,
  Target,
  TrendingUp,
  Star,
  Crown,
  Globe,
  Bot,
  Clock,
  Activity
} from "lucide-react";
import { initializeDefaultPortfolios } from "~~/utils/constants";
import { toast } from "sonner";
import { PortfolioSection } from "../portfolio/PortfolioSection";
import { TradeSection } from "../trade/TradeSection";
import { SocialSection } from "../social/SocialSection";
import { UserProfileSection } from "../profile/UserProfileSection";
import { PieChartCreator } from "../shared/PieChartCreator";
import { TemplateSelectionModal } from "../wallet/TemplateSelectionModal";
import { TemplateConfigurationModal } from "../wallet/TemplateConfigurationModal";

interface WalletHomeSectionProps {
  activeWalletTab: 'home' | 'portfolio' | 'trade' | 'social' | 'profile';
  onWalletTabChange: (tab: 'home' | 'portfolio' | 'trade' | 'social' | 'profile') => void;
}

export function WalletHomeSectionSimplified({ activeWalletTab, onWalletTabChange }: WalletHomeSectionProps) {
  const [defaultPortfolios, setDefaultPortfolios] = useState<any[]>([]);
  const [showPieChartCreator, setShowPieChartCreator] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [showTemplateConfigModal, setShowTemplateConfigModal] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);

  // Load default portfolios on component mount
  useEffect(() => {
    try {
      const portfolios = initializeDefaultPortfolios();
      setDefaultPortfolios(portfolios);
      
      // Clean up any duplicate portfolios that might exist
      cleanupDuplicatePortfolios();
    } catch (error) {
      console.error("Error loading default portfolios:", error);
    }
  }, []);

  // Function to clean up duplicate portfolios
  const cleanupDuplicatePortfolios = () => {
    try {
      // Clean user-portfolios
      const userPortfolios = localStorage.getItem("user-portfolios");
      if (userPortfolios) {
        const parsed = JSON.parse(userPortfolios);
        if (Array.isArray(parsed)) {
          const uniquePortfolios = parsed.reduce((acc: any[], current: any) => {
            if (current.id && !acc.some(p => p.id === current.id)) {
              acc.push(current);
            }
            return acc;
          }, []);
          
          if (uniquePortfolios.length !== parsed.length) {
            localStorage.setItem("user-portfolios", JSON.stringify(uniquePortfolios));
            console.log(`🧹 Cleaned ${parsed.length - uniquePortfolios.length} duplicate portfolios from user-portfolios`);
          }
        }
      }

      // Clean 1balancer-portfolios
      const savedPortfolios = localStorage.getItem("1balancer-portfolios");
      if (savedPortfolios) {
        const parsed = JSON.parse(savedPortfolios);
        if (Array.isArray(parsed)) {
          const uniquePortfolios = parsed.reduce((acc: any[], current: any) => {
            if (current.id && !acc.some(p => p.id === current.id)) {
              acc.push(current);
            }
            return acc;
          }, []);
          
          if (uniquePortfolios.length !== parsed.length) {
            localStorage.setItem("1balancer-portfolios", JSON.stringify(uniquePortfolios));
            console.log(`🧹 Cleaned ${parsed.length - uniquePortfolios.length} duplicate portfolios from 1balancer-portfolios`);
          }
        }
      }
    } catch (error) {
      console.error("Error cleaning duplicate portfolios:", error);
    }
  };

  // Listen for navigation events from other components
  useEffect(() => {
    const handleNavigateToPieChart = () => {
      setShowPieChartCreator(true);
    };

    window.addEventListener('navigate-to-pie-chart', handleNavigateToPieChart);
    
    return () => {
      window.removeEventListener('navigate-to-pie-chart', handleNavigateToPieChart);
    };
  }, []);

  // Handle template selection from template modal
  const handleTemplateSelection = useCallback((template: any) => {
    setSelectedTemplate(template);
    setShowTemplateModal(false);
    setShowTemplateConfigModal(true);
  }, []);

  // Handle template configuration completion
  const handleTemplateConfiguration = useCallback((config: {
    template: any;
    rebalanceType: 'drift' | 'time';
    portfolioName: string;
    rebalanceConfig: {
      driftThreshold?: number;
      rebalanceFrequency?: 'weekly' | 'monthly' | 'quarterly' | 'semi-annual';
    };
  }) => {
    try {
      // Get existing user portfolios
      const existingPortfolios = localStorage.getItem("user-portfolios");
      const portfolios = existingPortfolios ? JSON.parse(existingPortfolios) : [];
      
      // Create a copy of the template for the user with unique ID and configuration
      const timestamp = Date.now();
      const randomId = Math.random().toString(36).substr(2, 9);
      const userPortfolio = {
        ...config.template,
        id: `user_template_${timestamp}_${randomId}`,
        name: config.portfolioName,
        investmentType: config.rebalanceType,
        rebalanceConfig: config.rebalanceConfig,
        createdAt: new Date().toISOString(),
        isTemplate: false,
        isPublic: false,
        originalTemplateId: config.template.id,
      };
      
      // Add to user portfolios
      portfolios.push(userPortfolio);
      localStorage.setItem("user-portfolios", JSON.stringify(portfolios));
      
      // Also add to the main portfolios storage
      const mainPortfolios = localStorage.getItem("1balancer-portfolios");
      const allPortfolios = mainPortfolios ? JSON.parse(mainPortfolios) : [];
      allPortfolios.push(userPortfolio);
      localStorage.setItem("1balancer-portfolios", JSON.stringify(allPortfolios));
      
      // Close modal and show success
      setShowTemplateConfigModal(false);
      setSelectedTemplate(null);
      
      const rebalanceDescription = config.rebalanceType === 'drift' 
        ? `with ${config.rebalanceConfig.driftThreshold}% drift threshold`
        : `with ${config.rebalanceConfig.rebalanceFrequency} rebalancing`;
      
      toast.success(`Portfolio "${config.portfolioName}" created successfully!`, {
        description: `Professional template configured ${rebalanceDescription}`,
        duration: 4000,
      });
      
      // Emit event to refresh portfolio list
      window.dispatchEvent(new CustomEvent('portfolios-updated'));
      
    } catch (error) {
      console.error("Error creating portfolio from template:", error);
      toast.error("Failed to create portfolio", {
        description: "Please try again later",
      });
    }
  }, []);

  // Show different content based on active tab
  if (activeWalletTab === 'portfolio') {
    return <PortfolioSection />;
  }

  if (activeWalletTab === 'trade') {
    return <TradeSection />;
  }

  if (activeWalletTab === 'social') {
    return <SocialSection />;
  }

  if (activeWalletTab === 'profile') {
    return <UserProfileSection />;
  }

  // Show PieChartCreator if active
  if (showPieChartCreator) {
    return (
      <PieChartCreator 
        onBack={() => setShowPieChartCreator(false)}
      />
    );
  }

  // Home tab content
  return (
    <div className="min-h-screen">
      <div className="px-4 sm:px-6 py-6 space-y-8">
        {/* Welcome Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center space-y-4 py-8"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-teal-500/10 to-cyan-500/10 border border-teal-500/20">
            <Sparkles className="w-4 h-4 text-teal-500" />
            <span className="text-sm font-medium text-teal-600 dark:text-teal-400">
              Portfolio Management Hub
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-foreground">
            Build Your Perfect 
            <span className="bg-gradient-to-r from-teal-400 to-cyan-500 bg-clip-text text-transparent"> Portfolio</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Create custom portfolios or choose from our professionally crafted strategies. 
            Start building your DeFi investment future today.
          </p>
        </motion.div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <Card className="border border-border/50 bg-card/80 backdrop-blur-sm h-full shadow-sm hover:shadow-md transition-all duration-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">Total Value</span>
                  <DollarSign className="w-4 h-4 text-green-500" />
                </div>
                <p className="text-2xl font-bold text-foreground">$0.00</p>
                <p className="text-xs text-muted-foreground mt-1">Ready to invest</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <Card className="border border-border/50 bg-card/80 backdrop-blur-sm h-full shadow-sm hover:shadow-md transition-all duration-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">Portfolios</span>
                  <PieChart className="w-4 h-4 text-cyan-500" />
                </div>
                <p className="text-2xl font-bold text-foreground">{defaultPortfolios.length}</p>
                <p className="text-xs text-muted-foreground mt-1">Ready strategies</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <Card className="border border-border/50 bg-card/80 backdrop-blur-sm h-full shadow-sm hover:shadow-md transition-all duration-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">Assets</span>
                  <BarChart3 className="w-4 h-4 text-purple-500" />
                </div>
                <p className="text-2xl font-bold text-foreground">60+</p>
                <p className="text-xs text-muted-foreground mt-1">ERC-20 tokens</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <Card className="border border-border/50 bg-card/80 backdrop-blur-sm h-full shadow-sm hover:shadow-md transition-all duration-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">Rebalancing</span>
                  <Target className="w-4 h-4 text-orange-500" />
                </div>
                <p className="text-2xl font-bold text-foreground">Auto</p>
                <p className="text-xs text-muted-foreground mt-1">Drift & Time based</p>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Create Portfolio Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="space-y-6"
        >
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-bold text-foreground">Start Your Investment Journey</h2>
            <p className="text-muted-foreground">Choose how you want to build your portfolio</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Custom Portfolio Creation */}
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Card 
                className="relative overflow-hidden border border-border/30 bg-gradient-to-br from-card/80 to-card/60 backdrop-blur-sm hover:from-card/90 hover:to-card/70 transition-all duration-300 group cursor-pointer h-full"
                onClick={() => {
                  setShowPieChartCreator(true);
                }}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-teal-500/10 to-cyan-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <CardHeader className="relative z-10 pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-xl font-semibold bg-gradient-to-r from-teal-400 to-cyan-500 bg-clip-text text-transparent">
                      Create Custom Portfolio
                    </CardTitle>
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-teal-400 to-cyan-500 flex items-center justify-center">
                      <PieChart className="w-6 h-6 text-white" />
                    </div>
                  </div>
                  <CardDescription className="text-muted-foreground">
                    Build your own investment strategy from scratch
                  </CardDescription>
                </CardHeader>
                <CardContent className="relative z-10 pt-4 space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Create custom allocation charts, choose from 60+ ERC-20 tokens, 
                    set precise percentages, and configure automated rebalancing.
                  </p>

                  <div className="flex items-center gap-2 text-teal-500 group-hover:text-teal-400 transition-colors">
                    <span className="text-sm font-medium">Start Building</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Portfolio Templates */}
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Card 
                className="relative overflow-hidden border border-border/30 bg-gradient-to-br from-card/80 to-card/60 backdrop-blur-sm hover:from-card/90 hover:to-card/70 transition-all duration-300 group cursor-pointer h-full"
                onClick={() => {
                  setShowTemplateModal(true);
                }}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-indigo-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <CardHeader className="relative z-10 pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-xl font-semibold bg-gradient-to-r from-purple-400 to-indigo-500 bg-clip-text text-transparent">
                      Professional Templates
                    </CardTitle>
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-400 to-indigo-500 flex items-center justify-center">
                      <Crown className="w-6 h-6 text-white" />
                    </div>
                  </div>
                  <CardDescription className="text-muted-foreground">
                    Choose from expertly crafted portfolio strategies
                  </CardDescription>
                </CardHeader>
                <CardContent className="relative z-10 pt-4 space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Access {defaultPortfolios.length} professional portfolios including 1Balancer EndGame, 
                    DeFi strategies, Real Yield RWA, and specialized sector focuses.
                  </p>
                  
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Rocket className="w-3 h-3" />
                      <span>High Performance</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Shield className="w-3 h-3" />
                      <span>Risk Managed</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      <span>Community Tested</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-purple-500 group-hover:text-purple-400 transition-colors">
                    <span className="text-sm font-medium">Explore Templates</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </motion.div>
      </div>

      {/* Template Selection Modal */}
      <TemplateSelectionModal
        isOpen={showTemplateModal}
        onClose={() => setShowTemplateModal(false)}
        templates={defaultPortfolios}
        onSelect={handleTemplateSelection}
      />

      {/* Template Configuration Modal */}
      <TemplateConfigurationModal
        isOpen={showTemplateConfigModal}
        onClose={() => {
          setShowTemplateConfigModal(false);
          setSelectedTemplate(null);
        }}
        template={selectedTemplate}
        onConfirm={handleTemplateConfiguration}
      />
    </div>
  );
}