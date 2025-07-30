import {
  useState,
  useEffect,
  useMemo,
  useCallback,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { Slider } from "./ui/slider";
import { Input } from "./ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import { useTheme } from "./ui/use-theme";
import { useIsMobile } from "./ui/use-mobile";
import {
  ArrowLeft,
  X,
  Plus,
  Minus,
  Check,
  AlertCircle,
  RotateCcw,
  Target,
  Settings,
  TrendingUp,
  Calendar,
  DollarSign,
  ChevronDown,
  Wallet,
  Save,
  Edit,
  Search,
} from "lucide-react";
import { CRYPTOCURRENCY_DATA, savePortfolio, Portfolio as PortfolioType } from "../utils/constants";
import { toast } from "sonner";

// Preset configurations - ERC-20 tokens only (moved outside component to prevent re-creation)
const PRESET_CONFIGS = {
  balanced: [
    {
      symbol: "USDT, USDC",
      name: "StableCoin",
      percentage: 35,
      color: "#2F5586",
      image: "",
      isProtected: true,
      minPercentage: 25,
    },
  
    {
      symbol: "UNI",
      name: "Uniswap",
      percentage: 20,
      color: "#FF007A",
      image: "",
    },
    {
      symbol: "AAVE",
      name: "Aave",
      percentage: 20,
      color: "#B6509E",
      image: "",
    },
  ],
  aggressive: [
    {
      symbol: "SLD",
      name: "Shield StableCoin",
      percentage: 25,
      color: "#2F5586",
      image: "",
      isProtected: true,
      minPercentage: 25,
    },
    {
      symbol: "UNI",
      name: "Uniswap",
      percentage: 25,
      color: "#FF007A",
      image: "",
    },
    {
      symbol: "AAVE",
      name: "Aave",
      percentage: 20,
      color: "#B6509E",
      image: "",
    },
    {
      symbol: "LINK",
      name: "Chainlink",
      percentage: 15,
      color: "#2A5ADA",
      image: "",
    },
    {
      symbol: "COMP",
      name: "Compound",
      percentage: 15,
      color: "#00D395",
      image: "",
    },
  ],
};

interface PieChartCreatorProps {
  onBack: () => void;
  presetType?: "balanced" | "aggressive" | null;
}

interface TokenAllocation {
  symbol: string;
  name: string;
  percentage: number;
  color: string;
  image: string;
  amount: number; // Added to match PortfolioSection interface
  isProtected?: boolean;
  minPercentage?: number;
}

// Updated interface to match PortfolioSection exactly
interface Portfolio {
  id: string;
  name: string;
  type: 'autoinvest' | 'manual';
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
  autoinvestConfig?: {
    initialDeposit: number;
    monthlyInvestment: number;
    years: number; // Changed from investmentYears to years
    projectedValue: number;
  };
  createdAt: string; // Changed from Date to string
  performance?: {
    totalValue: number;
    totalReturn: number;
    returnPercentage: number;
    dailyChange: number;
    dailyChangePercentage: number;
  };
}

export function PieChartCreator({
  onBack,
  presetType,
}: PieChartCreatorProps) {
  const { isDark } = useTheme();
  const isMobile = useIsMobile();

  // Modal states
  const [showInvestmentModal, setShowInvestmentModal] =
    useState(false);
  const [showAutoinvestModal, setShowAutoinvestModal] =
    useState(false);
  const [showSaveWalletModal, setShowSaveWalletModal] =
    useState(false);
  const [showTokenSelectionModal, setShowTokenSelectionModal] =
    useState(false);
  const [investmentType, setInvestmentType] = useState<
    "autoinvest" | "manual" | null
  >(null);

  // Token selection state
  const [tokenSearchQuery, setTokenSearchQuery] = useState("");

  // Wallet saving states
  const [walletName, setWalletName] = useState("");
  const [isNameValid, setIsNameValid] = useState(false);
  const [existingWalletNames, setExistingWalletNames] =
    useState<string[]>([]);

  // Autoinvest parameters
  const [initialDeposit, setInitialDeposit] = useState(1000);
  const [monthlyInvestment, setMonthlyInvestment] =
    useState(1000);
  const [investmentYears, setInvestmentYears] = useState(5);

  // Preset configurations with images from constants (memoized to prevent re-creation)
  const presets = useMemo(() => ({
    balanced: PRESET_CONFIGS.balanced.map((preset, index) => ({
      ...preset,
      image: CRYPTOCURRENCY_DATA[index]?.image || preset.image,
    })),
    aggressive: PRESET_CONFIGS.aggressive.map((preset, index) => {
      const cryptoData = CRYPTOCURRENCY_DATA.find(crypto => crypto.symbol === preset.symbol);
      return {
        ...preset,
        image: cryptoData?.image || preset.image,
      };
    }),
  }), []);

  const [allocations, setAllocations] = useState<TokenAllocation[]>(() => {
    const selectedPreset = presetType || 'balanced';
    return PRESET_CONFIGS[selectedPreset].map((preset, index) => {
      const cryptoData = CRYPTOCURRENCY_DATA.find(crypto => crypto.symbol === preset.symbol);
      return {
        ...preset,
        image: cryptoData?.image || preset.image,
        amount: 0, // Will be calculated based on percentage and totalInvestment
      };
    });
  });

  const [totalInvestment, setTotalInvestment] = useState(10000);

  // Load existing wallet names on component mount
  useEffect(() => {
    const savedWallets = localStorage.getItem(
      "1balancer-wallets", // Fixed: changed from underscore to dash
    );
    if (savedWallets) {
      try {
        const wallets: Portfolio[] = JSON.parse(savedWallets);
        setExistingWalletNames(
          wallets.map((w) => w.name.toLowerCase()),
        );
      } catch (error) {
        console.error("Error loading wallet names:", error);
      }
    }
  }, []);

  // Update allocation amounts when totalInvestment or percentages change
  useEffect(() => {
    setAllocations(currentAllocations =>
      currentAllocations.map(allocation => ({
        ...allocation,
        amount: (totalInvestment * allocation.percentage) / 100
      }))
    );
  }, [totalInvestment]);

  // Validate wallet name
  useEffect(() => {
    const trimmedName = walletName.trim();
    const isValid =
      trimmedName.length >= 3 &&
      trimmedName.length <= 50 &&
      !existingWalletNames.includes(trimmedName.toLowerCase());
    setIsNameValid(isValid);
  }, [walletName, existingWalletNames]);

  // Memoize total percentage calculation to prevent unnecessary re-renders
  const totalPercentage = useMemo(() => {
    return allocations.reduce(
      (sum, allocation) => sum + allocation.percentage,
      0,
    );
  }, [allocations]);

  // Memoize validation calculation
  const isValid = useMemo(() => {
    return Math.abs(totalPercentage - 100) < 0.01;
  }, [totalPercentage]);

  // Update allocation percentage (memoized) - with protection for minimum percentage
  const updateAllocation = useCallback(
    (index: number, newPercentage: number) => {
      setAllocations((currentAllocations) => {
        const newAllocations = [...currentAllocations];
        const allocation = newAllocations[index];
        
        // Check if this token is protected and has a minimum percentage
        const minValue = allocation.isProtected && allocation.minPercentage 
          ? allocation.minPercentage 
          : 0;
        
        const percentage = Math.max(
          minValue,
          Math.min(100, newPercentage),
        );
        
        newAllocations[index] = {
          ...allocation,
          percentage,
          amount: (totalInvestment * percentage) / 100
        };
        
        return newAllocations;
      });
    },
    [totalInvestment],
  );

  // Remove allocation (memoized) - prevent removal of protected tokens
  const removeAllocation = useCallback((index: number) => {
    setAllocations((currentAllocations) => {
      const allocation = currentAllocations[index];
      
      // Prevent removal of protected tokens
      if (allocation.isProtected) {
        toast.error("Cannot remove Shield StableCoin", {
          description: "This token is protected and maintains minimum 25% allocation"
        });
        return currentAllocations;
      }
      
      if (currentAllocations.length > 2) {
        return currentAllocations.filter((_, i) => i !== index);
      }
      return currentAllocations;
    });
  }, []);

  // Get available tokens for selection
  const availableTokens = useMemo(() => {
    return CRYPTOCURRENCY_DATA.filter(
      (token) =>
        !allocations.some(
          (alloc) => alloc.symbol === token.symbol,
        ),
    );
  }, [allocations]);

  // Filter tokens based on search query
  const filteredAvailableTokens = useMemo(() => {
    if (!tokenSearchQuery.trim()) return availableTokens;
    
    return availableTokens.filter(token =>
      token.name.toLowerCase().includes(tokenSearchQuery.toLowerCase()) ||
      token.symbol.toLowerCase().includes(tokenSearchQuery.toLowerCase())
    );
  }, [availableTokens, tokenSearchQuery]);

  // Add specific token to allocations
  const addSpecificToken = useCallback((token: typeof CRYPTOCURRENCY_DATA[0]) => {
    const percentage = token.isProtected ? (token.minPercentage || 25) : 5;
    const newAllocation: TokenAllocation = {
      symbol: token.symbol,
      name: token.name,
      percentage,
      color: token.symbol === "SLD" ? "#2F5586" : `hsl(${Math.random() * 360}, 70%, 50%)`,
      image: token.image,
      amount: (totalInvestment * percentage) / 100,
      isProtected: token.isProtected,
      minPercentage: token.minPercentage,
    };
    
    setAllocations(currentAllocations => [...currentAllocations, newAllocation]);
    setShowTokenSelectionModal(false);
    setTokenSearchQuery("");
  }, [totalInvestment]);

  // Open token selection modal
  const openTokenSelection = useCallback(() => {
    if (availableTokens.length > 0) {
      setShowTokenSelectionModal(true);
    }
  }, [availableTokens.length]);

  // Redistribute proportionally to 100% (memoized to prevent unnecessary re-creation)
  const redistributeProportionally = useCallback(() => {
    if (totalPercentage === 0) return;

    const factor = 100 / totalPercentage;
    const newAllocations = allocations.map((allocation) => {
      const newPercentage = parseFloat(
        (allocation.percentage * factor).toFixed(2),
      );
      return {
        ...allocation,
        percentage: newPercentage,
        amount: (totalInvestment * newPercentage) / 100
      };
    });

    // Adjust for rounding errors
    const newTotal = newAllocations.reduce(
      (sum, allocation) => sum + allocation.percentage,
      0,
    );
    if (Math.abs(newTotal - 100) > 0.01) {
      const diff = 100 - newTotal;
      newAllocations[0].percentage += diff;
      newAllocations[0].amount = (totalInvestment * newAllocations[0].percentage) / 100;
    }

    setAllocations(newAllocations);
  }, [allocations, totalPercentage, totalInvestment]);

  // Calculate projected value for autoinvest
  const projectedValue = useMemo(() => {
    if (investmentType !== "autoinvest") return 0;
    const expectedReturn =
      presetType === "aggressive" ? 0.2 : 0.1; // 20% or 10% annual return
    const monthlyRate = expectedReturn / 12;
    const totalMonths = investmentYears * 12;

    // Future value of initial deposit
    const initialFV =
      initialDeposit *
      Math.pow(1 + expectedReturn, investmentYears);

    // Future value of monthly payments (annuity)
    const monthlyFV =
      (monthlyInvestment *
        (Math.pow(1 + monthlyRate, totalMonths) - 1)) /
      monthlyRate;

    return initialFV + monthlyFV;
  }, [
    initialDeposit,
    monthlyInvestment,
    investmentYears,
    presetType,
    investmentType,
  ]);

  // Handle create portfolio button click
  const handleCreatePortfolio = useCallback(() => {
    if (isValid) {
      setShowInvestmentModal(true);
    }
  }, [isValid]);

  // Handle investment type completion
  const handleInvestmentComplete = useCallback(() => {
    setShowSaveWalletModal(true);
  }, []);

  // Save wallet data
  const handleSaveWallet = useCallback(() => {
    if (!isNameValid) return;

    // Clean allocations for saving (remove temporary properties)
    const cleanTokens = allocations.map(allocation => ({
      symbol: allocation.symbol,
      percentage: allocation.percentage,
      amount: allocation.amount
    }));

    // Generate random performance for new portfolio
    const performance = Math.random() * 40 - 10; // -10% to +30%

    const portfolioData: PortfolioType = {
      id: `portfolio_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: walletName.trim(),
      tokens: cleanTokens,
      totalValue: totalInvestment,
      performance: performance,
      isPublic: false, // Default to private
      strategy: undefined, // Can be added later
      createdAt: new Date().toISOString(),
      investmentType: investmentType!,
      investmentConfig:
        investmentType === "autoinvest"
          ? {
              initialDeposit,
              monthlyInvestment,
              years: investmentYears,
            }
          : undefined,
    };

    try {
      // Use the new portfolio management utility
      savePortfolio(portfolioData);

      // Also save to the old system for backward compatibility
      const existingWallets = localStorage.getItem("1balancer-wallets");
      const wallets: Portfolio[] = existingWallets ? JSON.parse(existingWallets) : [];
      
      const legacyWallet: Portfolio = {
        id: portfolioData.id,
        name: portfolioData.name,
        type: investmentType!,
        presetType: presetType || undefined,
        allocations: allocations.map(allocation => ({
          symbol: allocation.symbol,
          name: allocation.name,
          percentage: allocation.percentage,
          color: allocation.color,
          image: allocation.image,
          amount: allocation.amount
        })),
        totalInvestment,
        autoinvestConfig:
          investmentType === "autoinvest"
            ? {
                initialDeposit,
                monthlyInvestment,
                years: investmentYears,
                projectedValue,
              }
            : undefined,
        createdAt: new Date().toISOString(),
      };
      
      wallets.push(legacyWallet);
      localStorage.setItem("1balancer-wallets", JSON.stringify(wallets));

      // Show success toast
      toast.success(
        `Portfolio "${walletName}" created successfully!`,
        {
          description: `${presetType === "aggressive" ? "Aggressive" : "Balanced"} portfolio worth ${totalInvestment.toLocaleString()}`,
          duration: 4000,
        },
      );

      // Close modal and go back
      setShowSaveWalletModal(false);
      onBack();
    } catch (error) {
      console.error("Error saving portfolio:", error);
      toast.error("Error saving portfolio", {
        description: "Please try again later",
      });
    }
  }, [
    isNameValid,
    walletName,
    investmentType,
    presetType,
    allocations,
    totalInvestment,
    initialDeposit,
    monthlyInvestment,
    investmentYears,
    projectedValue,
    onBack,
  ]);

  // Generate SVG path for donut chart (memoized to prevent unnecessary re-computation)
  const donutPaths = useMemo(() => {
    const size = 200;
    const center = size / 2;
    const outerRadius = 80;
    const innerRadius = 50; // Creates the center hole
    let currentAngle = -90; // Start from top

    return allocations.map((allocation, index) => {
      const angle = (allocation.percentage / 100) * 360;
      const startAngle = currentAngle * (Math.PI / 180);
      const endAngle = (currentAngle + angle) * (Math.PI / 180);

      // Outer arc points
      const x1Outer =
        center + outerRadius * Math.cos(startAngle);
      const y1Outer =
        center + outerRadius * Math.sin(startAngle);
      const x2Outer = center + outerRadius * Math.cos(endAngle);
      const y2Outer = center + outerRadius * Math.sin(endAngle);

      // Inner arc points
      const x1Inner =
        center + innerRadius * Math.cos(startAngle);
      const y1Inner =
        center + innerRadius * Math.sin(startAngle);
      const x2Inner = center + innerRadius * Math.cos(endAngle);
      const y2Inner = center + innerRadius * Math.sin(endAngle);

      const largeArcFlag = angle > 180 ? 1 : 0;

      const pathData = [
        `M ${x1Outer} ${y1Outer}`,
        `A ${outerRadius} ${outerRadius} 0 ${largeArcFlag} 1 ${x2Outer} ${y2Outer}`,
        `L ${x2Inner} ${y2Inner}`,
        `A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 0 ${x1Inner} ${y1Inner}`,
        "Z",
      ].join(" ");

      currentAngle += angle;

      return {
        pathData,
        color: allocation.color,
        symbol: allocation.symbol,
        index,
      };
    });
  }, [allocations]);

  return (
    <div
      className="min-h-screen transition-colors duration-300"
      style={{
        background: isDark
          ? "linear-gradient(135deg, rgb(15 23 42) 0%, rgb(2 6 23) 50%, rgb(15 23 42) 100%)"
          : "var(--universe-bg)",
      }}
    >
      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-6"
        >
          <Button
            variant="ghost"
            onClick={onBack}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
          <div className="text-center">
            <h1 className="text-xl text-foreground">
              Create Your Portfolio
            </h1>
            <p className="text-sm text-muted-foreground">
              {presetType === "balanced"
                ? "Balanced Portfolio"
                : presetType === "aggressive"
                  ? "Aggressive Portfolio"
                  : "Custom Portfolio"}
            </p>
          </div>
          <div className="w-16" /> {/* Spacer */}
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Pie Chart Section */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="space-y-6"
          >
            <Card
              className="p-6 text-center border border-border"
              style={{ backgroundColor: "var(--card-bg)" }}
            >
              <div className="flex items-center justify-center gap-8 mb-6">
                {/* Donut Chart */}
                <div className="relative">
                  <svg
                    width="200"
                    height="200"
                    className="transform -rotate-90"
                  >
                    <defs>
                      <filter id="glow">
                        <feGaussianBlur
                          stdDeviation="3"
                          result="coloredBlur"
                        />
                        <feMerge>
                          <feMergeNode in="coloredBlur" />
                          <feMergeNode in="SourceGraphic" />
                        </feMerge>
                      </filter>
                    </defs>
                    <motion.g
                      initial={{ rotate: 0 }}
                      animate={{ rotate: 360 }}
                      transition={{
                        duration: 2,
                        ease: "easeInOut",
                      }}
                    >
                      {donutPaths.map((path) => (
                        <motion.path
                          key={`${path.symbol}-${path.index}`}
                          d={path.pathData}
                          fill={path.color}
                          initial={{ scale: 0, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{
                            delay: path.index * 0.1,
                            duration: 0.8,
                            ease: "easeOut",
                          }}
                          className="hover:opacity-90 transition-all duration-200 cursor-pointer hover:brightness-110"
                          style={{
                            filter: `drop-shadow(0 2px 8px ${path.color}40)`,
                          }}
                        />
                      ))}
                    </motion.g>
                  </svg>

                  {/* Center content - now empty or with minimal decoration */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <motion.div
                      className="w-16 h-16 rounded-full bg-gradient-to-br from-teal-400/20 to-cyan-500/20 flex items-center justify-center"
                      animate={{
                        scale: [1, 1.1, 1],
                        opacity: [0.5, 0.8, 0.5],
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }}
                    >
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-teal-400 to-cyan-500 opacity-60"></div>
                    </motion.div>
                  </div>
                </div>

                {/* Percentage Button */}
                <div className="flex flex-col items-center">
                  <motion.button
                    onClick={redistributeProportionally}
                    disabled={
                      Math.abs(totalPercentage - 100) < 0.01
                    }
                    className={`
                      relative w-20 h-20 rounded-full border-4 transition-all duration-300 
                      hover:scale-110 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed
                      ${
                        isValid
                          ? "border-green-500 bg-green-500/10 hover:bg-green-500/20"
                          : "border-amber-500 bg-amber-500/10 hover:bg-amber-500/20"
                      }
                    `}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <div className="text-center">
                      <motion.div
                        className={`text-lg font-bold ${isValid ? "text-green-500" : "text-amber-500"}`}
                        animate={{
                          scale: isValid ? 1 : [1, 1.1, 1],
                        }}
                        transition={{
                          duration: 0.5,
                          repeat: isValid ? 0 : Infinity,
                        }}
                      >
                        {totalPercentage.toFixed(1)}%
                      </motion.div>
                      <div className="text-xs text-muted-foreground">
                        TOTAL
                      </div>
                    </div>

                    {/* Ripple effect */}
                    {!isValid && (
                      <motion.div
                        className="absolute inset-0 rounded-full border-2 border-amber-500"
                        animate={{
                          scale: [1, 1.5, 1],
                          opacity: [0.5, 0, 0.5],
                        }}
                        transition={{
                          duration: 1.5,
                          repeat: Infinity,
                          ease: "easeInOut",
                        }}
                      />
                    )}
                  </motion.button>

                  {!isValid && (
                    <motion.p
                      className="text-xs text-amber-500 mt-2 text-center max-w-[100px]"
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      Click to redistribute to 100%
                    </motion.p>
                  )}
                </div>
              </div>

              {/* Investment Amount */}
              <div className="space-y-3">
                <label className="text-sm text-muted-foreground">
                  Initial Investment
                </label>
                <div className="flex items-center justify-center gap-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setTotalInvestment(
                        Math.max(100, totalInvestment - 1000),
                      )
                    }
                    className="w-8 h-8 rounded-full p-0"
                  >
                    <Minus className="w-3 h-3" />
                  </Button>
                  <div className="text-center">
                    <div className="text-xl font-bold text-foreground">
                      ${totalInvestment.toLocaleString()}
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setTotalInvestment(totalInvestment + 1000)
                    }
                    className="w-8 h-8 rounded-full p-0"
                  >
                    <Plus className="w-3 h-3" />
                  </Button>
                </div>
                <div className="text-center space-y-1">
                  <p className="text-xs text-muted-foreground">
                    Expected Return:{" "}
                    {presetType === "aggressive"
                      ? "15-25%"
                      : "8-12%"}{" "}
                    annually
                  </p>
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-gradient-to-r from-green-400 to-emerald-500"></div>
                    <span className="text-xs text-muted-foreground">
                      {presetType === "aggressive"
                        ? "Aggressive"
                        : "Balanced"}{" "}
                      Portfolio
                    </span>
                  </div>
                </div>
              </div>
            </Card>

            {/* Legend */}
            <Card
              className="p-4 border border-border"
              style={{ backgroundColor: "var(--card-bg)" }}
            >
              <h3 className="text-sm font-semibold text-foreground mb-3">
                Portfolio Composition
              </h3>
              <div className="space-y-2">
                {allocations.map((allocation, index) => (
                  <div
                    key={allocation.symbol}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{
                          backgroundColor: allocation.color,
                        }}
                      />
                      <span className="text-xs text-foreground font-medium">
                        {allocation.symbol}
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {allocation.percentage.toFixed(1)}%
                    </span>
                  </div>
                ))}
              </div>
            </Card>

            {/* Validation Status */}
            <AnimatePresence>
              {!isValid && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="flex items-center gap-2 text-amber-500 bg-amber-500/10 p-3 rounded-lg border border-amber-500/20"
                >
                  <AlertCircle className="w-4 h-4" />
                  <div className="flex-1">
                    <span className="text-sm">
                      Difference:{" "}
                      {(totalPercentage - 100).toFixed(1)}%
                    </span>
                    <p className="text-xs opacity-80">
                      Click the button to redistribute
                      automatically
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Allocations List */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="space-y-4"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-lg text-foreground">
                Investments
              </h2>
              <Button
                variant="outline"
                size="sm"
                onClick={openTokenSelection}
                disabled={availableTokens.length === 0}
                className="flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Add Token
              </Button>
            </div>

            {/* Investments container with scroll */}
            <div 
              className="space-y-3 max-h-[600px] overflow-y-auto scrollbar-default"
              style={{
                paddingRight: isMobile ? '0' : '8px',
              }}
            >
              {allocations.map((allocation, index) => (
                <motion.div
                  key={allocation.symbol}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="group"
                >
                  <Card
                    className="p-4 border border-border transition-all duration-200 hover:shadow-lg"
                    style={{ backgroundColor: "var(--card-bg)" }}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg overflow-hidden bg-gradient-to-br from-teal-400 to-cyan-500 flex items-center justify-center flex-shrink-0">
                          <img 
                            src={allocation.image} 
                            alt={allocation.name}
                            className="w-6 h-6 object-contain"
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
                        <div>
                          <h3 className="font-semibold text-foreground">
                            {allocation.name}
                          </h3>
                          <p className="text-sm text-muted-foreground font-mono">
                            {allocation.symbol}
                            {allocation.isProtected && (
                              <span className="ml-2 text-xs bg-green-500/10 text-green-600 dark:text-green-400 px-1 py-0.5 rounded">
                                Protected
                              </span>
                            )}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {!allocation.isProtected && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeAllocation(index)}
                            className="opacity-0 group-hover:opacity-100 transition-opacity w-8 h-8 p-0 hover:bg-red-500/20"
                          >
                            <X className="w-4 h-4 text-red-500" />
                          </Button>
                        )}
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">
                          Percentage
                        </span>
                        <span className="font-semibold text-foreground">
                          {allocation.percentage.toFixed(1)}%
                        </span>
                      </div>

                      <div className="px-2">
                        <Slider
                          value={[allocation.percentage]}
                          onValueChange={([value]) =>
                            updateAllocation(index, value)
                          }
                          max={100}
                          min={allocation.isProtected ? (allocation.minPercentage || 25) : 0}
                          step={0.1}
                          className="w-full"
                        />
                      </div>

                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">
                          Investment Amount
                        </span>
                        <span className="font-semibold text-foreground">
                          ${allocation.amount.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>

            {/* Create Portfolio Button */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="pt-4"
            >
              <Button
                onClick={handleCreatePortfolio}
                disabled={!isValid}
                className="w-full py-3 text-lg font-semibold"
                style={{
                  background: isDark
                    ? "var(--gradient-primary)"
                    : "linear-gradient(135deg, #3b82f6, #1d4ed8)",
                  color: "white",
                }}
              >
                Create Portfolio
              </Button>
              {!isValid && (
                <p className="text-xs text-amber-500 mt-2 text-center">
                  Adjust allocations to equal 100% before
                  creating
                </p>
              )}
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* Investment Type Modal */}
      <Dialog open={showInvestmentModal} onOpenChange={setShowInvestmentModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Choose Investment Type</DialogTitle>
            <DialogDescription>
              Select how you want to manage this portfolio
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <Button
              variant="outline"
              className="w-full justify-start h-auto p-4 border-2"
              onClick={() => {
                setInvestmentType("autoinvest");
                setShowInvestmentModal(false);
                setShowAutoinvestModal(true);
              }}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-teal-500 to-cyan-500 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-white" />
                </div>
                <div className="text-left">
                  <div className="font-semibold">Autoinvest</div>
                  <div className="text-sm text-muted-foreground">
                    Set up recurring investments
                  </div>
                </div>
              </div>
            </Button>
            
            <Button
              variant="outline"
              className="w-full justify-start h-auto p-4 border-2"
              onClick={() => {
                setInvestmentType("manual");
                setShowInvestmentModal(false);
                handleInvestmentComplete();
              }}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
                  <Settings className="w-5 h-5 text-white" />
                </div>
                <div className="text-left">
                  <div className="font-semibold">Manual</div>
                  <div className="text-sm text-muted-foreground">
                    Manage investments yourself
                  </div>
                </div>
              </div>
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Autoinvest Configuration Modal */}
      <Dialog open={showAutoinvestModal} onOpenChange={setShowAutoinvestModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Configure Autoinvest</DialogTitle>
            <DialogDescription>
              Set up your recurring investment parameters
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Initial Deposit */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Initial Deposit
              </label>
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setInitialDeposit(Math.max(100, initialDeposit - 500))}
                  className="w-8 h-8 rounded-full p-0"
                >
                  <Minus className="w-3 h-3" />
                </Button>
                <div className="flex-1">
                  <Input
                    type="number"
                    value={initialDeposit}
                    onChange={(e) => setInitialDeposit(Math.max(100, parseInt(e.target.value) || 100))}
                    className="text-center"
                  />
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setInitialDeposit(initialDeposit + 500)}
                  className="w-8 h-8 rounded-full p-0"
                >
                  <Plus className="w-3 h-3" />
                </Button>
              </div>
            </div>

            {/* Monthly Investment */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Monthly Investment
              </label>
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setMonthlyInvestment(Math.max(10, monthlyInvestment - 100))}
                  className="w-8 h-8 rounded-full p-0"
                >
                  <Minus className="w-3 h-3" />
                </Button>
                <div className="flex-1">
                  <Input
                    type="number"
                    value={monthlyInvestment}
                    onChange={(e) => setMonthlyInvestment(Math.max(10, parseInt(e.target.value) || 10))}
                    className="text-center"
                  />
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setMonthlyInvestment(monthlyInvestment + 100)}
                  className="w-8 h-8 rounded-full p-0"
                >
                  <Plus className="w-3 h-3" />
                </Button>
              </div>
            </div>

            {/* Investment Years */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Investment Years
              </label>
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setInvestmentYears(Math.max(1, investmentYears - 1))}
                  className="w-8 h-8 rounded-full p-0"
                >
                  <Minus className="w-3 h-3" />
                </Button>
                <div className="flex-1">
                  <Input
                    type="number"
                    value={investmentYears}
                    onChange={(e) => setInvestmentYears(Math.max(1, parseInt(e.target.value) || 1))}
                    className="text-center"
                  />
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setInvestmentYears(investmentYears + 1)}
                  className="w-8 h-8 rounded-full p-0"
                >
                  <Plus className="w-3 h-3" />
                </Button>
              </div>
            </div>

            {/* Projection */}
            <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 p-4 rounded-lg border border-green-500/20">
              <div className="text-center">
                <div className="text-sm text-muted-foreground mb-1">
                  Projected Value ({investmentYears} years)
                </div>
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  ${projectedValue.toLocaleString()}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  Assumes {presetType === "aggressive" ? "20%" : "10%"} annual return
                </div>
              </div>
            </div>

            <Button
              onClick={() => {
                setShowAutoinvestModal(false);
                handleInvestmentComplete();
              }}
              className="w-full"
              style={{
                background: isDark
                  ? "var(--gradient-primary)"
                  : "linear-gradient(135deg, #3b82f6, #1d4ed8)",
                color: "white",
              }}
            >
              Confirm Configuration
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Save Wallet Modal */}
      <Dialog open={showSaveWalletModal} onOpenChange={setShowSaveWalletModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Save Your Portfolio</DialogTitle>
            <DialogDescription>
              Give your portfolio a unique name
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Portfolio Name
              </label>
              <Input
                type="text"
                value={walletName}
                onChange={(e) => setWalletName(e.target.value)}
                placeholder="Enter portfolio name..."
                className={`${!isNameValid && walletName ? 'border-red-500' : ''}`}
              />
              {walletName && !isNameValid && (
                <p className="text-xs text-red-500">
                  {walletName.trim().length < 3 
                    ? "Name must be at least 3 characters"
                    : walletName.trim().length > 50
                    ? "Name must be less than 50 characters"
                    : "Portfolio name already exists"
                  }
                </p>
              )}
            </div>

            {/* Portfolio Summary */}
            <div className="bg-accent/20 rounded-lg p-3 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Type:</span>
                <span className="font-medium text-foreground capitalize">
                  {investmentType} • {presetType || 'Custom'}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Investment:</span>
                <span className="font-medium text-foreground">
                  ${totalInvestment.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Assets:</span>
                <span className="font-medium text-foreground">
                  {allocations.length} tokens
                </span>
              </div>
            </div>

            <Button
              onClick={handleSaveWallet}
              disabled={!isNameValid}
              className="w-full"
              style={{
                background: isDark
                  ? "var(--gradient-primary)"
                  : "linear-gradient(135deg, #3b82f6, #1d4ed8)",
                color: "white",
              }}
            >
              <Save className="w-4 h-4 mr-2" />
              Save Portfolio
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Token Selection Modal */}
      <Dialog open={showTokenSelectionModal} onOpenChange={setShowTokenSelectionModal}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle>Add Token to Portfolio</DialogTitle>
            <DialogDescription>
              Choose from available ERC-20 tokens
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search tokens..."
                value={tokenSearchQuery}
                onChange={(e) => setTokenSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Token List */}
            <div className="max-h-96 overflow-y-auto space-y-2">
              {filteredAvailableTokens.map((token) => (
                <div
                  key={token.symbol}
                  className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-accent/50 cursor-pointer transition-colors"
                  onClick={() => addSpecificToken(token)}
                >
                  <div className="w-10 h-10 rounded-lg overflow-hidden bg-gradient-to-br from-teal-400 to-cyan-500 flex items-center justify-center">
                    <img 
                      src={token.image} 
                      alt={token.name}
                      className="w-6 h-6 object-contain"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        e.currentTarget.nextElementSibling!.style.display = 'flex';
                      }}
                    />
                    <div className="hidden w-full h-full bg-gradient-to-br from-teal-400 to-cyan-500 rounded-lg items-center justify-center">
                      <span className="text-white font-bold text-xs">
                        {token.symbol.slice(0, 2)}
                      </span>
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground">{token.name}</h3>
                    <p className="text-sm text-muted-foreground font-mono">{token.symbol}</p>
                  </div>
                  <Plus className="w-5 h-5 text-muted-foreground" />
                </div>
              ))}
              {filteredAvailableTokens.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No tokens found</p>
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}