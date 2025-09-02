import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import {
  Activity,
  BarChart3,
  DollarSign,
  ExternalLink,
  Heart,
  MessageCircle,
  Search,
  Share,
  Star,
  Target,
  TrendingDown,
  TrendingUp,
  Users,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { Cell, Pie, PieChart as RechartsPieChart, ResponsiveContainer, Tooltip } from "recharts";
import { toast } from "sonner";
import { Badge } from "~~/components/shared/badge";
import { Button } from "~~/components/shared/button";
import { Card, CardContent, CardHeader } from "~~/components/shared/card";
import { Input } from "~~/components/shared/input";
import { useInViewAnimation } from "~~/components/shared/interactive/useInViewAnimation";
import { useIsMobile } from "~~/components/shared/use-mobile";
import { useTheme } from "~~/components/shared/use-theme";
import { CRYPTOCURRENCY_DATA } from "~~/utils/constants";

interface TokenAllocation {
  symbol: string;
  name: string;
  percentage: number;
  color: string;
  image: string;
  amount: number;
}

interface SharedPortfolio {
  id: string;
  name: string;
  author: {
    username: string;
    avatar: string;
    isVerified: boolean;
    followers: number;
  };
  type: "autoinvest" | "manual";
  presetType: string;
  totalInvestment: number;
  allocations: TokenAllocation[];
  performance: {
    totalValue: number;
    totalReturn: number;
    returnPercentage: number;
    dailyChange: number;
    dailyChangePercentage: number;
  };
  metrics: {
    likes: number;
    shares: number;
    bookmarks: number;
    comments: number;
  };
  strategy: {
    description: string;
    riskLevel: "conservative" | "moderate" | "aggressive";
    timeHorizon: string;
    rebalanceFrequency: string;
  };
  tags: string[];
  createdAt: string;
  isPublic: boolean;
  category: "defi" | "layer2" | "yield" | "growth" | "institutional";
}

interface PortfolioDetailModalProps {
  portfolio: SharedPortfolio | null;
  isOpen: boolean;
  onClose: () => void;
}

function PortfolioDetailModal({ portfolio, isOpen, onClose }: PortfolioDetailModalProps) {
  const { isDark } = useTheme();
  const isMobile = useIsMobile();

  if (!portfolio || !isOpen) return null;

  const pieData = portfolio.allocations.map(allocation => ({
    name: allocation.symbol,
    value: allocation.percentage,
    color: allocation.color,
    fullName: allocation.name,
  }));

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case "conservative":
        return "text-blue-500";
      case "moderate":
        return "text-yellow-500";
      case "aggressive":
        return "text-red-500";
      default:
        return "text-gray-500";
    }
  };

  const isPositiveReturn = portfolio.performance.returnPercentage > 0;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className={`fixed inset-0 z-50 flex items-center justify-center ${isMobile ? "p-2" : "p-4"}`}
        style={{
          background: "rgba(0, 0, 0, 0.8)",
          backdropFilter: "blur(8px)",
        }}
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className={`w-full ${isMobile ? "max-w-[95vw] max-h-[95vh]" : "max-w-4xl max-h-[90vh]"} overflow-hidden`}
          onClick={e => e.stopPropagation()}
        >
          <Card
            className="border border-border/30 overflow-hidden h-full"
            style={{
              background: isDark
                ? "linear-gradient(135deg, #1f2937 0%, #111827 50%, #0f172a 100%)"
                : "linear-gradient(135deg, #ffffff 0%, #f8fafc 50%, #f1f5f9 100%)",
              backdropFilter: "blur(20px)",
            }}
          >
            {/* Header - Mobile Responsive */}
            <CardHeader className={`border-b border-border/30 ${isMobile ? "p-4" : "p-6"}`}>
              <div className={`flex ${isMobile ? "flex-col gap-4" : "items-start justify-between"}`}>
                <div className={`flex items-center ${isMobile ? "gap-3" : "gap-4"}`}>
                  <div
                    className={`${isMobile ? "w-12 h-12" : "w-16 h-16"} rounded-full bg-gradient-to-r from-cyan-400 to-blue-500 flex items-center justify-center text-white font-bold ${isMobile ? "text-lg" : "text-xl"}`}
                  >
                    {portfolio.author.avatar}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 className={`${isMobile ? "text-lg" : "text-2xl"} font-bold text-foreground mb-1 truncate`}>
                      {portfolio.name}
                    </h2>
                    <div
                      className={`flex items-center gap-2 ${isMobile ? "text-xs" : "text-sm"} text-muted-foreground flex-wrap`}
                    >
                      <span>by @{portfolio.author.username}</span>
                      {portfolio.author.isVerified && <Star className="w-4 h-4 text-yellow-400" />}
                      <span>•</span>
                      <span>{portfolio.author.followers.toLocaleString()} followers</span>
                    </div>
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      <Badge variant="outline" className={getRiskColor(portfolio.strategy.riskLevel)}>
                        {portfolio.strategy.riskLevel}
                      </Badge>
                      <Badge variant="outline">{portfolio.type}</Badge>
                      <Badge variant="outline">{portfolio.category}</Badge>
                    </div>
                  </div>
                </div>

                <div className={`flex items-center gap-2 ${isMobile ? "justify-between w-full" : ""}`}>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm">
                      <Heart className="w-4 h-4" />
                      {isMobile ? portfolio.metrics.likes : `${portfolio.metrics.likes}`}
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Share className="w-4 h-4" />
                      {isMobile ? portfolio.metrics.shares : `${portfolio.metrics.shares}`}
                    </Button>
                  </div>
                  <Button variant="ghost" size="sm" onClick={onClose}>
                    <X className="w-5 h-5" />
                  </Button>
                </div>
              </div>
            </CardHeader>

            <CardContent
              className={`p-0 ${isMobile ? "max-h-[75vh]" : "max-h-[70vh]"} overflow-y-auto scrollbar-default`}
            >
              <div
                className={`${isMobile ? "flex flex-col space-y-4 p-4" : "grid grid-cols-1 lg:grid-cols-2 gap-6 p-6"}`}
              >
                {/* Left Column / Top Section on Mobile */}
                <div className="space-y-6">
                  {/* Performance */}
                  <Card className="border border-border/30 bg-card/50">
                    <CardHeader className={isMobile ? "p-4" : ""}>
                      <h3 className={`${isMobile ? "text-base" : "text-lg"} font-semibold flex items-center gap-2`}>
                        <Activity className="w-5 h-5 text-green-500" />
                        Performance
                      </h3>
                    </CardHeader>
                    <CardContent className={`space-y-4 ${isMobile ? "p-4 pt-0" : ""}`}>
                      <div className={`grid ${isMobile ? "grid-cols-1 gap-3" : "grid-cols-2 gap-4"}`}>
                        <div>
                          <p className="text-sm text-muted-foreground">Current Value</p>
                          <p className={`${isMobile ? "text-xl" : "text-2xl"} font-bold text-foreground`}>
                            ${portfolio.performance.totalValue.toLocaleString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Initial Investment</p>
                          <p className={`${isMobile ? "text-lg" : "text-xl"} font-semibold text-foreground`}>
                            ${portfolio.totalInvestment.toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-accent/20 rounded-lg">
                        <span className="text-sm text-muted-foreground">Total Return</span>
                        <div
                          className={`flex items-center gap-1 ${
                            isPositiveReturn ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
                          }`}
                        >
                          {isPositiveReturn ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                          <span className="font-bold">
                            {isPositiveReturn ? "+" : ""}${portfolio.performance.totalReturn.toLocaleString()}
                          </span>
                          <span className="text-sm">
                            ({isPositiveReturn ? "+" : ""}
                            {portfolio.performance.returnPercentage.toFixed(2)}%)
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Portfolio Composition */}
                  <Card className="border border-border/30 bg-card/50">
                    <CardHeader className={isMobile ? "p-4" : ""}>
                      <h3 className={`${isMobile ? "text-base" : "text-lg"} font-semibold flex items-center gap-2`}>
                        <BarChart3 className="w-5 h-5 text-cyan-500" />
                        Asset Allocation
                      </h3>
                    </CardHeader>
                    <CardContent className={isMobile ? "p-4 pt-0" : ""}>
                      <div className={isMobile ? "h-48" : "h-64"}>
                        <ResponsiveContainer width="100%" height="100%">
                          <RechartsPieChart>
                            <Pie
                              data={pieData}
                              cx="50%"
                              cy="50%"
                              innerRadius={isMobile ? 30 : 50}
                              outerRadius={isMobile ? 70 : 100}
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
                                props.payload.fullName,
                              ]}
                              labelFormatter={() => ""}
                              contentStyle={{
                                backgroundColor: isDark ? "#1f2937" : "#ffffff",
                                border: "1px solid rgba(255, 255, 255, 0.1)",
                                borderRadius: "8px",
                                color: isDark ? "#ffffff" : "#000000",
                                fontSize: isMobile ? "12px" : "14px",
                              }}
                            />
                          </RechartsPieChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Right Column / Bottom Section on Mobile */}
                <div className="space-y-6">
                  {/* Strategy Details */}
                  <Card className="border border-border/30 bg-card/50">
                    <CardHeader className={isMobile ? "p-4" : ""}>
                      <h3 className={`${isMobile ? "text-base" : "text-lg"} font-semibold flex items-center gap-2`}>
                        <Target className="w-5 h-5 text-purple-500" />
                        Investment Strategy
                      </h3>
                    </CardHeader>
                    <CardContent className={`space-y-4 ${isMobile ? "p-4 pt-0" : ""}`}>
                      <div>
                        <p className="text-sm text-muted-foreground mb-2">Description</p>
                        <p className={`text-foreground ${isMobile ? "text-sm" : ""} leading-relaxed`}>
                          {portfolio.strategy.description}
                        </p>
                      </div>
                      <div className={`grid ${isMobile ? "grid-cols-1 gap-3" : "grid-cols-2 gap-4"}`}>
                        <div>
                          <p className="text-sm text-muted-foreground">Time Horizon</p>
                          <p className="font-medium text-foreground">{portfolio.strategy.timeHorizon}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Rebalance</p>
                          <p className="font-medium text-foreground">{portfolio.strategy.rebalanceFrequency}</p>
                        </div>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground mb-2">Tags</p>
                        <div className="flex flex-wrap gap-2">
                          {portfolio.tags.map((tag, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Asset Breakdown */}
                  <Card className="border border-border/30 bg-card/50">
                    <CardHeader className={isMobile ? "p-4" : ""}>
                      <h3 className={`${isMobile ? "text-base" : "text-lg"} font-semibold flex items-center gap-2`}>
                        <DollarSign className="w-5 h-5 text-teal-500" />
                        Asset Breakdown
                      </h3>
                    </CardHeader>
                    <CardContent className={isMobile ? "p-4 pt-0" : ""}>
                      <div
                        className={`space-y-3 ${isMobile ? "max-h-40" : "max-h-48"} overflow-y-auto scrollbar-default`}
                      >
                        {portfolio.allocations.map(allocation => (
                          <div
                            key={allocation.symbol}
                            className="flex items-center justify-between p-3 rounded-lg bg-accent/20"
                          >
                            <div className="flex items-center gap-3">
                              <div
                                className={`${isMobile ? "w-6 h-6" : "w-8 h-8"} rounded-full overflow-hidden bg-gradient-to-br from-teal-400 to-cyan-500 flex items-center justify-center`}
                              >
                                <Image
                                  src={allocation.image}
                                  alt={allocation.name}
                                  width={20}
                                  height={20}
                                  className={`${isMobile ? "w-4 h-4" : "w-5 h-5"} object-contain`}
                                  onError={e => {
                                    (e.currentTarget as HTMLImageElement).style.display = "none";
                                    const next = e.currentTarget.nextElementSibling as HTMLElement | null;
                                    if (next) next.style.display = "flex";
                                  }}
                                />
                                <div className="hidden w-full h-full bg-gradient-to-br from-teal-400 to-cyan-500 rounded-full items-center justify-center">
                                  <span className={`text-white font-bold ${isMobile ? "text-xs" : "text-xs"}`}>
                                    {allocation.symbol.slice(0, 2)}
                                  </span>
                                </div>
                              </div>
                              <div className="min-w-0">
                                <p className={`font-medium text-foreground ${isMobile ? "text-sm" : "text-sm"}`}>
                                  {allocation.symbol}
                                </p>
                                <p className={`${isMobile ? "text-xs" : "text-xs"} text-muted-foreground truncate`}>
                                  {allocation.name}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className={`font-bold text-foreground ${isMobile ? "text-sm" : ""}`}>
                                {allocation.percentage.toFixed(1)}%
                              </p>
                              <p className={`${isMobile ? "text-xs" : "text-xs"} text-muted-foreground`}>
                                ${allocation.amount.toLocaleString()}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

interface TopPerformersProps {
  data?: any;
}

export function TopPerformers({}: TopPerformersProps) {
  const { ref: heroRef, isInView: heroInView } = useInViewAnimation<HTMLDivElement>();
  const { ref: performersRef, isInView: performersInView } = useInViewAnimation<HTMLDivElement>();

  // State management
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [sortBy, setSortBy] = useState("performance");
  const [selectedPortfolio, setSelectedPortfolio] = useState<SharedPortfolio | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [communityPortfolios, setCommunityPortfolios] = useState<SharedPortfolio[]>([]);

  // Generate shared community portfolios from localStorage data + mock data
  const generateCommunityPortfolios = useCallback((): SharedPortfolio[] => {
    // Get saved portfolios from localStorage
    const savedPortfolios = localStorage.getItem("1balancer-wallets");
    let userPortfolios: any[] = [];

    if (savedPortfolios) {
      try {
        userPortfolios = JSON.parse(savedPortfolios);
      } catch (error) {
        console.error("Error loading portfolios:", error);
      }
    }

    // Convert user portfolios to shared format (simulate some being public)
    const sharedUserPortfolios = userPortfolios
      .filter((_, index) => index % 2 === 0) // Simulate 50% being shared
      .map((portfolio, index) => ({
        ...portfolio,
        author: {
          username: `user${1000 + index}`,
          avatar: `U${index + 1}`,
          isVerified: Math.random() > 0.7,
          followers: Math.floor(Math.random() * 5000) + 100,
        },
        performance: {
          totalValue: portfolio.totalInvestment * (1 + (Math.random() * 0.4 - 0.1)),
          totalReturn: portfolio.totalInvestment * (Math.random() * 0.3),
          returnPercentage: Math.random() * 40 - 10,
          dailyChange: portfolio.totalInvestment * (Math.random() * 0.02 - 0.01),
          dailyChangePercentage: Math.random() * 6 - 3,
        },
        metrics: {
          likes: Math.floor(Math.random() * 200) + 10,
          shares: Math.floor(Math.random() * 50) + 5,
          bookmarks: Math.floor(Math.random() * 100) + 10,
          comments: Math.floor(Math.random() * 30) + 2,
        },
        strategy: {
          description: `A ${portfolio.presetType || "custom"} investment strategy focusing on long-term growth and diversification across multiple asset classes.`,
          riskLevel:
            portfolio.presetType === "aggressive"
              ? "aggressive"
              : portfolio.presetType === "balanced"
                ? "moderate"
                : "conservative",
          timeHorizon: portfolio.type === "autoinvest" ? "Long-term (3-5 years)" : "Medium-term (1-3 years)",
          rebalanceFrequency: portfolio.type === "autoinvest" ? "Monthly" : "Quarterly",
        },
        tags: [portfolio.presetType || "custom", portfolio.type, "DeFi", "Diversified"],
        isPublic: true,
        category: portfolio.presetType === "aggressive" ? "growth" : "yield",
      }));

    // Add some famous mock portfolios
    const mockPortfolios: SharedPortfolio[] = [
      {
        id: "community-defi-master",
        name: "DeFi Yield Maximizer Pro",
        author: {
          username: "defimaster2024",
          avatar: "DM",
          isVerified: true,
          followers: 15420,
        },
        type: "manual",
        presetType: "aggressive",
        totalInvestment: 75000,
        allocations: [
          {
            symbol: "SLD",
            name: "Shield StableCoin",
            percentage: 25,
            color: "#2F5586",
            image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=64&h=64&fit=crop&crop=center",
            amount: 18750,
          },
          {
            symbol: "UNI",
            name: "Uniswap",
            percentage: 30,
            color: "#FF007A",
            image: CRYPTOCURRENCY_DATA.find(c => c.symbol === "UNI")?.image || "",
            amount: 22500,
          },
          {
            symbol: "AAVE",
            name: "Aave",
            percentage: 25,
            color: "#B6509E",
            image: CRYPTOCURRENCY_DATA.find(c => c.symbol === "AAVE")?.image || "",
            amount: 18750,
          },
          {
            symbol: "CRV",
            name: "Curve DAO Token",
            percentage: 20,
            color: "#FF0000",
            image: CRYPTOCURRENCY_DATA.find(c => c.symbol === "CRV")?.image || "",
            amount: 15000,
          },
        ],
        performance: {
          totalValue: 95500,
          totalReturn: 20500,
          returnPercentage: 27.33,
          dailyChange: 1200,
          dailyChangePercentage: 1.27,
        },
        metrics: {
          likes: 342,
          shares: 89,
          bookmarks: 156,
          comments: 47,
        },
        strategy: {
          description:
            "Advanced DeFi yield farming strategy combining liquidity provision, governance token staking, and automated rebalancing for maximum returns.",
          riskLevel: "aggressive",
          timeHorizon: "Long-term (2-4 years)",
          rebalanceFrequency: "Weekly",
        },
        tags: ["DeFi", "Yield", "Maximizer", "Aggressive"],
        createdAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
        isPublic: true,
        category: "defi",
      },
      {
        id: "community-layer2-growth",
        name: "Layer 2 Scaling Giants",
        author: {
          username: "scalingpro",
          avatar: "L2",
          isVerified: true,
          followers: 8900,
        },
        type: "autoinvest",
        presetType: "moderate",
        totalInvestment: 50000,
        allocations: [
          {
            symbol: "SLD",
            name: "Shield StableCoin",
            percentage: 30,
            color: "#2F5586",
            image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=64&h=64&fit=crop&crop=center",
            amount: 15000,
          },
          {
            symbol: "MATIC",
            name: "Polygon",
            percentage: 28,
            color: "#8247E5",
            image: CRYPTOCURRENCY_DATA.find(c => c.symbol === "MATIC")?.image || "",
            amount: 14000,
          },
          {
            symbol: "OP",
            name: "Optimism",
            percentage: 22,
            color: "#FF0420",
            image: CRYPTOCURRENCY_DATA.find(c => c.symbol === "OP")?.image || "",
            amount: 11000,
          },
          {
            symbol: "ARB",
            name: "Arbitrum",
            percentage: 20,
            color: "#2D374B",
            image: CRYPTOCURRENCY_DATA.find(c => c.symbol === "ARB")?.image || "",
            amount: 10000,
          },
        ],
        performance: {
          totalValue: 62300,
          totalReturn: 12300,
          returnPercentage: 24.6,
          dailyChange: -450,
          dailyChangePercentage: -0.72,
        },
        metrics: {
          likes: 198,
          shares: 45,
          bookmarks: 87,
          comments: 23,
        },
        strategy: {
          description:
            "Focused investment in Layer 2 scaling solutions that are revolutionizing Ethereum, with regular DCA for long-term accumulation.",
          riskLevel: "moderate",
          timeHorizon: "Long-term (3-5 years)",
          rebalanceFrequency: "Monthly",
        },
        tags: ["Layer 2", "Scaling", "Ethereum", "DCA"],
        createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        isPublic: true,
        category: "layer2",
      },
      {
        id: "community-institutional",
        name: "Institutional Grade Portfolio",
        author: {
          username: "institutionalfund",
          avatar: "IF",
          isVerified: true,
          followers: 25600,
        },
        type: "manual",
        presetType: "conservative",
        totalInvestment: 150000,
        allocations: [
          {
            symbol: "SLD",
            name: "Shield StableCoin",
            percentage: 40,
            color: "#2F5586",
            image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=64&h=64&fit=crop&crop=center",
            amount: 60000,
          },
          {
            symbol: "USDC",
            name: "USD Coin",
            percentage: 25,
            color: "#2775CA",
            image: CRYPTOCURRENCY_DATA.find(c => c.symbol === "USDC")?.image || "",
            amount: 37500,
          },
          {
            symbol: "LINK",
            name: "Chainlink",
            percentage: 20,
            color: "#2A5ADA",
            image: CRYPTOCURRENCY_DATA.find(c => c.symbol === "LINK")?.image || "",
            amount: 30000,
          },
          {
            symbol: "MKR",
            name: "Maker",
            percentage: 15,
            color: "#1AAB9B",
            image: CRYPTOCURRENCY_DATA.find(c => c.symbol === "MKR")?.image || "",
            amount: 22500,
          },
        ],
        performance: {
          totalValue: 168750,
          totalReturn: 18750,
          returnPercentage: 12.5,
          dailyChange: 820,
          dailyChangePercentage: 0.49,
        },
        metrics: {
          likes: 456,
          shares: 127,
          bookmarks: 289,
          comments: 78,
        },
        strategy: {
          description:
            "Conservative institutional-grade portfolio emphasizing capital preservation with steady growth through blue-chip DeFi protocols.",
          riskLevel: "conservative",
          timeHorizon: "Long-term (5+ years)",
          rebalanceFrequency: "Quarterly",
        },
        tags: ["Institutional", "Conservative", "Blue Chip", "Stable Growth"],
        createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
        isPublic: true,
        category: "institutional",
      },
    ];

    return [...sharedUserPortfolios, ...mockPortfolios];
  }, []);

  // Load community portfolios
  useEffect(() => {
    const portfolios = generateCommunityPortfolios();
    setCommunityPortfolios(portfolios);
  }, [generateCommunityPortfolios]);

  const categories = useMemo(() => ["all", "defi", "layer2", "yield", "growth", "institutional"], []);

  // Filter portfolios
  const filteredPortfolios = useMemo(() => {
    let filtered = communityPortfolios;

    if (searchQuery.trim()) {
      filtered = filtered.filter(
        portfolio =>
          portfolio.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          portfolio.author.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
          portfolio.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase())),
      );
    }

    if (selectedCategory !== "all") {
      filtered = filtered.filter(portfolio => portfolio.category === selectedCategory);
    }

    // Sort
    switch (sortBy) {
      case "performance":
        filtered.sort((a, b) => b.performance.returnPercentage - a.performance.returnPercentage);
        break;
      case "value":
        filtered.sort((a, b) => b.performance.totalValue - a.performance.totalValue);
        break;
      case "likes":
        filtered.sort((a, b) => b.metrics.likes - a.metrics.likes);
        break;
      case "recent":
        filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
    }

    return filtered;
  }, [communityPortfolios, searchQuery, selectedCategory, sortBy]);

  const handlePortfolioClick = (portfolio: SharedPortfolio) => {
    setSelectedPortfolio(portfolio);
    setShowDetailModal(true);
  };

  const handleLike = (portfolioId: string) => {
    setCommunityPortfolios(prev =>
      prev.map(p => (p.id === portfolioId ? { ...p, metrics: { ...p.metrics, likes: p.metrics.likes + 1 } } : p)),
    );
    toast.success("Portfolio liked!");
  };

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
          <h2 className="text-4xl font-bold text-foreground mb-6">
            <span className="bg-clip-text text-transparent" style={{ backgroundImage: "var(--gradient-primary)" }}>
              Top Performers
            </span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Discover the highest-performing portfolios from our community of expert traders and learn from their
            strategies.
          </p>
        </motion.div>

        {/* Search and Filter Controls */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={heroInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mb-12"
        >
          <div className="flex flex-col lg:flex-row gap-4 items-center justify-between mb-8">
            {/* Search */}
            <div className="relative w-full lg:w-96">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
              <Input
                placeholder="Search portfolios, strategies, or users..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-10 bg-card/50 border-border/30"
              />
            </div>

            {/* Sort */}
            <div className="flex items-center gap-4">
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value)}
                className="px-4 py-2 rounded-lg bg-card/50 border border-border/30 text-foreground"
              >
                <option value="performance">Best Performance</option>
                <option value="value">Highest Value</option>
                <option value="likes">Most Liked</option>
                <option value="recent">Most Recent</option>
              </select>
            </div>
          </div>

          {/* Category Filter */}
          <div className="flex flex-wrap gap-2 justify-center">
            {categories.map(category => (
              <Button
                key={category}
                variant={selectedCategory === category ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(category)}
                className={`transition-all duration-200 ${
                  selectedCategory === category
                    ? "bg-gradient-to-r from-teal-500 to-cyan-500 text-white"
                    : "bg-card/50 border-border/30"
                }`}
              >
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </Button>
            ))}
          </div>
        </motion.div>

        {/* Portfolio Grid */}
        <motion.div
          ref={performersRef}
          initial={{ opacity: 0, y: 40 }}
          animate={performersInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8"
        >
          {filteredPortfolios.map((portfolio, index) => (
            <motion.div
              key={portfolio.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="group"
            >
              <Card
                className="border border-border/30 bg-card/50 backdrop-blur-sm hover:border-border/50 transition-all duration-300 cursor-pointer overflow-hidden"
                onClick={() => handlePortfolioClick(portfolio)}
              >
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-r from-teal-400 to-cyan-500 flex items-center justify-center text-white font-bold">
                        {portfolio.author.avatar}
                      </div>
                      <div>
                        <p className="font-semibold text-foreground">@{portfolio.author.username}</p>
                        <div className="flex items-center gap-1">
                          {portfolio.author.isVerified && <Star className="w-4 h-4 text-yellow-400" />}
                          <span className="text-sm text-muted-foreground">
                            {portfolio.author.followers.toLocaleString()} followers
                          </span>
                        </div>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      #{index + 1}
                    </Badge>
                  </div>

                  <h3 className="text-xl font-bold text-foreground mb-2 group-hover:text-cyan-500 transition-colors">
                    {portfolio.name}
                  </h3>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Value</p>
                      <p className="text-2xl font-bold text-foreground">
                        ${portfolio.performance.totalValue.toLocaleString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Performance</p>
                      <div
                        className={`flex items-center gap-1 ${
                          portfolio.performance.returnPercentage > 0 ? "text-green-500" : "text-red-500"
                        }`}
                      >
                        {portfolio.performance.returnPercentage > 0 ? (
                          <TrendingUp className="w-4 h-4" />
                        ) : (
                          <TrendingDown className="w-4 h-4" />
                        )}
                        <span className="text-2xl font-bold">
                          {portfolio.performance.returnPercentage > 0 ? "+" : ""}
                          {portfolio.performance.returnPercentage.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="pt-0">
                  {/* Mini Pie Chart */}
                  <div className="h-32 mb-4">
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsPieChart>
                        <Pie
                          data={portfolio.allocations.map(allocation => ({
                            name: allocation.symbol,
                            value: allocation.percentage,
                            color: allocation.color,
                          }))}
                          cx="50%"
                          cy="50%"
                          innerRadius={25}
                          outerRadius={50}
                          paddingAngle={2}
                          dataKey="value"
                        >
                          {portfolio.allocations.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={portfolio.allocations[index].color} />
                          ))}
                        </Pie>
                      </RechartsPieChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Top Holdings */}
                  <div className="grid grid-cols-2 gap-2 mb-4">
                    {portfolio.allocations.slice(0, 4).map(allocation => (
                      <div key={allocation.symbol} className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">{allocation.symbol}</span>
                        <span className="font-medium text-foreground">{allocation.percentage.toFixed(1)}%</span>
                      </div>
                    ))}
                  </div>

                  {/* Strategy Tags */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {portfolio.tags.slice(0, 3).map(tag => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between pt-4 border-t border-border/30">
                    <div className="flex items-center gap-4">
                      <button
                        onClick={e => {
                          e.stopPropagation();
                          handleLike(portfolio.id);
                        }}
                        className="flex items-center gap-1 text-sm text-muted-foreground hover:text-red-500 transition-colors"
                      >
                        <Heart className="w-4 h-4" />
                        {portfolio.metrics.likes}
                      </button>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <MessageCircle className="w-4 h-4" />
                        {portfolio.metrics.comments}
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
                      View Details
                      <ExternalLink className="w-4 h-4 ml-1" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        {/* No Results */}
        {filteredPortfolios.length === 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center py-16">
            <Users className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-xl font-semibold text-foreground mb-2">No portfolios found</h3>
            <p className="text-muted-foreground">Try adjusting your search or filter criteria</p>
          </motion.div>
        )}
      </div>

      {/* Portfolio Detail Modal */}
      <PortfolioDetailModal
        portfolio={selectedPortfolio}
        isOpen={showDetailModal}
        onClose={() => {
          setShowDetailModal(false);
          setSelectedPortfolio(null);
        }}
      />
    </section>
  );
}
