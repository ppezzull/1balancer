import { useState, useEffect, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import { Badge } from "./ui/badge";
import { useTheme } from "./ui/use-theme";
import { useIsMobile } from "./ui/use-mobile";
import { TrendingUp, TrendingDown, PieChart, Eye, Star, Flame, X, ArrowRight, DollarSign, BarChart3, Zap, Sparkles, Users } from "lucide-react";
import { CRYPTOCURRENCY_DATA } from "../utils/constants";
import { PieChartCreator } from "./PieChartCreator";
import { PortfolioSection } from "./PortfolioSection";
import { CryptoDetailScreen } from "./CryptoDetailScreen";
import { UserProfileSection } from "./UserProfileSection";
import { SocialSection } from "./SocialSection";
import { TradeSection } from "./TradeSection";
import { ImageWithFallback } from "./figma/ImageWithFallback";

interface WalletHomeSectionProps {
  activeWalletTab: 'home' | 'portfolio' | 'trade' | 'social' | 'profile';
  onWalletTabChange: (tab: 'home' | 'portfolio' | 'trade' | 'social' | 'profile') => void;
}

const CATEGORIES = [
  { id: 'all', label: 'All Assets', icon: BarChart3 },
  { id: 'defi', label: 'DeFi', icon: Zap },
  { id: 'layer2', label: 'Layer 2', icon: Sparkles },
  { id: 'stablecoin', label: 'Stablecoins', icon: DollarSign },
];

const PRESET_FILTERS = [
  { id: 'trending', label: 'Trending', icon: Flame },
  { id: 'watchlist', label: 'My Watchlist', icon: Eye },
  { id: 'gainers', label: 'Top Gainers', icon: TrendingUp },
  { id: 'popular', label: 'Most Traded', icon: Star },
];

export function WalletHomeSection({ activeWalletTab, onWalletTabChange }: WalletHomeSectionProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedFilter, setSelectedFilter] = useState('trending');
  const [showCreatePortfolio, setShowCreatePortfolio] = useState(false);
  const [selectedCrypto, setSelectedCrypto] = useState<typeof CRYPTOCURRENCY_DATA[0] | null>(null);
  const { isDark } = useTheme();
  const isMobile = useIsMobile();

  // Tab switching
  const handleTabChange = useCallback((tab: 'home' | 'portfolio' | 'trade' | 'social' | 'profile') => {
    onWalletTabChange(tab);
  }, [onWalletTabChange]);

  // Memoized filtered crypto data
  const filteredCrypto = useMemo(() => {
    let filtered = CRYPTOCURRENCY_DATA;

    // Category filter
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(crypto => crypto.category === selectedCategory);
    }

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(crypto => 
        crypto.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        crypto.symbol.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Preset filters
    switch (selectedFilter) {
      case 'gainers':
        filtered = filtered.filter(crypto => parseFloat(crypto.change) > 0);
        break;
      case 'trending':
        filtered = filtered.slice(0, 12); // Show top trending
        break;
      case 'popular':
        filtered = filtered.slice(0, 8); // Show most popular
        break;
      case 'watchlist':
        filtered = filtered.slice(0, 6); // Mock watchlist
        break;
    }

    return filtered;
  }, [searchTerm, selectedCategory, selectedFilter]);

  const handleCryptoClick = useCallback((crypto: typeof CRYPTOCURRENCY_DATA[0]) => {
    setSelectedCrypto(crypto);
  }, []);

  const handleBackFromDetail = useCallback(() => {
    setSelectedCrypto(null);
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
      <PieChartCreator onBack={() => setShowCreatePortfolio(false)} />
    );
  }

  return (
    <div className="min-h-screen">
      {/* Wallet Navigation */}


      <div className="px-4 sm:px-6 py-6 space-y-8">
        {/* Hero Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Create Portfolio Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Card className="relative overflow-hidden border border-border/30 bg-gradient-to-br from-card/80 to-card/60 backdrop-blur-sm hover:from-card/90 hover:to-card/70 transition-all duration-300 group cursor-pointer h-full"
              onClick={() => setShowCreatePortfolio(true)}>
              <div className="absolute inset-0 bg-gradient-to-br from-teal-500/10 to-cyan-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <CardHeader className="relative z-10 pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl font-semibold bg-gradient-to-r from-teal-400 to-cyan-500 bg-clip-text text-transparent">
                    Create Your Portfolio
                  </CardTitle>
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-teal-400 to-cyan-500 flex items-center justify-center">
                    <PieChart className="w-6 h-6 text-white" />
                  </div>
                </div>
                <CardDescription className="text-muted-foreground">
                  Build and manage your DeFi investment strategy
                </CardDescription>
              </CardHeader>
              <CardContent className="relative z-10 pt-4">
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground mb-4">
                      Create custom pie charts, set allocation percentages, and track your portfolio performance across multiple assets.
                    </p>
                    <div className="flex items-center gap-2 text-teal-500 group-hover:text-teal-400 transition-colors">
                      <span className="text-sm font-medium">Get Started</span>
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                  <div className="flex-shrink-0 opacity-60 group-hover:opacity-80 transition-opacity">
                    <ImageWithFallback 
                      src="https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=200&h=200&fit=crop&crop=center&auto=format&q=80" 
                      alt="Portfolio visualization"
                      className="w-20 h-20 object-contain"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 gap-4">
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
                  <p className="text-xs text-muted-foreground mt-1">Connect wallet to view</p>
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
                    <span className="text-sm text-muted-foreground">Assets</span>
                    <BarChart3 className="w-4 h-4 text-cyan-500" />
                  </div>
                  <p className="text-2xl font-bold text-foreground">36+</p>
                  <p className="text-xs text-muted-foreground mt-1">ERC-20 tokens</p>
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
                    <span className="text-sm text-muted-foreground">Networks</span>
                    <Sparkles className="w-4 h-4 text-purple-500" />
                  </div>
                  <p className="text-2xl font-bold text-foreground">5</p>
                  <p className="text-xs text-muted-foreground mt-1">Ethereum & L2s</p>
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
                    <span className="text-sm text-muted-foreground">24h Change</span>
                    <TrendingUp className="w-4 h-4 text-green-500" />
                  </div>
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">+2.4%</p>
                  <p className="text-xs text-muted-foreground mt-1">Market average</p>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>

        {/* Search and Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="space-y-4"
        >
          {/* Search Bar */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search assets..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-3 pr-10 rounded-xl border border-border/50 bg-card/80 backdrop-blur-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500/50 transition-all shadow-sm"
            />
          </div>

          {/* Filter Tabs */}
          <div className="flex flex-wrap gap-2">
            {PRESET_FILTERS.map((filter) => {
              const Icon = filter.icon;
              return (
                <button
                  key={filter.id}
                  onClick={() => setSelectedFilter(filter.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                    selectedFilter === filter.id
                      ? 'bg-gradient-to-r from-teal-500 to-cyan-500 text-white'
                      : 'bg-card/70 text-muted-foreground hover:text-foreground hover:bg-card/90 border border-border/40 shadow-sm'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {filter.label}
                </button>
              );
            })}
          </div>

          {/* Category Tabs */}
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((category) => {
              const Icon = category.icon;
              return (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg font-medium text-sm transition-all ${
                    selectedCategory === category.id
                      ? 'bg-accent/50 text-foreground border border-border/50'
                      : 'text-muted-foreground hover:text-foreground hover:bg-accent/30'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {category.label}
                </button>
              );
            })}
          </div>
        </motion.div>

        {/* Crypto Assets Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="space-y-2"
        >
          <h2 className="text-xl font-semibold text-foreground mb-4">
            {selectedFilter === 'all' ? 'All Assets' : PRESET_FILTERS.find(f => f.id === selectedFilter)?.label}
            <span className="text-sm text-muted-foreground ml-2">({filteredCrypto.length})</span>
          </h2>

          <div className="space-y-2">
            {/* Table Header - Hidden on mobile */}
            <div className="hidden md:block">
              <div className="grid grid-cols-4 gap-4 px-6 py-3 text-sm text-muted-foreground border-b border-border/30">
                <div>Asset</div>
                <div className="text-center">Price</div>
                <div className="text-center">24h Change</div>
                <div className="text-right">Action</div>
              </div>
            </div>

            {filteredCrypto.map((crypto, index) => (
              <motion.div
                key={crypto.symbol}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.02 + 0.1 }}
                className="group"
              >
                <Card 
                  className="border border-border/50 bg-card/90 hover:bg-accent/50 hover:border-border/80 transition-all duration-200 cursor-pointer shadow-sm hover:shadow-md"
                  onClick={() => handleCryptoClick(crypto)}
                >
                  <CardContent className="p-0">
                    {/* Desktop Layout */}
                    <div className="hidden md:grid md:grid-cols-4 gap-4 items-center px-6 py-4">
                      {/* Asset Info */}
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg overflow-hidden bg-gradient-to-br from-teal-400 to-cyan-500 flex items-center justify-center flex-shrink-0">
                          <img 
                            src={crypto.image} 
                            alt={crypto.name}
                            className="w-6 h-6 object-contain"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                              e.currentTarget.nextElementSibling!.style.display = 'flex';
                            }}
                          />
                          <div className="hidden w-full h-full bg-gradient-to-br from-teal-400 to-cyan-500 rounded-lg items-center justify-center">
                            <span className="text-white font-bold text-xs">
                              {crypto.symbol.slice(0, 2)}
                            </span>
                          </div>
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-semibold text-foreground group-hover:text-cyan-500 transition-colors">
                            {crypto.name}
                          </h3>
                          <p className="text-sm text-muted-foreground font-mono">
                            {crypto.symbol}
                          </p>
                        </div>
                      </div>

                      {/* Price */}
                      <div className="text-center">
                        <p className="font-bold text-foreground">
                          ${crypto.price}
                        </p>
                      </div>

                      {/* 24h Change */}
                      <div className="text-center">
                        <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-sm font-medium ${
                          parseFloat(crypto.change) > 0 
                            ? 'bg-green-500/10 text-green-600 dark:text-green-400' 
                            : 'bg-red-500/10 text-red-600 dark:text-red-400'
                        }`}>
                          {parseFloat(crypto.change) > 0 ? (
                            <TrendingUp className="w-3 h-3" />
                          ) : (
                            <TrendingDown className="w-3 h-3" />
                          )}
                          <span>{crypto.change}%</span>
                        </div>
                      </div>

                      {/* Action */}
                      <div className="text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          className="opacity-60 group-hover:opacity-100 hover:bg-cyan-500/10 hover:text-cyan-500 hover:border-cyan-500/30 transition-all duration-200"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCryptoClick(crypto);
                          }}
                        >
                          View Details
                        </Button>
                      </div>
                    </div>

                    {/* Mobile Layout */}
                    <div className="md:hidden p-4">
                      <div className="flex items-center justify-between">
                        {/* Left: Asset Info */}
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className="w-12 h-12 rounded-lg overflow-hidden bg-gradient-to-br from-teal-400 to-cyan-500 flex items-center justify-center flex-shrink-0">
                            <img 
                              src={crypto.image} 
                              alt={crypto.name}
                              className="w-8 h-8 object-contain"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                                e.currentTarget.nextElementSibling!.style.display = 'flex';
                              }}
                            />
                            <div className="hidden w-full h-full bg-gradient-to-br from-teal-400 to-cyan-500 rounded-lg items-center justify-center">
                              <span className="text-white font-bold text-sm">
                                {crypto.symbol.slice(0, 2)}
                              </span>
                            </div>
                          </div>
                          
                          <div className="min-w-0 flex-1">
                            <h3 className="font-semibold text-foreground group-hover:text-cyan-500 transition-colors truncate">
                              {crypto.name}
                            </h3>
                            <p className="text-sm text-muted-foreground font-mono">
                              {crypto.symbol}
                            </p>
                          </div>
                        </div>

                        {/* Right: Price and Change */}
                        <div className="text-right flex-shrink-0 ml-4">
                          <p className="font-bold text-foreground mb-1">
                            ${crypto.price}
                          </p>
                          <div className={`inline-flex items-center gap-1 text-sm font-medium ${
                            parseFloat(crypto.change) > 0 
                              ? 'text-green-600 dark:text-green-400' 
                              : 'text-red-600 dark:text-red-400'
                          }`}>
                            {parseFloat(crypto.change) > 0 ? (
                              <TrendingUp className="w-3 h-3" />
                            ) : (
                              <TrendingDown className="w-3 h-3" />
                            )}
                            <span>{crypto.change}%</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}