"use client";

import { useState, useCallback } from "react";
import { motion } from "motion/react";
import { useInViewAnimation } from "./interactive/useInViewAnimation";
import { useIsMobile } from "./ui/use-mobile";
import { useTheme } from "./ui/use-theme";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Input } from "./ui/input";
import { Badge } from "./ui/badge";
import { Search, Filter, TrendingUp, TrendingDown } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

// Components
import { WalletHeader } from './dashboard/WalletHeader';
import { NetworkSelector } from './dashboard/NetworkSelector';
import { TokenAvatar } from './dashboard/TokenAvatar';
import { MobileTokenCard } from './dashboard/MobileTokenCard';

// Constants and types
import { 
  PORTFOLIO_DATA, 
  PERFORMANCE_DATA, 
  TOKEN_HOLDINGS, 
  TIMEFRAMES, 
  TOKEN_FILTERS,
  WALLET_CONFIG 
} from '~~/utils/constants';
import type { NetworkId, Timeframe, TokenFilter } from '~~/utils/constants';

export function DashboardSection() {
  const { ref: heroRef, isInView: heroInView } = useInViewAnimation();
  const { ref: chartsRef, isInView: chartsInView } = useInViewAnimation();
  const { ref: tokensRef, isInView: tokensInView } = useInViewAnimation();
  const isMobile = useIsMobile();
  const { isDark } = useTheme();

  // State management
  const [selectedNetwork, setSelectedNetwork] = useState<NetworkId>("all");
  const [selectedTimeframe, setSelectedTimeframe] = useState<Timeframe>("1M");
  const [isBalanceVisible, setIsBalanceVisible] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [tokenFilter, setTokenFilter] = useState<TokenFilter>("All");
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  // Event handlers
  const toggleBalanceVisibility = useCallback(() => {
    setIsBalanceVisible(prev => !prev);
  }, []);

  const handleNetworkChange = useCallback((networkId: NetworkId) => {
    setSelectedNetwork(networkId);
  }, []);

  const handleTimeframeChange = useCallback((timeframe: Timeframe) => {
    setSelectedTimeframe(timeframe);
  }, []);

  const handleTokenFilterChange = useCallback((filter: TokenFilter) => {
    setTokenFilter(filter);
  }, []);

  // Helper function for button styles
  const getButtonStyle = useCallback((isActive: boolean) => {
    if (!isDark) {
      return isActive 
        ? "bg-blue-500 text-white border-blue-400" 
        : "bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-800 border border-gray-300";
    } else {
      return isActive 
        ? "bg-blue-600 text-white border-blue-500" 
        : "bg-gray-800/50 text-gray-300 hover:bg-gray-700 hover:text-white border border-gray-600";
    }
  }, [isDark]);

  return (
    <div className="min-h-screen bg-background text-foreground relative overflow-x-hidden transition-colors duration-300">
      {/* Wallet Header */}
      <div ref={heroRef}>
        <WalletHeader
          isInView={heroInView}
          isBalanceVisible={isBalanceVisible}
          onToggleBalance={toggleBalanceVisibility}
          isMobile={isMobile}
        />
      </div>

      {/* Network Selection */}
      <NetworkSelector
        selectedNetwork={selectedNetwork}
        onNetworkChange={handleNetworkChange}
        isInView={heroInView}
        isMobile={isMobile}
      />

      {/* Charts Section */}
      <section ref={chartsRef} className="py-4 sm:py-8 px-3 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className={`grid gap-4 sm:gap-8 ${isMobile ? 'grid-cols-1' : 'grid-cols-1 lg:grid-cols-3'}`}>
            
            {/* Portfolio Distribution */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={chartsInView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.6 }}
              className={isMobile ? 'order-2' : 'lg:col-span-1'}
            >
              <Card 
                className="p-4 sm:p-6 border transition-all duration-300"
                style={{ 
                  backgroundColor: 'var(--card-bg)',
                  borderColor: isDark ? '#374151' : 'var(--border-light)'
                }}
              >
                <h3 className="text-lg sm:text-xl mb-4 sm:mb-6 text-foreground transition-colors duration-300">Portfolio Distribution</h3>
                <div className={isMobile ? 'h-48' : 'h-64'}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={PORTFOLIO_DATA}
                        cx="50%"
                        cy="50%"
                        innerRadius={isMobile ? 40 : 60}
                        outerRadius={isMobile ? 70 : 100}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {PORTFOLIO_DATA.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value, name) => [`${value}%`, name]}
                        contentStyle={{
                          backgroundColor: isDark ? '#1f2937' : '#ffffff',
                          border: isDark ? '1px solid #374151' : '1px solid #e5e7eb',
                          borderRadius: '8px',
                          color: isDark ? '#fff' : '#111827',
                          fontSize: isMobile ? '12px' : '14px'
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-2 sm:space-y-3 mt-4">
                  {PORTFOLIO_DATA.map((item) => (
                    <div key={item.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-2 sm:gap-3">
                        <div 
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: item.color }}
                        />
                        <span className="text-muted-foreground text-sm sm:text-base transition-colors duration-300">{item.name}</span>
                      </div>
                      <div className="text-right">
                        <div className="text-foreground font-medium text-sm sm:text-base transition-colors duration-300">{item.value}%</div>
                        <div className="text-muted-foreground text-xs sm:text-sm transition-colors duration-300">{item.amount}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </motion.div>

            {/* Performance Chart */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={chartsInView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.2 }}
              className={isMobile ? 'order-1' : 'lg:col-span-2'}
            >
              <Card 
                className="p-4 sm:p-6 border transition-all duration-300"
                style={{ 
                  backgroundColor: 'var(--card-bg)',
                  borderColor: isDark ? '#374151' : 'var(--border-light)'
                }}
              >
                <div className="flex items-center justify-between mb-4 sm:mb-6 flex-wrap gap-2">
                  <h3 className="text-lg sm:text-xl text-foreground transition-colors duration-300">Total value {WALLET_CONFIG.totalValue}</h3>
                  <div className={`flex gap-1 sm:gap-2 ${isMobile ? 'flex-wrap' : ''}`}>
                    {TIMEFRAMES.map((tf) => (
                      <Button
                        key={tf}
                        variant={selectedTimeframe === tf ? "default" : "ghost"}
                        size="sm"
                        className={`text-xs sm:text-sm transition-colors duration-200 ${getButtonStyle(selectedTimeframe === tf)}`}
                        onClick={() => handleTimeframeChange(tf)}
                      >
                        {tf}
                      </Button>
                    ))}
                  </div>
                </div>
                <div className={isMobile ? 'h-48' : 'h-64'}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={PERFORMANCE_DATA}>
                      <defs>
                        <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid 
                        strokeDasharray="3 3" 
                        stroke={isDark ? "#374151" : "#e5e7eb"} 
                      />
                      <XAxis 
                        dataKey="date" 
                        stroke={isDark ? "#6B7280" : "#9ca3af"}
                        fontSize={isMobile ? 10 : 12}
                      />
                      <YAxis 
                        stroke={isDark ? "#6B7280" : "#9ca3af"}
                        fontSize={isMobile ? 10 : 12}
                        tickFormatter={(value) => `$${(value/1000).toFixed(0)}k`}
                      />
                      <Tooltip 
                        formatter={(value) => [`$${value.toLocaleString()}`, 'Value']}
                        contentStyle={{
                          backgroundColor: isDark ? '#1f2937' : '#ffffff',
                          border: isDark ? '1px solid #374151' : '1px solid #e5e7eb',
                          borderRadius: '8px',
                          color: isDark ? '#fff' : '#111827',
                          fontSize: isMobile ? '12px' : '14px'
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="value"
                        stroke="#10B981"
                        strokeWidth={2}
                        fillOpacity={1}
                        fill="url(#colorValue)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Tokens Section */}
      <section ref={tokensRef} className="py-4 sm:py-8 px-3 sm:px-6 lg:px-8 pb-36 sm:pb-28">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={tokensInView ? { opacity: 1, y: 0 } : {}}
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
                <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                  <h3 className="text-lg sm:text-xl text-foreground transition-colors duration-300">Tokens {WALLET_CONFIG.totalValue}</h3>
                  
                  {/* Desktop Controls */}
                  {!isMobile && (
                    <div className="flex items-center gap-4">
                      <div className="flex gap-2">
                        {TOKEN_FILTERS.map((filter) => (
                          <Button
                            key={filter}
                            variant={tokenFilter === filter ? "default" : "ghost"}
                            size="sm"
                            className={`transition-colors duration-200 ${getButtonStyle(tokenFilter === filter)}`}
                            onClick={() => handleTokenFilterChange(filter)}
                          >
                            {filter}
                          </Button>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        {TIMEFRAMES.map((tf) => (
                          <Button
                            key={tf}
                            variant={selectedTimeframe === tf ? "default" : "ghost"}
                            size="sm"
                            className={`transition-colors duration-200 ${getButtonStyle(selectedTimeframe === tf)}`}
                            onClick={() => handleTimeframeChange(tf)}
                          >
                            {tf}
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
                      className={`flex items-center gap-2 transition-colors duration-200 ${getButtonStyle(false)}`}
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
                    className="mb-4 space-y-3 border-t pt-4 transition-colors duration-300"
                    style={{ borderColor: isDark ? '#374151' : 'var(--border-light)' }}
                  >
                    <div>
                      <label className="text-sm text-muted-foreground mb-2 block transition-colors duration-300">Filter</label>
                      <div className="flex gap-2">
                        {TOKEN_FILTERS.map((filter) => (
                          <Button
                            key={filter}
                            variant={tokenFilter === filter ? "default" : "ghost"}
                            size="sm"
                            className={`text-xs transition-colors duration-200 ${getButtonStyle(tokenFilter === filter)}`}
                            onClick={() => handleTokenFilterChange(filter)}
                          >
                            {filter}
                          </Button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="text-sm text-muted-foreground mb-2 block transition-colors duration-300">Timeframe</label>
                      <div className="flex gap-2 flex-wrap">
                        {TIMEFRAMES.map((tf) => (
                          <Button
                            key={tf}
                            variant={selectedTimeframe === tf ? "default" : "ghost"}
                            size="sm"
                            className={`text-xs transition-colors duration-200 ${getButtonStyle(selectedTimeframe === tf)}`}
                            onClick={() => handleTimeframeChange(tf)}
                          >
                            {tf}
                          </Button>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
                
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground transition-colors duration-300" />
                  <Input
                    placeholder="Search address or domain"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className={`pl-10 transition-colors duration-300 ${
                      isDark 
                        ? "bg-gray-800 border-gray-600 text-white placeholder:text-gray-400"
                        : "bg-gray-50 border-gray-300 text-gray-900 placeholder:text-gray-500"
                    }`}
                  />
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
                        <th className="text-left py-4 px-6 text-muted-foreground font-medium transition-colors duration-300">Token</th>
                        <th className="text-left py-4 px-6 text-muted-foreground font-medium transition-colors duration-300">Type</th>
                        <th className="text-right py-4 px-6 text-muted-foreground font-medium transition-colors duration-300">Balance</th>
                        <th className="text-right py-4 px-6 text-muted-foreground font-medium transition-colors duration-300">Price</th>
                        <th className="text-right py-4 px-6 text-muted-foreground font-medium transition-colors duration-300">Value</th>
                        <th className="text-right py-4 px-6 text-muted-foreground font-medium transition-colors duration-300">P&L</th>
                        <th className="text-right py-4 px-6 text-muted-foreground font-medium transition-colors duration-300">ROI%</th>
                      </tr>
                    </thead>
                    <tbody>
                      {TOKEN_HOLDINGS.map((token, index) => (
                        <motion.tr
                          key={token.symbol}
                          initial={{ opacity: 0, y: 20 }}
                          animate={tokensInView ? { opacity: 1, y: 0 } : {}}
                          transition={{ duration: 0.4, delay: index * 0.05 }}
                          className={`border-b transition-all duration-300 ${
                            isDark 
                              ? "border-gray-800 hover:bg-gray-800/30" 
                              : "border-gray-200 hover:bg-gray-50"
                          }`}
                        >
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-3">
                              <TokenAvatar symbol={token.symbol} />
                              <div>
                                <div className="font-medium text-foreground transition-colors duration-300">{token.symbol}</div>
                                <div className="text-sm text-muted-foreground transition-colors duration-300">{token.name}</div>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-6">
                            <Badge 
                              variant="secondary" 
                              className={`transition-colors duration-300 ${
                                isDark 
                                  ? "bg-blue-900/30 text-blue-300 border-blue-700"
                                  : "bg-blue-100 text-blue-700 border-blue-300"
                              }`}
                            >
                              {token.network}
                            </Badge>
                          </td>
                          <td className="text-right py-4 px-6 font-mono text-foreground transition-colors duration-300">
                            {token.balance} {token.symbol}
                          </td>
                          <td className="text-right py-4 px-6 font-mono text-foreground transition-colors duration-300">
                            {token.price}
                          </td>
                          <td className="text-right py-4 px-6 font-mono text-foreground transition-colors duration-300">
                            {token.value}
                          </td>
                          <td className={`text-right py-4 px-6 font-mono ${
                            token.isPositive ? 'text-green-400' : 'text-red-400'
                          }`}>
                            {token.pnl}
                          </td>
                          <td className={`text-right py-4 px-6 font-mono ${
                            token.isPositive ? 'text-green-400' : 'text-red-400'
                          }`}>
                            <div className="flex items-center justify-end gap-1">
                              {token.isPositive ? 
                                <TrendingUp className="w-3 h-3" /> : 
                                <TrendingDown className="w-3 h-3" />
                              }
                              {token.roi}
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
                  {TOKEN_HOLDINGS.map((token, index) => (
                    <MobileTokenCard 
                      key={token.symbol} 
                      token={token} 
                      index={index} 
                      isInView={tokensInView}
                    />
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