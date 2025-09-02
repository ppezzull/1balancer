import { useState } from "react";
import Image from "next/image";
import { BuyCryptoModal } from "./BuyCryptoModal";
import { ArrowDownRight, ArrowLeft, ArrowUpRight, Eye, MoreHorizontal, Settings } from "lucide-react";
import { motion } from "motion/react";
import { Line, LineChart, ResponsiveContainer, XAxis, YAxis } from "recharts";
import { Button } from "~~/components/shared/button";
import { Card, CardContent } from "~~/components/shared/card";
import { useTheme } from "~~/components/shared/use-theme";

interface CryptoDetailScreenProps {
  crypto: {
    symbol: string;
    name: string;
    price: string | number;
    change: string | number;
    image: string;
    category: string;
  };
  onBack: () => void;
}

// Mock data for the chart
const generateMockData = (basePrice: number, volatility: number = 0.1) => {
  const data = [];
  let currentPrice = basePrice * 0.8; // Start from 80% of current price

  for (let i = 0; i < 100; i++) {
    const randomChange = (Math.random() - 0.5) * volatility * currentPrice;
    currentPrice += randomChange;
    data.push({
      time: i,
      price: currentPrice,
      value: currentPrice,
    });
  }

  // Ensure the last point matches current price
  data[data.length - 1].price = basePrice;
  data[data.length - 1].value = basePrice;

  return data;
};

export function CryptoDetailScreen({ crypto, onBack }: CryptoDetailScreenProps) {
  const [selectedTimeframe, setSelectedTimeframe] = useState("1D");
  const [showBuyModal, setShowBuyModal] = useState(false);
  const { isDark } = useTheme();

  const timeframes = ["1D", "1W", "1M", "3M", "1Y", "MAX"];

  // Safe parsing for price and change that handles both string and number inputs
  const parsePrice = (price: string | number): number => {
    if (typeof price === "number") return price;
    if (typeof price === "string") return parseFloat(price.replace(/[,$]/g, ""));
    return 0;
  };

  const parseChange = (change: string | number): number => {
    if (typeof change === "number") return change;
    if (typeof change === "string") return parseFloat(change.replace(/[%+]/g, ""));
    return 0;
  };

  const formatPrice = (price: string | number): string => {
    const numPrice = parsePrice(price);
    return numPrice.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 6,
    });
  };

  const isPositive = parseChange(crypto.change) > 0;
  const basePrice = parsePrice(crypto.price);
  const chartData = generateMockData(basePrice);

  return (
    <>
      <motion.div
        initial={{ opacity: 0, x: "100%" }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: "100%" }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className="fixed inset-0 z-50 bg-background flex flex-col"
        style={{
          background: isDark ? "linear-gradient(135deg, #000000 0%, #1f2937 50%, #000000 100%)" : "var(--universe-bg)",
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border/30">
          <Button variant="ghost" size="sm" onClick={onBack} className="hover:bg-accent/50">
            <ArrowLeft className="w-5 h-5" />
          </Button>

          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full overflow-hidden bg-gradient-to-br from-teal-400 to-cyan-500 flex items-center justify-center">
              <Image
                src={crypto.image}
                alt={crypto.name}
                className="w-5 h-5 object-contain"
                onError={e => {
                  e.currentTarget.style.display = "none";
                  (e.currentTarget.nextElementSibling as HTMLElement)!.style.display = "flex";
                }}
              />
              <div className="hidden w-full h-full bg-gradient-to-br from-teal-400 to-cyan-500 rounded-full items-center justify-center">
                <span className="text-white font-bold text-xs">{crypto.symbol.slice(0, 2)}</span>
              </div>
            </div>
            <span className="font-semibold text-foreground">{crypto.symbol}</span>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" className="hover:bg-accent/50">
              <Eye className="w-5 h-5" />
            </Button>
            <Button variant="ghost" size="sm" className="hover:bg-accent/50">
              <MoreHorizontal className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto">
          {/* Crypto Info */}
          <div className="p-6 text-center">
            <h1 className="text-2xl font-bold text-foreground mb-2">{crypto.name}</h1>

            <div className="mb-4">
              <div className="text-4xl md:text-5xl font-bold text-foreground mb-2">${formatPrice(crypto.price)}</div>
              <div
                className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-lg font-semibold ${
                  isPositive
                    ? "bg-green-500/10 text-green-600 dark:text-green-400"
                    : "bg-red-500/10 text-red-600 dark:text-red-400"
                }`}
              >
                <Image
                  src={crypto.image}
                  alt={crypto.name}
                  width={20}
                  height={20}
                  className="w-5 h-5 object-contain"
                  onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
                    e.currentTarget.style.display = "none";
                    (e.currentTarget.nextElementSibling as HTMLElement).style.display = "flex";
                  }}
                />
                <span>
                  {isPositive ? <ArrowUpRight className="w-5 h-5" /> : <ArrowDownRight className="w-5 h-5" />}
                  {crypto.change}
                </span>
              </div>
            </div>
          </div>

          {/* Chart Section */}
          <div className="px-4">
            <Card className="border border-border/30 bg-card/50 backdrop-blur-sm">
              <CardContent className="p-4">
                {/* Chart */}
                <div className="h-64 mb-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <XAxis hide />
                      <YAxis hide />
                      <Line
                        type="monotone"
                        dataKey="value"
                        stroke={isPositive ? "#10b981" : "#ef4444"}
                        strokeWidth={2}
                        dot={false}
                        activeDot={{
                          r: 4,
                          fill: isPositive ? "#10b981" : "#ef4444",
                          stroke: "white",
                          strokeWidth: 2,
                        }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                {/* Timeframe Selector */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    {timeframes.map(timeframe => (
                      <Button
                        key={timeframe}
                        variant={selectedTimeframe === timeframe ? "default" : "ghost"}
                        size="sm"
                        onClick={() => setSelectedTimeframe(timeframe)}
                        className={`px-3 py-1 text-xs font-medium ${
                          selectedTimeframe === timeframe ? "bg-primary text-primary-foreground" : "hover:bg-accent/50"
                        }`}
                      >
                        {timeframe}
                      </Button>
                    ))}
                  </div>

                  <Button variant="ghost" size="sm" className="hover:bg-accent/50">
                    <Settings className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Feed Section */}
          <div className="p-4 mt-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-foreground">Feed</h2>
              <Button variant="ghost" size="sm" className="text-sm text-muted-foreground hover:bg-accent/50">
                View All
              </Button>
            </div>

            <Card className="border border-border/30 bg-card/50 backdrop-blur-sm">
              <CardContent className="p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center">
                    <span className="text-white font-bold text-xs">{crypto.symbol.slice(0, 2)}</span>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-sm text-foreground">{crypto.symbol} News</h3>
                    <p className="text-xs text-muted-foreground">Official updates</p>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  Latest developments and market insights for {crypto.name}. Stay updated with real-time news and
                  analysis.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Bottom Buy Button */}
        <div className="p-4 border-t border-border/30 bg-background/80 backdrop-blur-sm">
          <Button
            onClick={() => setShowBuyModal(true)}
            className="w-full py-3 text-lg font-semibold"
            style={{
              background: isDark ? "var(--gradient-primary)" : "linear-gradient(135deg, #3b82f6, #1d4ed8)",
              color: "white",
            }}
          >
            Buy {crypto.symbol}
          </Button>
        </div>
      </motion.div>

      {/* Buy Modal */}
      <BuyCryptoModal crypto={crypto} isOpen={showBuyModal} onClose={() => setShowBuyModal(false)} />
    </>
  );
}
