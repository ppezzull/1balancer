"use client";

import { useState, useEffect, useMemo } from "react";
import { motion } from "motion/react";
import { useInViewAnimation } from "./interactive/useInViewAnimation";
import { useIsMobile } from "./ui/use-mobile";
import { useTheme } from "./ui/use-theme";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import { Badge } from "./ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { 
  TrendingUp, 
  TrendingDown, 
  Search, 
  Filter,
  Star,
  Zap,
  DollarSign,
  BarChart3,
  Activity,
  Clock,
  Volume2,
  Eye,
  ArrowUpRight,
  ArrowDownRight,
  TrendingUpIcon
} from "lucide-react";
import { toast } from "sonner";
import { CRYPTOCURRENCY_DATA } from "~~/utils/constants";
import { CryptoDetailScreen } from "./CryptoDetailScreen";
import { BuyCryptoModal } from "./BuyCryptoModal";
import { LineChart, Line, ResponsiveContainer, Tooltip, Area, AreaChart } from "recharts";

interface TradingPair {
  symbol: string;
  name: string;
  price: number;
  change24h: number;
  volume24h: number;
  marketCap: number;
  image: string;
  trending: boolean;
  category: 'defi' | 'layer2' | 'meme' | 'gaming' | 'stable';
  priceHistory: Array<{ time: number; price: number; volume: number }>;
}

interface ChartDataPoint {
  time: number;
  price: number;
  volume: number;
}

