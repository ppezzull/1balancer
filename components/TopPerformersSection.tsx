import { useState, useMemo, useCallback } from "react";
import { motion } from "motion/react";
import { useInViewAnimation } from "./interactive/useInViewAnimation";
import { useIsMobile } from "./ui/use-mobile";
import { useTheme } from "./ui/use-theme";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Input } from "./ui/input";
import { Badge } from "./ui/badge";
import exampleImage from 'figma:asset/fd3414c01f8987601dd2dac84ce6a0e871b29aea.png';
import { 
  Search, 
  Filter, 
  TrendingUp, 
  TrendingDown, 
  ExternalLink,
  Copy,
  Star,
  Trophy,
  Crown,
  Medal,
  Zap,
  Eye,
  BarChart3,
  Target,
  Wallet,
  Globe
} from "lucide-react";
import { toast } from "sonner@2.0.3";

interface PerformerData {
  id: string;
  name: string;
  username?: string;
  address: string;
  avatar: string;
  portfolioValue: string;
  change24h: number;
  change7d: number;
  change30d: number;
  roi: number;
  isPositive: boolean;
  rank: number;
  category: 'defi' | 'whale' | 'trader' | 'hodler' | 'institution';
  totalTrades?: number;
  winRate?: number;
  followers?: number;
  verification?: 'verified' | 'whale' | 'influencer';
}

