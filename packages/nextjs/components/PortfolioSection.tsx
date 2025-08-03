"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { useTheme } from "./ui/use-theme";
import { useIsMobile } from "./ui/use-mobile";
import { 
  PieChart, 
  TrendingUp, 
  TrendingDown, 
  BarChart3, 
  Eye, 
  Edit, 
  Trash2, 
  Plus,
  DollarSign,
  Calendar,
  Target,
  AlertCircle,
  Zap,
  Settings,
  Filter,
  Search,
  Sparkles,
  Crown,
  Shield,
  Rocket,
  Building,
  RefreshCw,
  Clock,
  TrendingDown as Drift
} from "lucide-react";
import { toast } from "sonner";
import { PortfolioDetailModal } from "./PortfolioDetailModal";
import { 
  getPortfolios, 
  deletePortfolio, 
  updatePortfolio,
  CRYPTOCURRENCY_DATA,
  Portfolio
} from "~~/utils/constants";

interface DeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  walletName: string;
}

function DeleteModal({ isOpen, onClose, onConfirm, walletName }: DeleteModalProps) {
  const { isDark } = useTheme();

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        style={{
          background: 'rgba(0, 0, 0, 0.8)',
          backdropFilter: 'blur(8px)'
        }}
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="w-full max-w-md"
          onClick={(e) => e.stopPropagation()}
        >
          <Card 
            className="border border-border/30"
            style={{
              background: isDark 
                ? 'linear-gradient(135deg, #1f2937 0%, #111827 50%, #0f172a 100%)'
                : 'linear-gradient(135deg, #ffffff 0%, #f8fafc 50%, #f1f5f9 100%)',
              backdropFilter: 'blur(20px)'
            }}
          >
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center">
                  <AlertCircle className="w-6 h-6 text-red-500" />
                </div>
                <div>
                  <CardTitle className="text-lg text-foreground">Delete Portfolio</CardTitle>
                  <p className="text-sm text-muted-foreground">This action cannot be undone</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-foreground">
                Are you sure you want to delete <strong>"{walletName}"</strong>? 
                This will permanently remove the portfolio and all its data.
              </p>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={onClose}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={onConfirm}
                  className="flex-1 bg-red-500 hover:bg-red-600 text-white"
                >
                  Delete Portfolio
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// Convert Portfolio from constants.tsx to local Portfolio format
const convertToLocalPortfolio = (portfolio: Portfolio) => {
  return {
    id: portfolio.id,
    name: portfolio.name,
    type: portfolio.investmentType || 'drift' as const,
    presetType: getPresetTypeFromName(portfolio.name),
    totalInvestment: portfolio.totalValue,
    allocations: portfolio.tokens.map((token, index) => {
      const cryptoData = CRYPTOCURRENCY_DATA.find(c => c.symbol === token.symbol);
      const colors = ['#2F5586', '#2775CA', '#B6509E', '#00D395', '#FF007A', '#2A5ADA', '#1AAB9B', '#5FCDF8', '#8247E5', '#FF0420'];
      
      return {
        symbol: token.symbol,
        name: cryptoData?.name || token.symbol,
        percentage: token.percentage,
        color: colors[index % colors.length],
        image: cryptoData?.image || '',
        amount: token.amount
      };
    }),
    autoinvestConfig: portfolio.investmentConfig ? {
      initialDeposit: portfolio.investmentConfig.initialDeposit || 0,
      monthlyInvestment: portfolio.investmentConfig.monthlyInvestment || 0,
      years: portfolio.investmentConfig.years || 1,
      projectedValue: portfolio.totalValue * 1.5 // Estimated projection
    } : undefined,
    createdAt: portfolio.createdAt,
    performance: {
      totalValue: portfolio.totalValue,
      totalReturn: portfolio.totalValue * (portfolio.performance / 100),
      returnPercentage: portfolio.performance,
      dailyChange: Math.random() * 1000 - 500, // Random daily change
      dailyChangePercentage: Math.random() * 10 - 5 // Random daily percentage
    }
  };
};

// Determine preset type from portfolio name
function getPresetTypeFromName(name: string): string {
  if (name.includes('EndGame') || name.includes('Conservative')) return 'conservative';
  if (name.includes('Gomora') || name.includes('Balanced')) return 'balanced';
  if (name.includes('Tanos') || name.includes('Aggressive') || name.includes('Meme')) return 'aggressive';
  if (name.includes('RWA') || name.includes('DeFi') || name.includes('AI')) return 'balanced';
  return 'balanced';
}

export function PortfolioSection() {
  const [savedWallets, setSavedWallets] = useState<any[]>([]);
  const [filteredWallets, setFilteredWallets] = useState<any[]>([]);
  const [selectedWallet, setSelectedWallet] = useState<any>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<'all' | 'drift' | 'time'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'date' | 'value'>('date');
  const [isLoading, setIsLoading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const { isDark } = useTheme();
  const isMobile = useIsMobile();

  // Load user portfolios only (exclude defaults)
  const loadPortfolios = () => {
    setIsLoading(true);
    console.log(`🔄 Loading user portfolios... (refresh key: ${refreshKey})`);
    
    try {
      // Get user portfolios from localStorage
      const userPortfolios = localStorage.getItem("user-portfolios");
      const savedPortfolios = localStorage.getItem("1balancer-portfolios");
      
      let portfolios: Portfolio[] = [];
      
      const portfolioIds = new Set<string>(); // Track IDs to prevent duplicates
      
      // Load user-created portfolios (from template selection)
      if (userPortfolios) {
        try {
          const parsed = JSON.parse(userPortfolios);
          if (Array.isArray(parsed)) {
            for (const portfolio of parsed) {
              if (portfolio.id && !portfolioIds.has(portfolio.id)) {
                portfolios.push(portfolio);
                portfolioIds.add(portfolio.id);
              }
            }
            console.log(`📊 Found ${parsed.length} user portfolios, ${portfolios.length} unique after filtering`);
          }
        } catch (error) {
          console.error("Error parsing user portfolios:", error);
        }
      }
      
      // Load saved portfolios (from PieChartCreator)
      if (savedPortfolios) {
        try {
          const parsed = JSON.parse(savedPortfolios);
          if (Array.isArray(parsed)) {
            // Filter out any default portfolios that might have been mixed in and prevent duplicates
            const userCreated = parsed.filter((p: Portfolio) => 
              p.id && 
              !p.id.startsWith('default-') && 
              !p.isTemplate &&
              !portfolioIds.has(p.id)
            );
            
            for (const portfolio of userCreated) {
              portfolios.push(portfolio);
              portfolioIds.add(portfolio.id);
            }
            console.log(`📊 Found ${userCreated.length} saved portfolios after duplicate filtering`);
          }
        } catch (error) {
          console.error("Error parsing saved portfolios:", error);
        }
      }
      
      // Sort portfolios by creation date (newest first)
      portfolios.sort((a, b) => {
        const dateA = new Date(a.createdAt || 0).getTime();
        const dateB = new Date(b.createdAt || 0).getTime();
        return dateB - dateA;
      });
      
      // Convert to local format and set
      const convertedPortfolios = portfolios.map(convertToLocalPortfolio);
      setSavedWallets(convertedPortfolios);
      
      console.log(`✅ Loaded ${convertedPortfolios.length} total user portfolios:`, convertedPortfolios.map(p => p.name));
    } catch (error) {
      console.error('❌ Error loading portfolios:', error);
      setSavedWallets([]);
      
      toast.error("Portfolio Loading Error", {
        description: "Failed to load portfolios. Please try refreshing.",
        duration: 4000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Initial load and listeners
  useEffect(() => {
    loadPortfolios();

    // Listen for portfolio updates from other components
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'userPortfolios') {
        console.log('🔄 localStorage changed, reloading portfolios...');
        loadPortfolios();
      }
    };

    // Listen for custom portfolio update events
    const handlePortfolioUpdate = () => {
      console.log('🔄 Portfolio update event received, reloading...');
      loadPortfolios();
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('portfolios-updated', handlePortfolioUpdate);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('portfolios-updated', handlePortfolioUpdate);
    };
  }, [refreshKey]);

  // Filter and sort wallets
  useEffect(() => {
    let filtered = savedWallets;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(wallet => 
        wallet.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        wallet.presetType?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Type filter
    if (filterType !== 'all') {
      filtered = filtered.filter(wallet => wallet.type === filterType);
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'value':
          return b.totalInvestment - a.totalInvestment;
        case 'date':
        default:
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    });

    setFilteredWallets(filtered);
  }, [savedWallets, searchTerm, filterType, sortBy]);

  const handleDeleteWallet = (walletId: string) => {
    try {
      // Remove from user portfolios
      const userPortfolios = localStorage.getItem("user-portfolios");
      if (userPortfolios) {
        const parsed = JSON.parse(userPortfolios);
        const updated = parsed.filter((p: any) => p.id !== walletId);
        localStorage.setItem("user-portfolios", JSON.stringify(updated));
      }
      
      // Remove from saved portfolios
      const savedPortfolios = localStorage.getItem("1balancer-portfolios");
      if (savedPortfolios) {
        const parsed = JSON.parse(savedPortfolios);
        const updated = parsed.filter((p: any) => p.id !== walletId);
        localStorage.setItem("1balancer-portfolios", JSON.stringify(updated));
      }
      
      // Update local state
      const updatedWallets = savedWallets.filter(wallet => wallet.id !== walletId);
      setSavedWallets(updatedWallets);
      
      setShowDeleteModal(false);
      setSelectedWallet(null);
      toast.success('Portfolio deleted successfully');
    } catch (error) {
      console.error('Error deleting portfolio:', error);
      toast.error('Failed to delete portfolio');
    }
  };

  const handleForceRefresh = () => {
    console.log('🔄 Force refresh triggered');
    setRefreshKey(prev => prev + 1);
    toast.info("Refreshing portfolios...", {
      duration: 2000,
    });
  };

  const getTypeStyle = (type: string, presetType?: string) => {
    switch (presetType?.toLowerCase()) {
      case 'conservative':
        return {
          bg: 'bg-blue-500/10',
          border: 'border-blue-500/30',
          text: 'text-blue-600 dark:text-blue-400',
          icon: <Shield className="w-3 h-3" />
        };
      case 'balanced':
        return {
          bg: 'bg-green-500/10',
          border: 'border-green-500/30',
          text: 'text-green-600 dark:text-green-400',
          icon: <Target className="w-3 h-3" />
        };
      case 'aggressive':
        return {
          bg: 'bg-red-500/10',
          border: 'border-red-500/30',
          text: 'text-red-600 dark:text-red-400',
          icon: <Rocket className="w-3 h-3" />
        };
      default:
        return {
          bg: 'bg-purple-500/10',
          border: 'border-purple-500/30',
          text: 'text-purple-600 dark:text-purple-400',
          icon: <Settings className="w-3 h-3" />
        };
    }
  };

  const getStrategyIcon = (name: string) => {
    if (name.includes('EndGame')) return <Shield className="w-5 h-5 text-blue-500" />;
    if (name.includes('Gomora')) return <Target className="w-5 h-5 text-green-500" />;
    if (name.includes('Tanos')) return <Sparkles className="w-5 h-5 text-purple-500" />;
    if (name.includes('RWA')) return <Building className="w-5 h-5 text-orange-500" />;
    if (name.includes('DeFi') || name.includes('Defi')) return <Zap className="w-5 h-5 text-cyan-500" />;
    if (name.includes('Meme')) return <Rocket className="w-5 h-5 text-pink-500" />;
    if (name.includes('AI')) return <Crown className="w-5 h-5 text-indigo-500" />;
    return <PieChart className="w-5 h-5 text-gray-500" />;
  };

  const getRebalanceDescription = (type: string) => {
    switch (type) {
      case 'drift':
        return 'Automatically rebalances when asset allocations drift beyond a set threshold, responding to market volatility.';
      case 'time':
        return 'Rebalances on a fixed schedule (weekly, monthly, etc.) regardless of market conditions to maintain target allocations.';
      default:
        return 'Custom rebalancing strategy tailored to your specific investment preferences.';
    }
  };

  const getRebalanceIcon = (type: string) => {
    switch (type) {
      case 'drift':
        return <Drift className="w-3 h-3 text-orange-500" />;
      case 'time':
        return <Clock className="w-3 h-3 text-blue-500" />;
      default:
        return <Settings className="w-3 h-3 text-purple-500" />;
    }
  };

  const totalPortfolioValue = savedWallets.reduce((sum, wallet) => sum + wallet.totalInvestment, 0);
  const avgPerformance = savedWallets.length > 0 
    ? savedWallets.reduce((sum, wallet) => sum + (wallet.performance?.returnPercentage || 0), 0) / savedWallets.length
    : 0;

  return (
    <div className="min-h-screen bg-background">
      <div className="px-4 sm:px-6 py-6 space-y-8">
        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="space-y-6"
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Portfolio Dashboard</h1>
              <p className="text-muted-foreground">
                {isLoading 
                  ? "Loading portfolios..." 
                  : savedWallets.length === 0 
                    ? "No portfolios found. Create a new portfolio or add templates from the Home section." 
                    : `Manage and track your ${savedWallets.length} personal investment portfolios`
                }
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button
                onClick={handleForceRefresh}
                variant="outline"
                className="hover:bg-accent/50"
                disabled={isLoading}
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Button
                onClick={() => {
                  // Navigate to pie chart creator
                  const event = new CustomEvent('navigate-to-pie-chart');
                  window.dispatchEvent(event);
                }}
                style={{
                  background: isDark 
                    ? 'var(--gradient-primary)'
                    : 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
                  color: 'white'
                }}
              >
                <Plus className="w-4 h-4 mr-2" />
                Create New
              </Button>
            </div>
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card className="border border-border/30" style={{ backgroundColor: 'var(--card-bg)' }}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Portfolio Value</p>
                    <p className="text-2xl font-bold text-foreground">
                      ${totalPortfolioValue.toLocaleString()}
                    </p>
                  </div>
                  <DollarSign className="w-8 h-8 text-green-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="border border-border/30" style={{ backgroundColor: 'var(--card-bg)' }}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Active Portfolios</p>
                    <p className="text-2xl font-bold text-foreground">{savedWallets.length}</p>
                  </div>
                  <PieChart className="w-8 h-8 text-cyan-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="border border-border/30" style={{ backgroundColor: 'var(--card-bg)' }}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Avg. Performance</p>
                    <p className={`text-2xl font-bold ${avgPerformance >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                      {avgPerformance >= 0 ? '+' : ''}{avgPerformance.toFixed(1)}%
                    </p>
                  </div>
                  {avgPerformance >= 0 ? (
                    <TrendingUp className="w-8 h-8 text-green-500" />
                  ) : (
                    <TrendingDown className="w-8 h-8 text-red-500" />
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </motion.div>

        {/* Filters and Search */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="space-y-4"
        >
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search portfolios..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-border/30 bg-card/50 backdrop-blur-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500/50 transition-all"
            />
          </div>

          {/* Filter Tabs */}
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Filter:</span>
            </div>
            <div className="flex gap-2">
              {[
                { id: 'all', label: 'All' },
                { id: 'drift', label: 'Drift-Based' },
                { id: 'time', label: 'Time-Based' }
              ].map((filter) => (
                <button
                  key={filter.id}
                  onClick={() => setFilterType(filter.id as any)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    filterType === filter.id
                      ? 'bg-gradient-to-r from-teal-500 to-cyan-500 text-white'
                      : 'bg-card/50 text-muted-foreground hover:text-foreground hover:bg-card/80 border border-border/30'
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>
            
            <div className="flex items-center gap-2 ml-auto">
              <span className="text-sm text-muted-foreground">Sort by:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-3 py-2 rounded-lg bg-card/50 border border-border/30 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/50"
              >
                <option value="date">Date Created</option>
                <option value="name">Name</option>
                <option value="value">Investment Value</option>
              </select>
            </div>
          </div>
        </motion.div>

        {/* Portfolio Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="space-y-4"
        >
          {isLoading ? (
            <Card className="border border-border/30" style={{ backgroundColor: 'var(--card-bg)' }}>
              <CardContent className="py-12 text-center">
                <RefreshCw className="w-16 h-16 text-muted-foreground mx-auto mb-4 animate-spin" />
                <h3 className="text-lg font-semibold text-foreground mb-2">Loading Portfolios</h3>
                <p className="text-muted-foreground">Please wait while we load your investment portfolios...</p>
              </CardContent>
            </Card>
          ) : filteredWallets.length === 0 ? (
            <Card className="border border-border/30" style={{ backgroundColor: 'var(--card-bg)' }}>
              <CardContent className="py-12 text-center">
                <PieChart className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  {searchTerm || filterType !== 'all' ? 'No portfolios found' : 'No portfolios available'}
                </h3>
                <p className="text-muted-foreground mb-6">
                  {searchTerm || filterType !== 'all' 
                    ? 'Try adjusting your search or filter criteria.'
                    : 'Start building your investment portfolio or add professional templates from the Home section.'
                  }
                </p>
                <div className="flex gap-3 justify-center">
                  <Button
                    onClick={handleForceRefresh}
                    variant="outline"
                    className="hover:bg-accent/50"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Refresh
                  </Button>
                  <Button
                    onClick={() => {
                      const event = new CustomEvent('navigate-to-pie-chart');
                      window.dispatchEvent(event);
                    }}
                    style={{
                      background: isDark 
                        ? 'var(--gradient-primary)'
                        : 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
                      color: 'white'
                    }}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Create Portfolio
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredWallets.map((wallet, index) => {
                const typeStyle = getTypeStyle(wallet.type, wallet.presetType);
                const isDefaultPortfolio = false; // No default portfolios in user section
                
                return (
                  <motion.div
                    key={wallet.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card 
                      className="overflow-hidden border border-border transition-all duration-200 hover:shadow-lg hover:scale-[1.02] cursor-pointer group relative"
                      style={{ backgroundColor: 'var(--card-bg)' }}
                      onClick={() => {
                        setSelectedWallet(wallet);
                        setShowDetailModal(true);
                      }}
                    >
                      {isDefaultPortfolio && (
                        <div className="absolute top-2 right-2 z-10">
                          <Crown className="w-4 h-4 text-yellow-500" />
                        </div>
                      )}
                      
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            {getStrategyIcon(wallet.name)}
                            <div>
                              <h3 className="font-semibold text-foreground group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">
                                {wallet.name}
                              </h3>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge 
                                  className={`text-xs ${typeStyle.bg} ${typeStyle.border} ${typeStyle.text} border`}
                                >
                                  <span className="mr-1">{typeStyle.icon}</span>
                                  {wallet.presetType?.charAt(0).toUpperCase() + wallet.presetType?.slice(1) || 'Custom'}
                                </Badge>
                                <Badge variant="outline" className="text-xs">
                                  {wallet.type === 'drift' ? 'Drift' : wallet.type === 'time' ? 'Time' : 'Custom'}
                                </Badge>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardHeader>

                      <CardContent className="space-y-4">
                        {/* Investment Value */}
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-muted-foreground">Total Investment</span>
                            <span className="font-semibold text-foreground">
                              ${wallet.totalInvestment.toLocaleString()}
                            </span>
                          </div>
                          
                          {wallet.performance && (
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-muted-foreground">Performance</span>
                              <span className={`font-semibold ${
                                wallet.performance.returnPercentage >= 0 
                                  ? 'text-green-600 dark:text-green-400' 
                                  : 'text-red-600 dark:text-red-400'
                              }`}>
                                {wallet.performance.returnPercentage >= 0 ? '+' : ''}
                                {wallet.performance.returnPercentage.toFixed(2)}%
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Rebalancing Strategy Description */}
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            {getRebalanceIcon(wallet.type)}
                            <span className="text-sm font-medium text-foreground">
                              {wallet.type === 'drift' ? 'Drift-Based Rebalancing' : 
                               wallet.type === 'time' ? 'Time-Based Rebalancing' : 
                               'Custom Rebalancing'}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground leading-relaxed">
                            {getRebalanceDescription(wallet.type)}
                          </p>
                        </div>

                        {/* Allocation Preview */}
                        <div className="space-y-2">
                          <span className="text-sm text-muted-foreground">Top Holdings</span>
                          <div className="space-y-1">
                            {wallet.allocations.slice(0, 3).map((allocation: any, i: number) => (
                              <div key={allocation.symbol} className="flex items-center justify-between text-xs">
                                <div className="flex items-center gap-2">
                                  <div 
                                    className="w-2 h-2 rounded-full" 
                                    style={{ backgroundColor: allocation.color }}
                                  />
                                  <span className="text-muted-foreground">{allocation.symbol}</span>
                                </div>
                                <span className="font-medium text-foreground">{allocation.percentage}%</span>
                              </div>
                            ))}
                            {wallet.allocations.length > 3 && (
                              <div className="text-xs text-muted-foreground text-center pt-1">
                                +{wallet.allocations.length - 3} more
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-2 pt-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedWallet(wallet);
                              setShowDetailModal(true);
                            }}
                          >
                            <Eye className="w-3 h-3 mr-1" />
                            View
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedWallet(wallet);
                              setShowDeleteModal(true);
                            }}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          )}
        </motion.div>
      </div>

      {/* Delete Modal */}
      <DeleteModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setSelectedWallet(null);
        }}
        onConfirm={() => selectedWallet && handleDeleteWallet(selectedWallet.id)}
        walletName={selectedWallet?.name || ''}
      />

      {/* Detail Modal */}
      {showDetailModal && selectedWallet && (
        <PortfolioDetailModal
          portfolio={selectedWallet}
          isOpen={showDetailModal}
          onClose={() => {
            setShowDetailModal(false);
            setSelectedWallet(null);
          }}
        />
      )}
    </div>
  );
}