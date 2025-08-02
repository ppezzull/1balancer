import { motion, AnimatePresence } from "motion/react";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { useTheme } from "./ui/use-theme";
import { useIsMobile } from "./ui/use-mobile";
import { 
  X, 
  TrendingUp, 
  TrendingDown, 
  PieChart, 
  Calendar, 
  DollarSign, 
  Target, 
  Zap, 
  Settings,
  Edit,
  Share,
  Download,
  BarChart3,
  Clock,
  Coins,
  RefreshCw,
  Shield,
  Rocket,
  TrendingDown as Drift,
  Timer,
  Activity,
  Percent
} from "lucide-react";
import { PieChart as RechartsPieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";

interface Portfolio {
  id: string;
  name: string;
  type: 'drift' | 'time' | 'custom';  // This is our converted type for local use
  presetType?: string;
  totalInvestment: number;
  allocations: Array<{
    symbol: string;
    name: string;
    percentage: number;
    color: string;
    image: string;
    amount: number;
  }>;
  rebalanceConfig?: {
    strategy: 'drift' | 'time';
    driftThreshold?: number;
    timeFrequency?: 'weekly' | 'monthly' | 'quarterly';
    lastRebalance?: string;
    nextRebalance?: string;
    autoRebalance?: boolean;
  };
  createdAt: string;
  performance?: {
    totalValue: number;
    totalReturn: number;
    returnPercentage: number;
    dailyChange: number;
    dailyChangePercentage: number;
  };
}

interface PortfolioDetailModalProps {
  portfolio: Portfolio | null;
  isOpen: boolean;
  onClose: () => void;
}

export function PortfolioDetailModal({ portfolio, isOpen, onClose }: PortfolioDetailModalProps) {
  const { isDark } = useTheme();
  const isMobile = useIsMobile();

  if (!portfolio || !isOpen) return null;

  // Calculate mock performance data
  const performance = portfolio.performance || {
    totalValue: portfolio.totalInvestment * (1 + Math.random() * 0.3),
    totalReturn: portfolio.totalInvestment * (Math.random() * 0.3),
    returnPercentage: (Math.random() * 30) - 5,
    dailyChange: portfolio.totalInvestment * (Math.random() * 0.02 - 0.01),
    dailyChangePercentage: (Math.random() * 4) - 2
  };

  // Mock rebalance configuration if not present
  const rebalanceConfig = portfolio.rebalanceConfig || {
    strategy: portfolio.type === 'drift' ? 'drift' : portfolio.type === 'time' ? 'time' : 'drift',
    driftThreshold: 5 + Math.random() * 10, // 5-15%
    timeFrequency: ['weekly', 'monthly', 'quarterly'][Math.floor(Math.random() * 3)] as 'weekly' | 'monthly' | 'quarterly',
    lastRebalance: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
    nextRebalance: new Date(Date.now() + Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
    autoRebalance: Math.random() > 0.3
  };

  const isPositiveReturn = performance.returnPercentage > 0;
  const isPositiveDailyChange = performance.dailyChangePercentage > 0;

  // Prepare data for pie chart
  const pieData = portfolio.allocations.map(allocation => ({
    name: allocation.symbol,
    value: allocation.percentage,
    amount: allocation.amount,
    color: allocation.color,
    fullName: allocation.name
  }));

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

  const getRebalanceStrategyInfo = (config: typeof rebalanceConfig) => {
    if (config.strategy === 'drift') {
      return {
        title: 'Drift-Based Rebalancing',
        icon: <Drift className="w-5 h-5 text-orange-500" />,
        description: 'Automatically rebalances when asset allocations drift beyond the set threshold.',
        color: 'orange'
      };
    } else {
      return {
        title: 'Time-Based Rebalancing',
        icon: <Clock className="w-5 h-5 text-blue-500" />,
        description: 'Rebalances on a fixed schedule regardless of market conditions.',
        color: 'blue'
      };
    }
  };

  const getFrequencyDisplay = (frequency: 'weekly' | 'monthly' | 'quarterly') => {
    const displays = {
      weekly: 'Every Week',
      monthly: 'Every Month',
      quarterly: 'Every Quarter'
    };
    return displays[frequency];
  };

  const typeStyle = getTypeStyle(portfolio.type, portfolio.presetType);
  const strategyInfo = getRebalanceStrategyInfo(rebalanceConfig);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center"
        style={{
          background: 'rgba(0, 0, 0, 0.8)',
          backdropFilter: 'blur(8px)',
          // Ensure proper viewport handling on mobile
          padding: isMobile ? '16px' : '32px'
        }}
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className={`w-full ${
            isMobile 
              ? 'max-w-full max-h-[100vh] h-full overflow-hidden' 
              : 'max-w-4xl max-h-[90vh] overflow-hidden'
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          <Card 
            className="border border-border/30 overflow-hidden relative h-full flex flex-col"
            style={{
              background: isDark 
                ? 'linear-gradient(135deg, #1f2937 0%, #111827 50%, #0f172a 100%)'
                : 'linear-gradient(135deg, #ffffff 0%, #f8fafc 50%, #f1f5f9 100%)',
              backdropFilter: 'blur(20px)'
            }}
          >
            {/* Mobile-first Close Button - Always visible */}
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className={`absolute ${
                isMobile 
                  ? 'top-3 right-3 z-20 w-10 h-10 p-0 bg-background/80 hover:bg-background border border-border/50 backdrop-blur-sm' 
                  : 'top-4 right-4 z-20 hover:bg-accent/50'
              }`}
              style={{
                minWidth: isMobile ? '40px' : 'auto',
                minHeight: isMobile ? '40px' : 'auto'
              }}
            >
              <X className={`${isMobile ? 'w-5 h-5' : 'w-4 h-4'}`} />
            </Button>

            {/* Header */}
            <CardHeader className={`border-b border-border/30 ${isMobile ? 'pr-16' : 'pr-20'}`}>
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <CardTitle className={`${isMobile ? 'text-xl' : 'text-2xl'} text-foreground truncate`}>
                      {portfolio.name}
                    </CardTitle>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    
                    <Badge variant="outline" className="text-xs">
                      {portfolio.type === 'drift' ? (
                        <><Drift className="w-3 h-3 mr-1" />Drift</>
                      ) : portfolio.type === 'time' ? (
                        <><Clock className="w-3 h-3 mr-1" />Time</>
                      ) : (
                        <><Settings className="w-3 h-3 mr-1" />Custom</>
                      )}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="w-4 h-4" />
                    <span>Created {new Date(portfolio.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
                
                {/* Desktop Action Buttons - Hidden on mobile */}
                {!isMobile && (
                  <div className="flex items-center gap-2 ml-4">
                    <Button variant="ghost" size="sm" className="hover:bg-accent/50">
                      <Share className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm" className="hover:bg-accent/50">
                      <Download className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm" className="hover:bg-accent/50">
                      <Edit className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>

            <CardContent className={`flex-1 p-0 ${
              isMobile ? 'overflow-y-auto scrollbar-default' : 'max-h-[70vh] overflow-y-auto scrollbar-default'
            }`}>
              <div className={`${
                isMobile 
                  ? 'flex flex-col space-y-6 p-4' 
                  : 'grid grid-cols-1 lg:grid-cols-2 gap-6 p-6'
              }`}>
                {/* Performance Overview */}
                <Card className="border border-border/30 bg-card/50">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <DollarSign className="w-5 h-5 text-green-500" />
                      Portfolio Performance
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className={`grid ${isMobile ? 'grid-cols-1 gap-3' : 'grid-cols-2 gap-4'}`}>
                      <div>
                        <p className="text-sm text-muted-foreground">Current Value</p>
                        <p className={`${isMobile ? 'text-xl' : 'text-2xl'} font-bold text-foreground`}>
                          ${performance.totalValue.toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Initial Investment</p>
                        <p className={`${isMobile ? 'text-lg' : 'text-xl'} font-semibold text-foreground`}>
                          ${portfolio.totalInvestment.toLocaleString()}
                        </p>
                      </div>
                    </div>
                    
                    <div className={`grid ${isMobile ? 'grid-cols-1 gap-3' : 'grid-cols-2 gap-4'}`}>
                      <div>
                        <p className="text-sm text-muted-foreground">Total Return</p>
                        <div className={`flex items-center gap-1 ${
                          isPositiveReturn ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                        }`}>
                          {isPositiveReturn ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                          <span className="font-bold">
                            {isPositiveReturn ? '+' : ''}${performance.totalReturn.toLocaleString()}
                          </span>
                          <span className="text-sm">
                            ({isPositiveReturn ? '+' : ''}{performance.returnPercentage.toFixed(2)}%)
                          </span>
                        </div>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">24h Change</p>
                        <div className={`flex items-center gap-1 ${
                          isPositiveDailyChange ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                        }`}>
                          {isPositiveDailyChange ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                          <span className="font-bold">
                            {isPositiveDailyChange ? '+' : ''}${performance.dailyChange.toLocaleString()}
                          </span>
                          <span className="text-sm">
                            ({isPositiveDailyChange ? '+' : ''}{performance.dailyChangePercentage.toFixed(2)}%)
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Rebalancing Strategy Configuration */}
                <Card className="border border-border/30 bg-card/50">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      {strategyInfo.icon}
                      {strategyInfo.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="p-3 rounded-lg bg-accent/20 border border-border/20">
                      <p className="text-sm text-muted-foreground mb-2">Strategy Description</p>
                      <p className="text-sm text-foreground leading-relaxed">
                        {strategyInfo.description}
                      </p>
                    </div>

                    <div className={`grid ${isMobile ? 'grid-cols-1 gap-3' : 'grid-cols-2 gap-4'}`}>
                      {rebalanceConfig.strategy === 'drift' ? (
                        <>
                          <div className="flex items-center gap-3 p-3 rounded-lg bg-orange-500/10 border border-orange-500/20">
                            <Percent className="w-5 h-5 text-orange-500 flex-shrink-0" />
                            <div>
                              <p className="text-sm text-muted-foreground">Drift Threshold</p>
                              <p className="font-bold text-foreground">
                                {rebalanceConfig.driftThreshold?.toFixed(1)}%
                              </p>
                            </div>
                          </div>
                          
                        </>
                      ) : (
                        <>
                          <div className="flex items-center gap-3 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                            <Timer className="w-5 h-5 text-blue-500 flex-shrink-0" />
                            <div>
                              <p className="text-sm text-muted-foreground">Frequency</p>
                              <p className="font-bold text-foreground">
                                {getFrequencyDisplay(rebalanceConfig.timeFrequency!)}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                            <Activity className="w-5 h-5 text-green-500 flex-shrink-0" />
                            <div>
                              <p className="text-sm text-muted-foreground">Auto Execute</p>
                              <p className="font-bold text-foreground">
                                {rebalanceConfig.autoRebalance ? 'Enabled' : 'Manual'}
                              </p>
                            </div>
                          </div>
                        </>
                      )}
                    </div>

                    <div className={`grid ${isMobile ? 'grid-cols-1 gap-3' : 'grid-cols-2 gap-4'}`}>
                      <div>
                        <p className="text-sm text-muted-foreground">Last Rebalance</p>
                        <p className="font-semibold text-foreground">
                          {rebalanceConfig.lastRebalance 
                            ? new Date(rebalanceConfig.lastRebalance).toLocaleDateString()
                            : 'Never'
                          }
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">
                          {rebalanceConfig.strategy === 'time' ? 'Next Scheduled' : 'Next Check'}
                        </p>
                        <p className="font-semibold text-teal-600 dark:text-teal-400">
                          {rebalanceConfig.nextRebalance 
                            ? new Date(rebalanceConfig.nextRebalance).toLocaleDateString()
                            : 'TBD'
                          }
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Pie Chart */}
                <Card className="border border-border/30 bg-card/50">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <PieChart className="w-5 h-5 text-cyan-500" />
                      Asset Allocation
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className={`${isMobile ? 'h-64' : 'h-80'}`}>
                      <ResponsiveContainer width="100%" height="100%">
                        <RechartsPieChart>
                          <Pie
                            data={pieData}
                            cx="50%"
                            cy="50%"
                            innerRadius={isMobile ? 40 : 60}
                            outerRadius={isMobile ? 80 : 120}
                            paddingAngle={2}
                            dataKey="value"
                          >
                            {pieData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip 
                            formatter={(value: any, name: any, props: any) => [
                              `${value.toFixed(1)}%`,
                              props.payload.fullName
                            ]}
                            labelFormatter={() => ''}
                            contentStyle={{
                              backgroundColor: isDark ? '#1f2937' : '#ffffff',
                              border: '1px solid rgba(255, 255, 255, 0.1)',
                              borderRadius: '8px',
                              color: isDark ? '#ffffff' : '#000000',
                              fontSize: isMobile ? '12px' : '14px'
                            }}
                          />
                          <Legend 
                            verticalAlign="bottom" 
                            height={36}
                            fontSize={isMobile ? 10 : 12}
                            formatter={(value, entry: any) => (
                              <span style={{ color: entry.color }}>
                                {value} ({entry.payload.value.toFixed(1)}%)
                              </span>
                            )}
                          />
                        </RechartsPieChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                {/* Asset Breakdown */}
                <Card className="border border-border/30 bg-card/50">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Coins className="w-5 h-5 text-teal-500" />
                      Asset Breakdown
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className={`space-y-3 ${
                      isMobile 
                        ? 'max-h-48 overflow-y-auto scrollbar-default' 
                        : 'max-h-60 overflow-y-auto scrollbar-default'
                    }`}>
                      {portfolio.allocations.map((allocation, index) => (
                        <div key={allocation.symbol} className="flex items-center justify-between p-3 rounded-lg bg-accent/20 hover:bg-accent/30 transition-colors">
                          <div className="flex items-center gap-3">
                            <div className={`${
                              isMobile ? 'w-8 h-8' : 'w-10 h-10'
                            } rounded-lg overflow-hidden bg-gradient-to-br from-teal-400 to-cyan-500 flex items-center justify-center`}>
                              <img 
                                src={allocation.image} 
                                alt={allocation.name}
                                className={`${isMobile ? 'w-5 h-5' : 'w-6 h-6'} object-contain`}
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none';
                                  e.currentTarget.nextElementSibling!.style.display = 'flex';
                                }}
                              />
                              <div className="hidden w-full h-full bg-gradient-to-br from-teal-400 to-cyan-500 rounded-lg items-center justify-center">
                                <span className="text-white font-bold text-xs">
                                  {allocation.symbol.slice(0, 2)}
                                </span>
                              </div>
                            </div>
                            <div className="min-w-0 flex-1">
                              <h4 className={`font-semibold text-foreground ${isMobile ? 'text-sm' : ''} truncate`}>
                                {allocation.name}
                              </h4>
                              <p className={`text-muted-foreground font-mono ${isMobile ? 'text-xs' : 'text-sm'}`}>
                                {allocation.symbol}
                              </p>
                            </div>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <div className="flex items-center gap-2">
                              <div 
                                className="inline-block w-3 h-3 rounded-full"
                                style={{ backgroundColor: allocation.color }}
                              />
                              <span className={`font-bold text-foreground ${isMobile ? 'text-sm' : ''}`}>
                                {allocation.percentage.toFixed(1)}%
                              </span>
                            </div>
                            <p className={`text-muted-foreground ${isMobile ? 'text-xs' : 'text-sm'}`}>
                              ${allocation.amount.toLocaleString()}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Quick Actions */}
                <Card className="border border-border/30 bg-card/50">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">Quick Actions</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Button 
                      className="w-full justify-start"
                      size={isMobile ? "sm" : "default"}
                      style={{
                        background: isDark 
                          ? 'var(--gradient-primary)'
                          : 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
                        color: 'white'
                      }}
                    >
                      <DollarSign className={`${isMobile ? 'w-3 h-3' : 'w-4 h-4'} mr-2`} />
                      Add Funds
                    </Button>
                    <Button 
                      variant="outline" 
                      className="w-full justify-start"
                      size={isMobile ? "sm" : "default"}
                    >
                      <RefreshCw className={`${isMobile ? 'w-3 h-3' : 'w-4 h-4'} mr-2`} />
                      Trigger Rebalance
                    </Button>
                    <Button 
                      variant="outline" 
                      className="w-full justify-start"
                      size={isMobile ? "sm" : "default"}
                    >
                      <Settings className={`${isMobile ? 'w-3 h-3' : 'w-4 h-4'} mr-2`} />
                      Edit Strategy
                    </Button>

                    {/* Mobile Action Buttons */}
                    {isMobile && (
                      <div className="flex gap-2 pt-2">
                        <Button variant="outline" size="sm" className="flex-1">
                          <Share className="w-3 h-3 mr-1" />
                          Share
                        </Button>
                        <Button variant="outline" size="sm" className="flex-1">
                          <Download className="w-3 h-3 mr-1" />
                          Export
                        </Button>
                        <Button variant="outline" size="sm" className="flex-1">
                          <Edit className="w-3 h-3 mr-1" />
                          Edit
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}