export function TradeSection() {
  const { ref: heroRef, isInView: heroInView } = useInViewAnimation();
  const { ref: contentRef, isInView: contentInView } = useInViewAnimation();
  const isMobile = useIsMobile();
  const { isDark } = useTheme();

  // State management
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [sortBy, setSortBy] = useState("volume");
  const [selectedCrypto, setSelectedCrypto] = useState<any>(null);
  const [showCryptoDetail, setShowCryptoDetail] = useState(false);
  const [showBuyModal, setShowBuyModal] = useState(false);
  const [buyingCrypto, setBuyingCrypto] = useState<any>(null);
  const [tradingPairs, setTradingPairs] = useState<TradingPair[]>([]);

  // Generate historical price data for charts
  const generatePriceHistory = (basePrice: number, change24h: number): ChartDataPoint[] => {
    const history: ChartDataPoint[] = [];
    const now = Date.now();
    const msPerHour = 60 * 60 * 1000;
    
    // Generate 24 hours of data (1 point per hour)
    for (let i = 23; i >= 0; i--) {
      const time = now - (i * msPerHour);
      const progress = (23 - i) / 23; // 0 to 1
      
      // Create a price trend that ends up at the current change24h
      const randomVariation = (Math.random() - 0.5) * 0.1; // ±5% random variation
      const trendComponent = (change24h / 100) * progress; // Linear trend towards final change
      const priceMultiplier = 1 + trendComponent + randomVariation;
      
      const price = basePrice * priceMultiplier;
      const volume = Math.random() * 1000000 + 500000; // Random volume
      
      history.push({ time, price, volume });
    }
    
    // Ensure the last point matches current price
    history[history.length - 1].price = basePrice;
    
    return history;
  };

  // Generate trading pairs with live market data simulation
  useEffect(() => {
    const generateTradingPairs = (): TradingPair[] => {
      return CRYPTOCURRENCY_DATA.map((crypto, index) => {
        const basePrice = 1 + Math.random() * 1000;
        const change = (Math.random() - 0.5) * 20; // -10% to +10%
        
        const categories: Array<'defi' | 'layer2' | 'meme' | 'gaming' | 'stable'> = ['defi', 'layer2', 'meme', 'gaming', 'stable'];
        
        return {
          symbol: crypto.symbol,
          name: crypto.name,
          price: basePrice,
          change24h: change,
          volume24h: Math.random() * 1000000000, // Random volume up to 1B
          marketCap: basePrice * (Math.random() * 1000000000), // Market cap calculation
          image: crypto.image,
          trending: Math.random() > 0.7, // 30% chance to be trending
          category: categories[index % categories.length],
          priceHistory: generatePriceHistory(basePrice, change)
        };
      });
    };

    setTradingPairs(generateTradingPairs());

    // Simulate live price updates
    const interval = setInterval(() => {
      setTradingPairs(prev => prev.map(pair => {
        const newPrice = pair.price * (1 + (Math.random() - 0.5) * 0.02); // ±1% price movement
        const newChange = pair.change24h + (Math.random() - 0.5) * 0.5; // Small change adjustment
        
        // Update price history with new data point
        const newHistory = [...pair.priceHistory];
        const now = Date.now();
        
        // Add new point
        newHistory.push({
          time: now,
          price: newPrice,
          volume: Math.random() * 1000000 + 500000
        });
        
        // Keep only last 24 points
        if (newHistory.length > 24) {
          newHistory.shift();
        }
        
        return {
          ...pair,
          price: newPrice,
          change24h: newChange,
          priceHistory: newHistory
        };
      }));
    }, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, []);

  // Filter and sort trading pairs
  const filteredPairs = useMemo(() => {
    let filtered = tradingPairs;

    // Search filter
    if (searchQuery.trim()) {
      filtered = filtered.filter(pair => 
        pair.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        pair.symbol.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Category filter
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(pair => pair.category === selectedCategory);
    }

    // Sort
    switch (sortBy) {
      case 'volume':
        filtered.sort((a, b) => b.volume24h - a.volume24h);
        break;
      case 'price':
        filtered.sort((a, b) => b.price - a.price);
        break;
      case 'change':
        filtered.sort((a, b) => b.change24h - a.change24h);
        break;
      case 'market-cap':
        filtered.sort((a, b) => b.marketCap - a.marketCap);
        break;
      case 'trending':
        filtered.sort((a, b) => (b.trending ? 1 : 0) - (a.trending ? 1 : 0));
        break;
    }

    return filtered;
  }, [tradingPairs, searchQuery, selectedCategory, sortBy]);

  // Get trending pairs for quick access
  const trendingPairs = useMemo(() => {
    return tradingPairs.filter(pair => pair.trending).slice(0, 6);
  }, [tradingPairs]);

  // Handle crypto selection
  const handleCryptoClick = (pair: TradingPair) => {
    const cryptoData = {
      symbol: pair.symbol,
      name: pair.name,
      price: pair.price,
      change24h: pair.change24h,
      volume24h: pair.volume24h,
      marketCap: pair.marketCap,
      image: pair.image,
      description: `${pair.name} is a leading cryptocurrency in the ${pair.category} category.`,
      website: `https://${pair.symbol.toLowerCase()}.org`,
      explorer: `https://etherscan.io/token/${pair.symbol}`,
      category: pair.category
    };
    
    setSelectedCrypto(cryptoData);
    setShowCryptoDetail(true);
  };

  // Handle buy action
  const handleBuyCrypto = (pair: TradingPair) => {
    const cryptoData = {
      symbol: pair.symbol,
      name: pair.name,
      price: formatPrice(pair.price), // Convert to string format expected by BuyCryptoModal
      change: pair.change24h.toFixed(2), // Convert to string format expected by BuyCryptoModal
      image: pair.image
    };
    
    setBuyingCrypto(cryptoData);
    setShowBuyModal(true);
  };

  // Format number helpers
  const formatPrice = (price: number) => {
    if (price < 0.01) return price.toFixed(6);
    if (price < 1) return price.toFixed(4);
    return price.toFixed(2);
  };

  const formatVolume = (volume: number) => {
    if (volume >= 1e9) return `$${(volume / 1e9).toFixed(2)}B`;
    if (volume >= 1e6) return `$${(volume / 1e6).toFixed(2)}M`;
    if (volume >= 1e3) return `$${(volume / 1e3).toFixed(2)}K`;
    return `$${volume.toFixed(2)}`;
  };

  // Mini Chart Component
  const MiniChart = ({ data, isPositive, className = "" }: { 
    data: ChartDataPoint[], 
    isPositive: boolean, 
    className?: string 
  }) => {
    return (
      <div className={`h-12 w-20 ${className}`}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id={`gradient-${isPositive ? 'positive' : 'negative'}`} x1="0" y1="0" x2="0" y2="1">
                <stop 
                  offset="0%" 
                  stopColor={isPositive ? '#10b981' : '#ef4444'} 
                  stopOpacity={0.3}
                />
                <stop 
                  offset="100%" 
                  stopColor={isPositive ? '#10b981' : '#ef4444'} 
                  stopOpacity={0}
                />
              </linearGradient>
            </defs>
            <Area
              type="monotone"
              dataKey="price"
              stroke={isPositive ? '#10b981' : '#ef4444'}
              strokeWidth={1.5}
              fill={`url(#gradient-${isPositive ? 'positive' : 'negative'})`}
              dot={false}
              activeDot={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    );
  };

  // Sparkline Chart Component for trending section
  const SparklineChart = ({ data, isPositive }: { data: ChartDataPoint[], isPositive: boolean }) => {
    return (
      <div className="h-8 w-16">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <Line
              type="monotone"
              dataKey="price"
              stroke={isPositive ? '#10b981' : '#ef4444'}
              strokeWidth={1.5}
              dot={false}
              activeDot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    );
  };

  const categories = ['all', 'defi', 'layer2', 'meme', 'gaming', 'stable'];

  return (
    <section className="py-20 bg-background transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Hero Section */}
        <motion.div
          ref={heroRef}
          initial={{ opacity: 0, y: 30 }}
          animate={heroInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
            <span 
              className="bg-clip-text text-transparent"
              style={{ backgroundImage: 'var(--gradient-primary)' }}
            >
              Professional Trading
            </span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
            Trade cryptocurrencies with advanced tools, real-time market data, live charts, and institutional-grade security. 
            Execute your strategy with confidence on 1Balancer's trading platform.
          </p>
          
          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
            <Card className="border border-border/30 bg-card/50 backdrop-blur-sm">
              <CardContent className="p-4 text-center">
                <Activity className="w-6 h-6 mx-auto mb-2 text-green-500" />
                <div className="text-2xl font-bold text-foreground">{tradingPairs.length}</div>
                <div className="text-sm text-muted-foreground">Trading Pairs</div>
              </CardContent>
            </Card>
            
            <Card className="border border-border/30 bg-card/50 backdrop-blur-sm">
              <CardContent className="p-4 text-center">
                <Volume2 className="w-6 h-6 mx-auto mb-2 text-blue-500" />
                <div className="text-2xl font-bold text-foreground">
                  {formatVolume(tradingPairs.reduce((sum, pair) => sum + pair.volume24h, 0))}
                </div>
                <div className="text-sm text-muted-foreground">24h Volume</div>
              </CardContent>
            </Card>
            
            <Card className="border border-border/30 bg-card/50 backdrop-blur-sm">
              <CardContent className="p-4 text-center">
                <TrendingUp className="w-6 h-6 mx-auto mb-2 text-purple-500" />
                <div className="text-2xl font-bold text-foreground">{trendingPairs.length}</div>
                <div className="text-sm text-muted-foreground">Trending</div>
              </CardContent>
            </Card>
            
            <Card className="border border-border/30 bg-card/50 backdrop-blur-sm">
              <CardContent className="p-4 text-center">
                <Clock className="w-6 h-6 mx-auto mb-2 text-orange-500" />
                <div className="text-2xl font-bold text-foreground">24/7</div>
                <div className="text-sm text-muted-foreground">Market Hours</div>
              </CardContent>
            </Card>
          </div>
        </motion.div>

        {/* Trending Section */}
        {trendingPairs.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={heroInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mb-12"
          >
            <div className="flex items-center gap-2 mb-6">
              <Zap className="w-5 h-5 text-orange-500" />
              <h2 className="text-2xl font-bold text-foreground">Trending Now</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {trendingPairs.map((pair) => (
                <Card 
                  key={pair.symbol}
                  className="border border-border/30 bg-card/50 backdrop-blur-sm hover:border-border/50 transition-all duration-200 cursor-pointer group"
                  onClick={() => handleCryptoClick(pair)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full overflow-hidden bg-gradient-to-br from-teal-400 to-cyan-500 flex items-center justify-center">
                          <img 
                            src={pair.image} 
                            alt={pair.name}
                            className="w-6 h-6 object-contain"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                              e.currentTarget.nextElementSibling!.style.display = 'flex';
                            }}
                          />
                          <div className="hidden w-full h-full bg-gradient-to-br from-teal-400 to-cyan-500 rounded-full items-center justify-center">
                            <span className="text-white font-bold text-sm">
                              {pair.symbol.slice(0, 2)}
                            </span>
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-foreground truncate">{pair.symbol}</p>
                          <p className="text-sm text-muted-foreground truncate">{pair.name}</p>
                        </div>
                      </div>
                      
                      <SparklineChart 
                        data={pair.priceHistory} 
                        isPositive={pair.change24h >= 0} 
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-lg font-bold text-foreground">${formatPrice(pair.price)}</p>
                        <div className={`flex items-center gap-1 text-sm ${
                          pair.change24h >= 0 ? 'text-green-500' : 'text-red-500'
                        }`}>
                          {pair.change24h >= 0 ? (
                            <ArrowUpRight className="w-3 h-3" />
                          ) : (
                            <ArrowDownRight className="w-3 h-3" />
                          )}
                          {pair.change24h >= 0 ? '+' : ''}{pair.change24h.toFixed(2)}%
                        </div>
                      </div>
                      
                      <Button
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleBuyCrypto(pair);
                        }}
                        className="bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        Trade
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </motion.div>
        )}

        {/* Filters and Search */}
        <motion.div
          ref={contentRef}
          initial={{ opacity: 0, y: 20 }}
          animate={contentInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mb-8"
        >
          <div className="flex flex-col lg:flex-row gap-4 items-center justify-between mb-6">
            {/* Search */}
            <div className="relative w-full lg:w-96">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
              <Input
                placeholder="Search cryptocurrencies..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-card/50 border-border/30"
              />
            </div>

            {/* Sort and Filter */}
            <div className="flex items-center gap-4">
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-48 bg-card/50 border-border/30">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="volume">Volume</SelectItem>
                  <SelectItem value="price">Price</SelectItem>
                  <SelectItem value="change">24h Change</SelectItem>
                  <SelectItem value="market-cap">Market Cap</SelectItem>
                  <SelectItem value="trending">Trending</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Category Filter */}
          <div className="flex flex-wrap gap-2 justify-center">
            {categories.map((category) => (
              <Button
                key={category}
                variant={selectedCategory === category ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(category)}
                className={`transition-all duration-200 ${
                  selectedCategory === category
                    ? 'bg-gradient-to-r from-teal-500 to-cyan-500 text-white'
                    : 'bg-card/50 border-border/30'
                }`}
              >
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </Button>
            ))}
          </div>
        </motion.div>

        {/* Trading Pairs Table */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={contentInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
          transition={{ duration: 0.8, delay: 0.4 }}
        >
          <Card className="border border-border/30 bg-card/50 backdrop-blur-sm overflow-hidden">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-cyan-500" />
                Market Overview
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b border-border/30">
                    <tr className="text-left">
                      <th className="px-6 py-4 text-sm font-medium text-muted-foreground">Asset</th>
                      <th className="px-6 py-4 text-sm font-medium text-muted-foreground">Price</th>
                      <th className="px-6 py-4 text-sm font-medium text-muted-foreground">24h Change</th>
                      <th className="px-6 py-4 text-sm font-medium text-muted-foreground hidden lg:table-cell">Chart</th>
                      <th className="px-6 py-4 text-sm font-medium text-muted-foreground hidden md:table-cell">Volume</th>
                      <th className="px-6 py-4 text-sm font-medium text-muted-foreground hidden xl:table-cell">Market Cap</th>
                      <th className="px-6 py-4 text-sm font-medium text-muted-foreground">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPairs.slice(0, 20).map((pair, index) => (
                      <motion.tr 
                        key={pair.symbol}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="border-b border-border/30 hover:bg-accent/30 transition-colors cursor-pointer"
                        onClick={() => handleCryptoClick(pair)}
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full overflow-hidden bg-gradient-to-br from-teal-400 to-cyan-500 flex items-center justify-center">
                              <img 
                                src={pair.image} 
                                alt={pair.name}
                                className="w-5 h-5 object-contain"
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none';
                                  e.currentTarget.nextElementSibling!.style.display = 'flex';
                                }}
                              />
                              <div className="hidden w-full h-full bg-gradient-to-br from-teal-400 to-cyan-500 rounded-full items-center justify-center">
                                <span className="text-white font-bold text-xs">
                                  {pair.symbol.slice(0, 2)}
                                </span>
                              </div>
                            </div>
                            <div>
                              <p className="font-medium text-foreground">{pair.symbol}</p>
                              <p className="text-sm text-muted-foreground">{pair.name}</p>
                            </div>
                            {pair.trending && (
                              <Badge variant="secondary" className="text-xs">
                                <Zap className="w-3 h-3 mr-1" />
                                Hot
                              </Badge>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <p className="font-medium text-foreground">${formatPrice(pair.price)}</p>
                        </td>
                        <td className="px-6 py-4">
                          <div className={`flex items-center gap-1 ${
                            pair.change24h >= 0 ? 'text-green-500' : 'text-red-500'
                          }`}>
                            {pair.change24h >= 0 ? (
                              <ArrowUpRight className="w-4 h-4" />
                            ) : (
                              <ArrowDownRight className="w-4 h-4" />
                            )}
                            {pair.change24h >= 0 ? '+' : ''}{pair.change24h.toFixed(2)}%
                          </div>
                        </td>
                        <td className="px-6 py-4 hidden lg:table-cell">
                          <div onClick={(e) => e.stopPropagation()}>
                            <MiniChart 
                              data={pair.priceHistory} 
                              isPositive={pair.change24h >= 0}
                            />
                          </div>
                        </td>
                        <td className="px-6 py-4 hidden md:table-cell">
                          <p className="text-foreground">{formatVolume(pair.volume24h)}</p>
                        </td>
                        <td className="px-6 py-4 hidden xl:table-cell">
                          <p className="text-foreground">{formatVolume(pair.marketCap)}</p>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleBuyCrypto(pair);
                              }}
                              className="bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white"
                            >
                              Trade
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCryptoClick(pair);
                              }}
                              className="hidden sm:flex"
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
            </CardContent>
          </Card>
        </motion.div>

        {/* No Results */}
        {filteredPairs.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-16"
          >
            <Search className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-xl font-semibold text-foreground mb-2">No trading pairs found</h3>
            <p className="text-muted-foreground">
              Try adjusting your search or filter criteria
            </p>
          </motion.div>
        )}
      </div>

      {/* Crypto Detail Modal */}
      {showCryptoDetail && selectedCrypto && (
        <CryptoDetailScreen
          crypto={{
            symbol: selectedCrypto.symbol,
            name: selectedCrypto.name,
            price: selectedCrypto.price,
            change: selectedCrypto.change24h,
            image: selectedCrypto.image,
            category: selectedCrypto.category
          }}
          onBack={() => {
            setShowCryptoDetail(false);
            setSelectedCrypto(null);
          }}
        />
      )}

      {/* Buy Modal */}
      {showBuyModal && buyingCrypto && (
        <BuyCryptoModal
          crypto={buyingCrypto}
          isOpen={showBuyModal}
          onClose={() => {
            setShowBuyModal(false);
            setBuyingCrypto(null);
          }}
        />
      )}
    </section>
  );
}