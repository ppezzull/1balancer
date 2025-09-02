import React from "react";
import Image from "next/image";
import { Badge } from "../badge";
import { Button } from "../button";
import { Card, CardContent, CardHeader } from "../card";
import { useIsMobile } from "../use-mobile";
import { useTheme } from "../use-theme";
import { BarChart3 } from "lucide-react";
import { Activity, DollarSign, Heart, Share, Star, Target, TrendingDown, TrendingUp, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { Cell, Pie, PieChart as RechartsPieChart, ResponsiveContainer, Tooltip } from "recharts";
import { SharedPortfolio } from "~~/types/portfolio";

interface PortfolioDetailModalProps {
  portfolio: SharedPortfolio | null;
  isOpen: boolean;
  onClose: () => void;
}

export function PortfolioDetailModal({ portfolio, isOpen, onClose }: PortfolioDetailModalProps) {
  const { isDark } = useTheme();
  const isMobile = useIsMobile();

  // Early return if portfolio is null or undefined
  if (!portfolio || !isOpen) {
    return null;
  }

  // Colori di fallback per il grafico a torta
  const fallbackColors = [
    "#3b82f6", // blue
    "#ef4444", // red
    "#10b981", // green
    "#f59e0b", // amber
    "#8b5cf6", // purple
    "#06b6d4", // cyan
    "#f97316", // orange
    "#84cc16", // lime
    "#ec4899", // pink
    "#6366f1", // indigo
  ];

  const pieData = (portfolio.allocations || []).map((allocation, index) => ({
    name: allocation?.symbol || "",
    value: Number(allocation?.percentage) || 0,
    color: allocation?.color || fallbackColors[index % fallbackColors.length],
    fullName: allocation?.name || allocation?.symbol || "Unknown",
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

  const isPositiveReturn = (Number(portfolio.performance?.returnPercentage) || 0) > 0;

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
                    {portfolio.author?.avatar || portfolio.author?.username?.charAt(0)?.toUpperCase() || "U"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 className={`${isMobile ? "text-lg" : "text-2xl"} font-bold text-foreground mb-1 truncate`}>
                      {portfolio.name}
                    </h2>
                    <div
                      className={`flex items-center gap-2 ${isMobile ? "text-xs" : "text-sm"} text-muted-foreground flex-wrap`}
                    >
                      <span>by @{portfolio.author?.username || "Unknown"}</span>
                      {portfolio.author?.isVerified && <Star className="w-4 h-4 text-yellow-400" />}
                      <span>•</span>
                      <span>{portfolio.author?.followers?.toLocaleString() || "0"} followers</span>
                    </div>
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      <Badge variant="outline" className={getRiskColor(portfolio.strategy?.riskLevel || "Medium")}>
                        {portfolio.strategy?.riskLevel || "Medium"}
                      </Badge>
                      <Badge variant="outline">{portfolio.type || "Portfolio"}</Badge>
                      <Badge variant="outline">{portfolio.category || "General"}</Badge>
                    </div>
                  </div>
                </div>

                <div className={`flex items-center gap-2 ${isMobile ? "justify-between w-full" : ""}`}>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm">
                      <Heart className="w-4 h-4" />
                      {isMobile ? portfolio.metrics?.likes || 0 : `${portfolio.metrics?.likes || 0}`}
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Share className="w-4 h-4" />
                      {isMobile ? portfolio.metrics?.shares || 0 : `${portfolio.metrics?.shares || 0}`}
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
                            ${(Number(portfolio.performance?.totalValue) || 0).toLocaleString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Initial Investment</p>
                          <p className={`${isMobile ? "text-lg" : "text-xl"} font-semibold text-foreground`}>
                            ${(Number(portfolio.totalInvestment) || 0).toLocaleString()}
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
                            {isPositiveReturn ? "+" : ""}$
                            {(Number(portfolio.performance?.totalReturn) || 0).toLocaleString()}
                          </span>
                          <span className="text-sm">
                            ({isPositiveReturn ? "+" : ""}
                            {(Number(portfolio.performance?.returnPercentage) || 0).toFixed(2)}%)
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
                      {pieData.length > 0 && pieData.some(item => item.value > 0) ? (
                        <div className="space-y-4">
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
                          {/* Legenda */}
                          <div className="grid grid-cols-2 gap-2">
                            {pieData.map((item, index) => (
                              <div key={index} className="flex items-center gap-2">
                                <div
                                  className="w-3 h-3 rounded-full flex-shrink-0"
                                  style={{ backgroundColor: item.color }}
                                />
                                <span className="text-xs text-muted-foreground truncate">
                                  {item.name} ({item.value.toFixed(1)}%)
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center h-48 text-muted-foreground space-y-2">
                          <BarChart3 className="w-12 h-12 opacity-50" />
                          <p className="text-sm">No allocation data available</p>
                          <p className="text-xs opacity-75">Portfolio allocations will appear here</p>
                        </div>
                      )}
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
                          {portfolio.strategy?.description || "No description available"}
                        </p>
                      </div>
                      <div className={`grid ${isMobile ? "grid-cols-1 gap-3" : "grid-cols-2 gap-4"}`}>
                        <div>
                          <p className="text-sm text-muted-foreground">Time Horizon</p>
                          <p className="font-medium text-foreground">
                            {portfolio.strategy?.timeHorizon || "Not specified"}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Rebalance</p>
                          <p className="font-medium text-foreground">
                            {portfolio.strategy?.rebalanceFrequency || "Not specified"}
                          </p>
                        </div>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground mb-2">Tags</p>
                        <div className="flex flex-wrap gap-2">
                          {(portfolio.tags || []).map((tag, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {tag || "Unknown"}
                            </Badge>
                          ))}
                          {(!portfolio.tags || portfolio.tags.length === 0) && (
                            <Badge variant="outline" className="text-xs opacity-50">
                              No tags
                            </Badge>
                          )}
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
                        {(portfolio.allocations || []).map((allocation, index) => (
                          <div
                            key={allocation?.symbol || index}
                            className="flex items-center justify-between p-3 rounded-lg bg-accent/20"
                          >
                            <div className="flex items-center gap-3">
                              <div
                                className={`${isMobile ? "w-6 h-6" : "w-8 h-8"} rounded-full overflow-hidden bg-gradient-to-br from-teal-400 to-cyan-500 flex items-center justify-center`}
                              >
                                {allocation?.image ? (
                                  <Image
                                    src={allocation.image}
                                    alt={allocation?.name || "Asset"}
                                    className={`${isMobile ? "w-4 h-4" : "w-5 h-5"} object-contain`}
                                    onError={e => {
                                      e.currentTarget.style.display = "none";
                                    }}
                                  />
                                ) : (
                                  <span className={`text-white font-bold ${isMobile ? "text-xs" : "text-xs"}`}>
                                    {(allocation?.symbol || "NA").slice(0, 2)}
                                  </span>
                                )}
                                <div className="hidden w-full h-full bg-gradient-to-br from-teal-400 to-cyan-500 rounded-full items-center justify-center">
                                  <span className={`text-white font-bold ${isMobile ? "text-xs" : "text-xs"}`}>
                                    {(allocation?.symbol || "NA").slice(0, 2)}
                                  </span>
                                </div>
                              </div>
                              <div className="min-w-0">
                                <p className={`font-medium text-foreground ${isMobile ? "text-sm" : "text-sm"}`}>
                                  {allocation?.symbol || "Unknown"}
                                </p>
                                <p className={`${isMobile ? "text-xs" : "text-xs"} text-muted-foreground truncate`}>
                                  {allocation?.name || "Unknown Asset"}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className={`font-bold text-foreground ${isMobile ? "text-sm" : ""}`}>
                                {(Number(allocation?.percentage) || 0).toFixed(1)}%
                              </p>
                              <p className={`${isMobile ? "text-xs" : "text-xs"} text-muted-foreground`}>
                                ${(Number(allocation?.amount) || 0).toLocaleString()}
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