export function TopPerformersSection() {
  const { ref: heroRef, isInView: heroInView } = useInViewAnimation();
  const { ref: performersRef, isInView: performersInView } = useInViewAnimation();
  const isMobile = useIsMobile();
  const { isDark } = useTheme();

  // State management
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTimeframe, setSelectedTimeframe] = useState("7d");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [sortBy, setSortBy] = useState("roi");

  // Mock data per top performers
  const topPerformers = useMemo((): PerformerData[] => [
    {
      id: "1",
      name: "Fantom Foundation",
      address: "0x431b...6354",
      avatar: "FF",
      portfolioValue: "$26.9M",
      change24h: -2.1,
      change7d: 8.4,
      change30d: 24.6,
      roi: 284.7,
      isPositive: true,
      rank: 1,
      category: 'institution',
      totalTrades: 1247,
      winRate: 78.3,
      followers: 15420,
      verification: 'verified'
    },
    {
      id: "2", 
      name: "Powerfund",
      address: "0x357...bf99",
      avatar: "PF",
      portfolioValue: "$4.0M",
      change24h: 1.8,
      change7d: 12.4,
      change30d: 38.2,
      roi: 156.9,
      isPositive: true,
      rank: 2,
      category: 'defi',
      totalTrades: 892,
      winRate: 82.1,
      followers: 8730,
      verification: 'whale'
    },
    {
      id: "3",
      name: "Vitalik Buterin",
      username: "@VitalikButerin",
      address: "0xd8dA...6045",
      avatar: "VB",
      portfolioValue: "$1.5M",
      change24h: 0.4,
      change7d: 5.8,
      change30d: 18.7,
      roi: 89.4,
      isPositive: true,
      rank: 3,
      category: 'hodler',
      totalTrades: 342,
      winRate: 91.2,
      followers: 125000,
      verification: 'influencer'
    },
    {
      id: "4",
      name: "Hayden Adams",
      username: "@haydenzadams",
      address: "0x50EC...79C3",
      avatar: "HA",
      portfolioValue: "$121.8K",
      change24h: -1.2,
      change7d: 3.4,
      change30d: 15.2,
      roi: 67.8,
      isPositive: true,
      rank: 4,
      category: 'trader',
      totalTrades: 1567,
      winRate: 74.6,
      followers: 42300,
      verification: 'verified'
    },
    {
      id: "5",
      name: "Stani Kulechov",
      address: "0x5fbc...2ccf",
      avatar: "SK",
      portfolioValue: "$34.5K",
      change24h: 2.3,
      change7d: 7.1,
      change30d: 22.4,
      roi: 45.2,
      isPositive: true,
      rank: 5,
      category: 'defi',
      totalTrades: 623,
      winRate: 79.8,
      followers: 18900,
      verification: 'verified'
    },
    {
      id: "6",
      name: "Portfolio Example",
      address: "0x470...0f75",
      avatar: "PE",
      portfolioValue: "$3.1K",
      change24h: 0.8,
      change7d: 2.1,
      change30d: 8.9,
      roi: 28.7,
      isPositive: true,
      rank: 6,
      category: 'trader',
      totalTrades: 245,
      winRate: 69.4,
      followers: 892
    },
    {
      id: "7",
      name: "Robert Leshner",
      address: "0xc5...a005",
      avatar: "RL",
      portfolioValue: "$600",
      change24h: -0.3,
      change7d: 1.2,
      change30d: 4.8,
      roi: 12.3,
      isPositive: true,
      rank: 7,
      category: 'hodler',
      totalTrades: 89,
      winRate: 85.4,
      followers: 1247
    }
  ], []);

  const timeframes = useMemo(() => ["24h", "7d", "30d", "90d", "1y"], []);
  const categories = useMemo(() => ["all", "defi", "whale", "trader", "hodler", "institution"], []);
  const sortOptions = useMemo(() => ["roi", "value", "change", "rank"], []);

  // Filtered data based on search and filters
  const filteredPerformers = useMemo(() => {
    let filtered = topPerformers;

    // Filter by search query
    if (searchQuery.trim()) {
      filtered = filtered.filter(performer => 
        performer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        performer.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
        performer.username?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filter by category
    if (selectedCategory !== "all") {
      filtered = filtered.filter(performer => performer.category === selectedCategory);
    }

    // Sort by selected option
    switch (sortBy) {
      case "roi":
        filtered.sort((a, b) => b.roi - a.roi);
        break;
      case "value":
        filtered.sort((a, b) => parseFloat(b.portfolioValue.replace(/[$MK,]/g, '')) - parseFloat(a.portfolioValue.replace(/[$MK,]/g, '')));
        break;
      case "change":
        const changeKey = selectedTimeframe === "24h" ? "change24h" : selectedTimeframe === "7d" ? "change7d" : "change30d";
        filtered.sort((a, b) => b[changeKey] - a[changeKey]);
        break;
      case "rank":
      default:
        filtered.sort((a, b) => a.rank - b.rank);
        break;
    }

    return filtered;
  }, [topPerformers, searchQuery, selectedCategory, sortBy, selectedTimeframe]);

  // Helper functions
  const getChangeValue = useCallback((performer: PerformerData) => {
    switch (selectedTimeframe) {
      case "24h": return performer.change24h;
      case "7d": return performer.change7d;
      case "30d": return performer.change30d;
      default: return performer.change7d;
    }
  }, [selectedTimeframe]);

  const getRankIcon = useCallback((rank: number) => {
    switch (rank) {
      case 1: return <Crown className="w-5 h-5 text-yellow-400" />;
      case 2: return <Trophy className="w-5 h-5 text-gray-400" />;
      case 3: return <Medal className="w-5 h-5 text-amber-600" />;
      default: return <span className="text-muted-foreground font-bold transition-colors duration-300">#{rank}</span>;
    }
  }, []);

  const getVerificationIcon = useCallback((verification?: string) => {
    switch (verification) {
      case "verified": return <Star className={`w-4 h-4 ${isDark ? 'text-blue-400' : 'text-blue-500'} transition-colors duration-300`} />;
      case "whale": return <Zap className={`w-4 h-4 ${isDark ? 'text-purple-400' : 'text-purple-500'} transition-colors duration-300`} />;
      case "influencer": return <Crown className="w-4 h-4 text-yellow-400" />;
      default: return null;
    }
  }, [isDark]);

  const getCategoryColor = useCallback((category: string) => {
    if (!isDark) {
      switch (category) {
        case "defi": return "bg-blue-100 text-blue-700 border-blue-300";
        case "whale": return "bg-purple-100 text-purple-700 border-purple-300";
        case "trader": return "bg-green-100 text-green-700 border-green-300";
        case "hodler": return "bg-orange-100 text-orange-700 border-orange-300";
        case "institution": return "bg-red-100 text-red-700 border-red-300";
        default: return "bg-gray-100 text-gray-700 border-gray-300";
      }
    } else {
      switch (category) {
        case "defi": return "bg-blue-500/20 text-blue-300 border-blue-500/30";
        case "whale": return "bg-purple-500/20 text-purple-300 border-purple-500/30";
        case "trader": return "bg-green-500/20 text-green-300 border-green-500/30";
        case "hodler": return "bg-orange-500/20 text-orange-300 border-orange-500/30";
        case "institution": return "bg-red-500/20 text-red-300 border-red-500/30";
        default: return "bg-gray-500/20 text-gray-300 border-gray-500/30";
      }
    }
  }, [isDark]);

  const getButtonStyle = useCallback((isActive: boolean) => {
    if (!isDark) {
      return isActive 
        ? "bg-blue-600 text-white border-blue-500 hover:bg-blue-700" 
        : "bg-gray-100 text-gray-700 hover:bg-gray-200 hover:text-gray-900 border border-gray-300";
    } else {
      return isActive 
        ? "bg-blue-600 text-white border-blue-500" 
        : "bg-gray-800/50 text-gray-300 hover:bg-gray-700 hover:text-white border border-gray-600";
    }
  }, [isDark]);

  const copyAddress = useCallback((address: string, name: string) => {
    navigator.clipboard.writeText(address);
    toast.success(`${name}'s address copied!`, {
      description: `Address ${address} copied to clipboard`,
      duration: 2000,
    });
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground relative overflow-x-hidden transition-colors duration-300">
      {/* Hero Section */}
      <section ref={heroRef} className="py-6 sm:py-12 px-3 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={heroInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6 }}
            className="text-center mb-8 sm:mb-12"
          >
            <div className="flex items-center justify-center gap-3 mb-4">
              <Trophy className="w-8 h-8 text-yellow-400" />
              <h1 className="text-3xl sm:text-4xl md:text-5xl bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 bg-clip-text text-transparent">
                Top Performers
              </h1>
              <Trophy className="w-8 h-8 text-yellow-400" />
            </div>
            <p className="text-lg sm:text-xl text-muted-foreground max-w-3xl mx-auto transition-colors duration-300">
              Discover the most successful crypto portfolio strategies and learn from top traders, whales, and institutions
            </p>
          </motion.div>

          {/* Search and Filters */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={heroInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mb-6 sm:mb-8"
          >
            <Card 
              className="p-4 sm:p-6 border transition-all duration-300"
              style={{ 
                backgroundColor: 'var(--card-bg)',
                borderColor: isDark ? '#374151' : 'var(--border-light)'
              }}
            >
              <div className="flex flex-col sm:flex-row gap-4 items-center">
                {/* Search Bar */}
                <div className="relative flex-1 w-full">
                  <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 ${
                    isDark ? 'text-gray-400' : 'text-gray-500'
                  } transition-colors duration-300`} />
                  <Input
                    placeholder="Search address, name or domain..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className={`pl-10 transition-colors duration-300 ${
                      isDark 
                        ? "bg-gray-800 border-gray-600 text-white placeholder:text-gray-400"
                        : "bg-gray-50 border-gray-300 text-gray-900 placeholder:text-gray-500"
                    }`}
                  />
                </div>

                {/* Desktop Filters */}
                {!isMobile && (
                  <div className="flex items-center gap-3">
                    <div className="flex gap-2">
                      {timeframes.map((tf) => (
                        <Button
                          key={tf}
                          variant={selectedTimeframe === tf ? "default" : "ghost"}
                          size="sm"
                          className={getButtonStyle(selectedTimeframe === tf)}
                          onClick={() => setSelectedTimeframe(tf)}
                        >
                          {tf.toUpperCase()}
                        </Button>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      {categories.map((cat) => (
                        <Button
                          key={cat}
                          variant={selectedCategory === cat ? "default" : "ghost"}
                          size="sm"
                          className={getButtonStyle(selectedCategory === cat)}
                          onClick={() => setSelectedCategory(cat)}
                        >
                          {cat.charAt(0).toUpperCase() + cat.slice(1)}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Mobile Filter Button */}
                {isMobile && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowMobileFilters(!showMobileFilters)}
                    className={getButtonStyle(false) + " flex items-center gap-2"}
                  >
                    <Filter className="w-4 h-4" />
                    Filters
                  </Button>
                )}
              </div>

              {/* Mobile Filters */}
              {isMobile && showMobileFilters && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-4 space-y-4 border-t pt-4 transition-colors duration-300"
                  style={{ borderColor: isDark ? '#374151' : 'var(--border-light)' }}
                >
                  <div>
                    <label className="text-sm text-muted-foreground mb-2 block transition-colors duration-300">Timeframe</label>
                    <div className="flex gap-2 flex-wrap">
                      {timeframes.map((tf) => (
                        <Button
                          key={tf}
                          variant={selectedTimeframe === tf ? "default" : "ghost"}
                          size="sm"
                          className={`text-xs ${getButtonStyle(selectedTimeframe === tf)}`}
                          onClick={() => setSelectedTimeframe(tf)}
                        >
                          {tf.toUpperCase()}
                        </Button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground mb-2 block transition-colors duration-300">Category</label>
                    <div className="flex gap-2 flex-wrap">
                      {categories.map((cat) => (
                        <Button
                          key={cat}
                          variant={selectedCategory === cat ? "default" : "ghost"}
                          size="sm"
                          className={`text-xs ${getButtonStyle(selectedCategory === cat)}`}
                          onClick={() => setSelectedCategory(cat)}
                        >
                          {cat.charAt(0).toUpperCase() + cat.slice(1)}
                        </Button>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </Card>
          </motion.div>
        </div>
      </section>

      {/* Top Performers List */}
      <section ref={performersRef} className="py-4 sm:py-8 px-3 sm:px-6 lg:px-8 pb-36 sm:pb-28">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={performersInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6 }}
          >
            <Card 
              className="border transition-all duration-300"
              style={{ 
                backgroundColor: 'var(--card-bg)',
                borderColor: isDark ? '#374151' : 'var(--border-light)'
              }}
            >
              <div 
                className="p-4 sm:p-6 border-b transition-colors duration-300"
                style={{ borderColor: isDark ? '#374151' : 'var(--border-light)' }}
              >
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl sm:text-2xl text-foreground flex items-center gap-2 transition-colors duration-300">
                    <BarChart3 className={`w-6 h-6 ${isDark ? 'text-blue-400' : 'text-blue-500'} transition-colors duration-300`} />
                    Top Wallets ({filteredPerformers.length})
                  </h2>
                  
                  {/* Sort Options */}
                  <div className="flex gap-2">
                    {sortOptions.map((option) => (
                      <Button
                        key={option}
                        variant={sortBy === option ? "default" : "ghost"}
                        size="sm"
                        className={`text-xs ${getButtonStyle(sortBy === option)}`}
                        onClick={() => setSortBy(option)}
                      >
                        {option.charAt(0).toUpperCase() + option.slice(1)}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Desktop Table */}
              {!isMobile && (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr 
                        className="border-b transition-colors duration-300"
                        style={{ borderColor: isDark ? '#374151' : 'var(--border-light)' }}
                      >
                        <th className="text-left py-4 px-6 text-muted-foreground font-medium transition-colors duration-300">Rank</th>
                        <th className="text-left py-4 px-6 text-muted-foreground font-medium transition-colors duration-300">Portfolio</th>
                        <th className="text-right py-4 px-6 text-muted-foreground font-medium transition-colors duration-300">Value</th>
                        <th className="text-right py-4 px-6 text-muted-foreground font-medium transition-colors duration-300">{selectedTimeframe.toUpperCase()}</th>
                        <th className="text-right py-4 px-6 text-muted-foreground font-medium transition-colors duration-300">Total ROI</th>
                        <th className="text-center py-4 px-6 text-muted-foreground font-medium transition-colors duration-300">Category</th>
                        <th className="text-center py-4 px-6 text-muted-foreground font-medium transition-colors duration-300">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredPerformers.map((performer, index) => (
                        <motion.tr
                          key={performer.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={performersInView ? { opacity: 1, y: 0 } : {}}
                          transition={{ duration: 0.4, delay: index * 0.05 }}
                          className="border-b transition-colors duration-300 hover:bg-opacity-30"
                          style={{ 
                            borderColor: isDark ? '#1f2937' : 'var(--border-light)',
                            ':hover': {
                              backgroundColor: isDark ? 'rgba(31, 41, 55, 0.3)' : 'rgba(249, 250, 251, 0.5)'
                            }
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = isDark 
                              ? 'rgba(31, 41, 55, 0.3)' 
                              : 'rgba(249, 250, 251, 0.5)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'transparent';
                          }}
                        >
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-2">
                              {getRankIcon(performer.rank)}
                            </div>
                          </td>
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-3">
                              <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 flex items-center justify-center text-white font-bold">
                                {performer.avatar}
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="font-medium text-foreground transition-colors duration-300">{performer.name}</span>
                                  {getVerificationIcon(performer.verification)}
                                </div>
                                {performer.username && (
                                  <div className={`text-sm ${isDark ? 'text-blue-400' : 'text-blue-500'} transition-colors duration-300`}>{performer.username}</div>
                                )}
                                <div className="text-xs text-muted-foreground font-mono transition-colors duration-300">{performer.address}</div>
                              </div>
                            </div>
                          </td>
                          <td className="text-right py-4 px-6 font-mono text-foreground font-bold transition-colors duration-300">
                            {performer.portfolioValue}
                          </td>
                          <td className={`text-right py-4 px-6 font-mono ${
                            getChangeValue(performer) >= 0 ? 'text-green-400' : 'text-red-400'
                          }`}>
                            <div className="flex items-center justify-end gap-1">
                              {getChangeValue(performer) >= 0 ? 
                                <TrendingUp className="w-3 h-3" /> : 
                                <TrendingDown className="w-3 h-3" />
                              }
                              {getChangeValue(performer) > 0 ? '+' : ''}{getChangeValue(performer).toFixed(1)}%
                            </div>
                          </td>
                          <td className="text-right py-4 px-6 font-mono text-green-400 font-bold">
                            +{performer.roi.toFixed(1)}%
                          </td>
                          <td className="text-center py-4 px-6">
                            <Badge className={getCategoryColor(performer.category)}>
                              {performer.category.toUpperCase()}
                            </Badge>
                          </td>
                          <td className="text-center py-4 px-6">
                            <div className="flex items-center justify-center gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => copyAddress(performer.address, performer.name)}
                                className={`transition-colors duration-300 ${
                                  isDark 
                                    ? "text-gray-400 hover:text-white hover:bg-gray-800"
                                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                                }`}
                              >
                                <Copy className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className={`transition-colors duration-300 ${
                                  isDark 
                                    ? "text-gray-400 hover:text-white hover:bg-gray-800"
                                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                                }`}
                              >
                                <ExternalLink className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className={`transition-colors duration-300 ${
                                  isDark 
                                    ? "text-gray-400 hover:text-white hover:bg-gray-800"
                                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                                }`}
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                            </div>
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Mobile Cards */}
              {isMobile && (
                <div className="p-4 space-y-4">
                  {filteredPerformers.map((performer, index) => (
                    <motion.div
                      key={performer.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={performersInView ? { opacity: 1, y: 0 } : {}}
                      transition={{ duration: 0.4, delay: index * 0.05 }}
                      className="rounded-lg p-4 border transition-all duration-300"
                      style={{
                        backgroundColor: 'var(--card-bg)',
                        borderColor: isDark ? '#374151' : 'var(--border-light)'
                      }}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 flex items-center justify-center text-white font-bold">
                            {performer.avatar}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-foreground transition-colors duration-300">{performer.name}</span>
                              {getVerificationIcon(performer.verification)}
                            </div>
                            {performer.username && (
                              <div className={`text-sm ${isDark ? 'text-blue-400' : 'text-blue-500'} transition-colors duration-300`}>{performer.username}</div>
                            )}
                            <div className="text-xs text-muted-foreground font-mono transition-colors duration-300">{performer.address}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          {getRankIcon(performer.rank)}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3 text-sm mb-3">
                        <div>
                          <div className="text-muted-foreground text-xs transition-colors duration-300">Portfolio Value</div>
                          <div className="text-foreground font-mono font-bold transition-colors duration-300">{performer.portfolioValue}</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground text-xs transition-colors duration-300">{selectedTimeframe.toUpperCase()} Change</div>
                          <div className={`font-mono flex items-center gap-1 ${
                            getChangeValue(performer) >= 0 ? 'text-green-400' : 'text-red-400'
                          }`}>
                            {getChangeValue(performer) >= 0 ? 
                              <TrendingUp className="w-3 h-3" /> : 
                              <TrendingDown className="w-3 h-3" />
                            }
                            {getChangeValue(performer) > 0 ? '+' : ''}{getChangeValue(performer).toFixed(1)}%
                          </div>
                        </div>
                        <div>
                          <div className="text-muted-foreground text-xs transition-colors duration-300">Total ROI</div>
                          <div className="font-mono text-green-400 font-bold">+{performer.roi.toFixed(1)}%</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground text-xs transition-colors duration-300">Category</div>
                          <Badge className={getCategoryColor(performer.category)} size="sm">
                            {performer.category.toUpperCase()}
                          </Badge>
                        </div>
                      </div>

                      <div 
                        className="flex items-center justify-between pt-3 border-t transition-colors duration-300"
                        style={{ borderColor: isDark ? '#374151' : 'var(--border-light)' }}
                      >
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyAddress(performer.address, performer.name)}
                            className={`transition-colors duration-300 ${
                              isDark 
                                ? "text-gray-400 hover:text-white hover:bg-gray-800"
                                : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                            }`}
                          >
                            <Copy className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className={`transition-colors duration-300 ${
                              isDark 
                                ? "text-gray-400 hover:text-white hover:bg-gray-800"
                                : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                            }`}
                          >
                            <ExternalLink className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className={`transition-colors duration-300 ${
                              isDark 
                                ? "text-gray-400 hover:text-white hover:bg-gray-800"
                                : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                            }`}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                        </div>
                        <Badge className={getCategoryColor(performer.category)} size="sm">
                          View Portfolio
                        </Badge>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </Card>
          </motion.div>
        </div>
      </section>
    </div>
  );
}