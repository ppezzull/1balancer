"use client";

import {
  useState,
  useEffect,
  useMemo,
  useCallback,
} from "react";
import { motion, AnimatePresence } from "motion/react";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { Slider } from "./ui/slider";
import { Input } from "./ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
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
  Clock,
  Percent,
  ChevronUp,
  Info,
} from "lucide-react";
import { CRYPTOCURRENCY_DATA, savePortfolio, Portfolio as PortfolioType } from "~~/utils/constants";
import { toast } from "sonner";

// Default configuration for new portfolios
const DEFAULT_CONFIG = [
  {
    symbol: "SLD",
    name: "Shield StableCoin",
    percentage: 40,
    color: "#2F5586",
    image: "",
    isProtected: true,
    minPercentage: 25,
  },
  {
    symbol: "UNI",
    name: "Uniswap",
    percentage: 30,
    color: "#FF007A",
    image: "",
  },
  {
    symbol: "AAVE",
    name: "Aave",
    percentage: 30,
    color: "#B6509E",
    image: "",
  },
];

interface PieChartCreatorProps {
  onBack: () => void;
  initialTemplate?: any; // Template selezionato dal TemplateSelectionModal
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

// Updated interface to match new rebalancing system
interface Portfolio {
  id: string;
  name: string;
  type: 'drift' | 'time';
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
    driftThreshold?: number; // For drift-based rebalancing
    rebalanceFrequency?: 'weekly' | 'monthly' | 'quarterly' | 'semi-annual'; // For time-based rebalancing
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

export function PieChartCreator({
  onBack,
  initialTemplate,
}: PieChartCreatorProps) {
  const { isDark } = useTheme();
  const isMobile = useIsMobile();

  // Modal states
  const [showRebalanceModal, setShowRebalanceModal] = useState(false);
  const [showDriftModal, setShowDriftModal] = useState(false);
  const [showTimeModal, setShowTimeModal] = useState(false);
  const [showSaveWalletModal, setShowSaveWalletModal] = useState(false);
  const [showTokenSelectionModal, setShowTokenSelectionModal] = useState(false);
  const [rebalanceType, setRebalanceType] = useState<"drift" | "time" | null>(null);

  // Token selection state
  const [tokenSearchQuery, setTokenSearchQuery] = useState("");

  // Wallet saving states
  const [walletName, setWalletName] = useState(() => {
    // Se c'è un template iniziale, pre-popola il nome
    return initialTemplate ? `My ${initialTemplate.name} Portfolio` : "";
  });
  const [isNameValid, setIsNameValid] = useState(false);
  const [existingWalletNames, setExistingWalletNames] = useState<string[]>([]);

  // Rebalancing parameters
  const [driftThreshold, setDriftThreshold] = useState(10); // Default 10% drift (recommended)
  const [driftInputValue, setDriftInputValue] = useState("10"); // String value for input field
  const [rebalanceFrequency, setRebalanceFrequency] = useState<'weekly' | 'monthly' | 'quarterly' | 'semi-annual'>('monthly');

  // Wallet balance scanning states
  const [walletBalance, setWalletBalance] = useState<{[key: string]: number}>({});
  const [isScanning, setIsScanning] = useState(false);
  const [scanComplete, setScanComplete] = useState(false);
  const [showBalanceInfo, setShowBalanceInfo] = useState(false);

  const [allocations, setAllocations] = useState<TokenAllocation[]>(() => {
    // Se c'è un template iniziale, usa quello; altrimenti usa la config di default
    if (initialTemplate && initialTemplate.tokens) {
      return initialTemplate.tokens.map((token: any, index: number) => {
        const cryptoData = CRYPTOCURRENCY_DATA.find(crypto => crypto.symbol === token.symbol);
        return {
          symbol: token.symbol,
          name: cryptoData?.name || token.symbol,
          percentage: token.percentage || (100 / initialTemplate.tokens.length), // Distribuzione uniforme se non specificata
          color: cryptoData?.color || `hsl(${index * 45}, 70%, 50%)`, // Colori dinamici
          image: cryptoData?.image || "",
          amount: 0, // Will be calculated based on percentage and totalInvestment
          isProtected: token.symbol === 'SLD', // Solo SLD è protetto
          minPercentage: token.symbol === 'SLD' ? 25 : undefined,
        };
      });
    }
    
    return DEFAULT_CONFIG.map((config) => {
      const cryptoData = CRYPTOCURRENCY_DATA.find(crypto => crypto.symbol === config.symbol);
      return {
        ...config,
        image: cryptoData?.image || config.image,
        amount: 0, // Will be calculated based on percentage and totalInvestment
      };
    });
  });

  const [totalInvestment, setTotalInvestment] = useState(() => {
    // Se c'è un template iniziale, usa il suo valore; altrimenti usa 10000
    return initialTemplate?.totalValue || 10000;
  });

  // Load existing wallet names on component mount
  useEffect(() => {
    const savedWallets = localStorage.getItem("1balancer-wallets");
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

  // Sync drift input with slider value
  useEffect(() => {
    setDriftInputValue(driftThreshold.toString());
  }, [driftThreshold]);

  // Scan wallet balance when component mounts
  useEffect(() => {
    const scanWalletBalance = async () => {
      setIsScanning(true);
      setShowBalanceInfo(true);
      
      try {
        // Simulate wallet scanning with delay
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Mock wallet balance data based on allocations
        const mockBalance: {[key: string]: number} = {};
        allocations.forEach(allocation => {
          // Generate realistic balance amounts
          const baseAmount = Math.random() * 1000 + 100;
          mockBalance[allocation.symbol] = Math.floor(baseAmount * 100) / 100;
        });
        
        // Add some common tokens that might be in wallet
        const commonTokens = ['ETH', 'USDC', 'USDT', 'BTC'];
        commonTokens.forEach(token => {
          if (!mockBalance[token]) {
            const hasBalance = Math.random() > 0.5;
            if (hasBalance) {
              mockBalance[token] = Math.floor((Math.random() * 500 + 50) * 100) / 100;
            }
          }
        });

        setWalletBalance(mockBalance);
        setScanComplete(true);
        
        toast.success("Wallet Scan Complete", {
          description: `Found ${Object.keys(mockBalance).length} tokens in your wallet`,
          duration: 3000,
        });
        
      } catch (error) {
        console.error("Error scanning wallet:", error);
        toast.error("Wallet Scan Failed", {
          description: "Could not scan wallet balance. Please try again.",
          duration: 3000,
        });
      } finally {
        setIsScanning(false);
      }
    };

    // Only scan once when component mounts
    if (!scanComplete) {
      scanWalletBalance();
    }
  }, [allocations, scanComplete]);

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

  // Handle drift input change
  const handleDriftInputChange = useCallback((value: string) => {
    setDriftInputValue(value);
    
    // Parse and validate the input
    const numericValue = parseFloat(value);
    
    if (!isNaN(numericValue) && numericValue >= 3 && numericValue <= 30) {
      setDriftThreshold(numericValue);
    }
  }, []);

  // Handle drift input blur (when user finishes editing)
  const handleDriftInputBlur = useCallback(() => {
    const numericValue = parseFloat(driftInputValue);
    
    if (isNaN(numericValue) || numericValue < 3) {
      // Reset to minimum valid value
      setDriftThreshold(3);
      setDriftInputValue("3");
    } else if (numericValue > 30) {
      // Cap at maximum value
      setDriftThreshold(30);
      setDriftInputValue("30");
    } else {
      // Use the valid value
      setDriftThreshold(numericValue);
      setDriftInputValue(numericValue.toString());
    }
  }, [driftInputValue]);

  // Handle percentage increment/decrement for allocations
  const handlePercentageAdjustment = useCallback(
    (index: number, increment: boolean) => {
      setAllocations((currentAllocations) => {
        const newAllocations = [...currentAllocations];
        const allocation = newAllocations[index];
        
        // Check if this token is protected and has a minimum percentage
        const minValue = allocation.isProtected && allocation.minPercentage 
          ? allocation.minPercentage 
          : 0;
        
        const currentValue = allocation.percentage;
        const step = 0.1;
        const newValue = increment ? currentValue + step : currentValue - step;
        
        // Show warning if trying to decrease below minimum
        if (!increment && allocation.isProtected && allocation.minPercentage && newValue < allocation.minPercentage) {
          toast.warning("Shield StableCoin Protection", {
            description: `Cannot decrease below ${allocation.minPercentage}% minimum allocation for stability and security.`,
            duration: 3000,
          });
        }
        
        const percentage = Math.max(
          minValue,
          Math.min(100, newValue),
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
        
        // Show warning if trying to set below minimum
        if (allocation.isProtected && allocation.minPercentage && newPercentage < allocation.minPercentage) {
          toast.warning("Shield StableCoin Protection", {
            description: `Cannot set below ${allocation.minPercentage}% minimum allocation for stability and security.`,
            duration: 3000,
          });
        }
        
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

    // First, apply proportional scaling
    const factor = 100 / totalPercentage;
    let newAllocations = allocations.map((allocation) => {
      const newPercentage = parseFloat(
        (allocation.percentage * factor).toFixed(2),
      );
      return {
        ...allocation,
        percentage: newPercentage,
        amount: (totalInvestment * newPercentage) / 100
      };
    });

    // Enforce protection constraints (SLD minimum 25%)
    let totalProtectedPercentage = 0;
    const protectedAllocations: number[] = [];
    const nonProtectedIndices: number[] = [];

    newAllocations.forEach((allocation, index) => {
      if (allocation.isProtected && allocation.minPercentage) {
        if (allocation.percentage < allocation.minPercentage) {
          const deficit = allocation.minPercentage - allocation.percentage;
          totalProtectedPercentage += deficit;
          protectedAllocations.push(index);
          newAllocations[index].percentage = allocation.minPercentage;
        }
      } else {
        nonProtectedIndices.push(index);
      }
    });

    // If we had to adjust protected tokens, redistribute the difference from non-protected tokens
    if (totalProtectedPercentage > 0 && nonProtectedIndices.length > 0) {
      const redistributeAmount = totalProtectedPercentage / nonProtectedIndices.length;
      
      nonProtectedIndices.forEach((index) => {
        const newPercentage = Math.max(0, newAllocations[index].percentage - redistributeAmount);
        newAllocations[index].percentage = parseFloat(newPercentage.toFixed(2));
      });

      // Show warning toast for protected token adjustment
      toast.info("Shield StableCoin Protection", {
        description: "Minimum 25% allocation maintained for Shield StableCoin. Other tokens adjusted proportionally.",
        duration: 3000,
      });
    }

    // Adjust for rounding errors
    const newTotal = newAllocations.reduce(
      (sum, allocation) => sum + allocation.percentage,
      0,
    );
    
    if (Math.abs(newTotal - 100) > 0.01) {
      const diff = 100 - newTotal;
      // Add difference to the first non-protected token if possible
      const firstNonProtectedIndex = newAllocations.findIndex(
        (allocation) => !allocation.isProtected
      );
      const targetIndex = firstNonProtectedIndex !== -1 ? firstNonProtectedIndex : 0;
      
      newAllocations[targetIndex].percentage += diff;
      newAllocations[targetIndex].percentage = parseFloat(
        newAllocations[targetIndex].percentage.toFixed(2)
      );
    }

    // Update amounts based on final percentages
    newAllocations = newAllocations.map(allocation => ({
      ...allocation,
      amount: (totalInvestment * allocation.percentage) / 100
    }));

    setAllocations(newAllocations);
  }, [allocations, totalPercentage, totalInvestment]);

  // Handle create portfolio button click
  const handleCreatePortfolio = useCallback(() => {
    if (isValid) {
      setShowRebalanceModal(true);
    }
  }, [isValid]);

  // Handle rebalance type completion
  const handleRebalanceComplete = useCallback(() => {
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
      investmentType: rebalanceType, // Direct mapping to new system
      investmentConfig: rebalanceType === 'time' ? {
        initialDeposit: totalInvestment,
        monthlyInvestment: 0,
        years: 1,
      } : undefined,
    };

    try {
      // Use the new portfolio management utility
      savePortfolio(portfolioData);

      // Also save to the new system with rebalancing configuration
      const existingWallets = localStorage.getItem("1balancer-portfolios");
      const wallets: any[] = existingWallets ? JSON.parse(existingWallets) : [];
      
      // Create a portfolio entry for the new system
      const newPortfolioForNewSystem = {
        ...portfolioData,
        // Make sure investmentType is properly set for filtering
        investmentType: rebalanceType,
        rebalanceConfig: rebalanceType === 'drift' ? {
          driftThreshold,
        } : {
          rebalanceFrequency,
        }
      };
      
      wallets.push(newPortfolioForNewSystem);
      localStorage.setItem("1balancer-portfolios", JSON.stringify(wallets));

      // Show success toast
      const rebalanceDescription = rebalanceType === 'drift' 
        ? `Drift-based rebalancing at ${driftThreshold}% threshold`
        : `Time-based rebalancing ${rebalanceFrequency}`;
      
      toast.success(
        `Portfolio "${walletName}" created successfully!`,
        {
          description: `Custom portfolio with ${rebalanceDescription}`,
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
    rebalanceType,
    allocations,
    totalInvestment,
    driftThreshold,
    rebalanceFrequency,
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
              {initialTemplate ? `Customize ${initialTemplate.name}` : 'Create Your Portfolio'}
            </h1>
            <p className="text-sm text-muted-foreground">
              {initialTemplate ? `Based on ${initialTemplate.name} Template` : 'Custom Portfolio'}
            </p>
          </div>
          <div className="w-16" /> {/* Spacer */}
        </motion.div>

        {/* Wallet Balance Scanner & 1inch Integration */}
        {showBalanceInfo && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <Card className="border border-border bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-950/30 dark:to-cyan-950/30">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                      <Wallet className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-medium text-foreground">
                        {isScanning ? "Scanning Wallet..." : "Wallet Balance Detected"}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {isScanning ? "Analyzing your current holdings" : `${Object.keys(walletBalance).length} tokens found`}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowBalanceInfo(false)}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>

                {isScanning ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                      <span className="text-sm text-muted-foreground">Connecting to blockchain...</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div className="bg-gradient-to-r from-blue-500 to-cyan-500 h-2 rounded-full animate-pulse" style={{ width: '60%' }}></div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Current Balance Display */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {Object.entries(walletBalance).slice(0, 4).map(([symbol, amount]) => {
                        const token = CRYPTOCURRENCY_DATA.find(t => t.symbol === symbol);
                        const inPortfolio = allocations.some(a => a.symbol === symbol);
                        
                        return (
                          <div key={symbol} className={`p-3 rounded-lg border ${
                            inPortfolio 
                              ? 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/30' 
                              : 'border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800/30'
                          }`}>
                            <div className="flex items-center gap-2 mb-1">
                              <div className="w-5 h-5 rounded-full bg-gradient-to-br from-blue-400 to-cyan-500 flex items-center justify-center">
                                <span className="text-white text-xs font-bold">{symbol.slice(0, 2)}</span>
                              </div>
                              <span className="text-sm font-medium text-foreground">{symbol}</span>
                              {inPortfolio && (
                                <Check className="w-3 h-3 text-green-500" />
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground">{amount} tokens</p>
                            <p className="text-xs font-medium text-foreground">
                              ${(amount * parseFloat(token?.price.replace(/,/g, '') || '0')).toFixed(2)}
                            </p>
                          </div>
                        );
                      })}
                    </div>

                    {/* 1inch Integration Suggestion */}
                    <div className="bg-gradient-to-r from-orange-50 to-yellow-50 dark:from-orange-950/30 dark:to-yellow-950/30 border border-orange-200 dark:border-orange-800 rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-yellow-500 flex items-center justify-center flex-shrink-0">
                          <TrendingUp className="w-4 h-4 text-white" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium text-foreground mb-1">Need to Rebalance Your Holdings?</h4>
                          <p className="text-sm text-muted-foreground mb-3">
                            Your current wallet balance may not match your target portfolio allocation. Use 1inch to swap tokens efficiently.
                          </p>
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              onClick={() => {
                                window.open('https://app.1inch.io/swap?src=1:ETH', '_blank');
                                toast.success("Opening 1inch", {
                                  description: "Redirecting to 1inch for token swapping",
                                  duration: 2000,
                                });
                              }}
                              className="bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600 text-white border-0"
                            >
                              <DollarSign className="w-3 h-3 mr-1" />
                              Swap on 1inch
                            </Button>
                            <span className="text-xs text-muted-foreground">Best rates guaranteed</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}

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
                    Expected Return: 8-15% annually
                  </p>
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-gradient-to-r from-green-400 to-emerald-500"></div>
                    <span className="text-xs text-muted-foreground">
                      Custom Portfolio
                    </span>
                  </div>
                </div>
              </div>
            </Card>

            {/* Portfolio Allocation vs Current Balance */}
            
          </motion.div>

          {/* Allocations Section */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="space-y-6"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-foreground">
                Asset Allocations
              </h2>
              <Button
                variant="outline"
                size="sm"
                onClick={openTokenSelection}
                disabled={availableTokens.length === 0}
                className="flex items-center gap-2"
              >
                <Plus className="w-3 h-3" />
                Add Asset
              </Button>
            </div>

            <div className="space-y-3 max-h-96 overflow-y-auto scrollbar-default">
              {allocations.map((allocation, index) => (
                <motion.div
                  key={allocation.symbol}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card
                    className="p-4 border border-border"
                    style={{ backgroundColor: "var(--card-bg)" }}
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full overflow-hidden flex items-center justify-center relative ${
                            allocation.isProtected 
                              ? 'bg-gradient-to-br from-yellow-400 to-orange-500 ring-2 ring-yellow-300 dark:ring-yellow-600' 
                              : 'bg-gradient-to-br from-teal-400 to-cyan-500'
                          }`}>
                            <img 
                              src={allocation.image} 
                              alt={allocation.name}
                              className="w-5 h-5 object-contain"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                                e.currentTarget.nextElementSibling!.style.display = 'flex';
                              }}
                            />
                            <div className={`hidden w-full h-full rounded-full items-center justify-center ${
                              allocation.isProtected 
                                ? 'bg-gradient-to-br from-yellow-400 to-orange-500' 
                                : 'bg-gradient-to-br from-teal-400 to-cyan-500'
                            }`}>
                              <span className="text-white font-bold text-xs">
                                {allocation.symbol.slice(0, 2)}
                              </span>
                            </div>
                            {allocation.isProtected && (
                              <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-500 rounded-full flex items-center justify-center">
                                <AlertCircle className="w-2 h-2 text-white" />
                              </div>
                            )}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className={`font-medium ${allocation.isProtected ? 'text-yellow-700 dark:text-yellow-300' : 'text-foreground'}`}>
                                {allocation.symbol}
                              </h3>
                              {allocation.isProtected && (
                                <span className="text-xs px-1.5 py-0.5 bg-yellow-200 dark:bg-yellow-800 text-yellow-800 dark:text-yellow-200 rounded font-medium">
                                  PROTECTED
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {allocation.name}
                            </p>
                          </div>
                        </div>
                        {!allocation.isProtected ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeAllocation(index)}
                            className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950"
                            title="Remove token"
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        ) : (
                          <div className="flex items-center gap-1 px-2 py-1 bg-yellow-100 dark:bg-yellow-900/30 rounded text-yellow-700 dark:text-yellow-300">
                            <AlertCircle className="w-3 h-3" />
                            <span className="text-xs font-medium">Cannot Remove</span>
                          </div>
                        )}
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-muted-foreground">
                              Allocation
                            </span>
                            {allocation.isProtected && (
                              <div className="flex items-center gap-1 px-2 py-0.5 bg-yellow-100 dark:bg-yellow-900/30 rounded-full">
                                <AlertCircle className="w-3 h-3 text-yellow-600 dark:text-yellow-400" />
                                <span className="text-xs text-yellow-700 dark:text-yellow-300 font-medium">
                                  Protected
                                </span>
                              </div>
                            )}
                          </div>
                          <span className="text-sm font-medium text-foreground">
                            {allocation.percentage.toFixed(1)}%
                          </span>
                        </div>
                        
                        {allocation.isProtected && (
                          <div className="text-xs text-yellow-700 dark:text-yellow-300 bg-yellow-50 dark:bg-yellow-900/20 p-2 rounded-md border border-yellow-200 dark:border-yellow-800">
                            <div className="flex items-center gap-1">
                              <AlertCircle className="w-3 h-3" />
                              <span className="font-medium">
                                Minimum {allocation.minPercentage}% allocation required for portfolio stability
                              </span>
                            </div>
                          </div>
                        )}
                        
                        <div className="flex items-center gap-3">
                          <Slider
                            value={[allocation.percentage]}
                            onValueChange={([value]) =>
                              updateAllocation(index, value)
                            }
                            max={100}
                            min={allocation.isProtected && allocation.minPercentage ? allocation.minPercentage : 0}
                            step={0.1}
                            className={`flex-1 ${allocation.isProtected ? 'accent-yellow-500' : ''}`}
                          />
                          
                          {/* Custom percentage input with visible +/- buttons */}
                          <div className={`flex items-center border rounded-md ${
                            allocation.isProtected 
                              ? 'border-yellow-300 dark:border-yellow-700 bg-yellow-50 dark:bg-yellow-900/20' 
                              : 'border-border'
                          }`}>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handlePercentageAdjustment(index, false)}
                              disabled={
                                allocation.percentage <= (allocation.isProtected && allocation.minPercentage ? allocation.minPercentage : 0)
                              }
                              className={`h-8 w-8 p-0 hover:bg-accent ${
                                allocation.percentage <= (allocation.isProtected && allocation.minPercentage ? allocation.minPercentage : 0)
                                  ? 'opacity-30 cursor-not-allowed'
                                  : ''
                              }`}
                              title={allocation.isProtected && allocation.percentage <= allocation.minPercentage! 
                                ? `Cannot go below ${allocation.minPercentage}% minimum` 
                                : 'Decrease allocation'
                              }
                            >
                              <Minus className="w-3 h-3" />
                            </Button>
                            
                            <Input
                              type="number"
                              value={allocation.percentage.toFixed(1)}
                              onChange={(e) => {
                                const inputValue = parseFloat(e.target.value) || 0;
                                const minValue = allocation.isProtected && allocation.minPercentage ? allocation.minPercentage : 0;
                                
                                // Prevent typing values below minimum for protected tokens
                                if (allocation.isProtected && inputValue < minValue) {
                                  toast.warning("Shield StableCoin Protection", {
                                    description: `Cannot set below ${minValue}% minimum allocation.`,
                                    duration: 2000,
                                  });
                                  return; // Don't update if below minimum
                                }
                                
                                updateAllocation(index, inputValue);
                              }}
                              onBlur={(e) => {
                                // Enforce minimum on blur
                                const inputValue = parseFloat(e.target.value) || 0;
                                const minValue = allocation.isProtected && allocation.minPercentage ? allocation.minPercentage : 0;
                                
                                if (inputValue < minValue) {
                                  updateAllocation(index, minValue);
                                }
                              }}
                              className={`w-20 text-center border-0 focus:ring-0 focus:border-0 bg-transparent ${
                                allocation.isProtected ? 'font-medium text-yellow-700 dark:text-yellow-300' : ''
                              }`}
                              min={allocation.isProtected && allocation.minPercentage ? allocation.minPercentage : 0}
                              max={100}
                              step={0.1}
                              title={allocation.isProtected ? `Minimum: ${allocation.minPercentage}%` : undefined}
                            />
                            
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handlePercentageAdjustment(index, true)}
                              disabled={allocation.percentage >= 100}
                              className="h-8 w-8 p-0 hover:bg-accent"
                              title="Increase allocation"
                            >
                              <Plus className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          ${allocation.amount.toLocaleString()}
                          {allocation.isProtected && (
                            <span className="ml-2 text-yellow-600 dark:text-yellow-400 font-medium">
                              • Protected Asset (Min: {allocation.minPercentage}%)
                            </span>
                          )}
                        </div>
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
              transition={{ delay: 0.8 }}
            >
              <Button
                onClick={handleCreatePortfolio}
                disabled={!isValid}
                className="w-full h-12 text-base font-medium"
                style={{
                  background: isValid
                    ? isDark
                      ? "var(--gradient-primary)"
                      : "linear-gradient(135deg, #3b82f6, #1d4ed8)"
                    : undefined,
                  color: isValid ? "white" : undefined,
                }}
              >
                {isValid ? (
                  <>
                    <Check className="w-5 h-5 mr-2" />
                    Create Portfolio
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-5 h-5 mr-2" />
                    Adjust percentages to 100%
                  </>
                )}
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* Rebalancing Strategy Modal */}
      <Dialog open={showRebalanceModal} onOpenChange={setShowRebalanceModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Choose Rebalancing Strategy
            </DialogTitle>
            <DialogDescription>
              Select how you want your portfolio to be automatically rebalanced to maintain target allocations.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <motion.button
              onClick={() => {
                setRebalanceType("drift");
                setShowRebalanceModal(false);
                setShowDriftModal(true);
              }}
              className="w-full p-4 border-2 border-border rounded-xl hover:border-teal-500 transition-colors text-left group"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center">
                  <Percent className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">
                    Drift-Based
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Rebalance when allocations drift beyond a set threshold
                  </p>
                </div>
              </div>
            </motion.button>

            <motion.button
              onClick={() => {
                setRebalanceType("time");
                setShowRebalanceModal(false);
                setShowTimeModal(true);
              }}
              className="w-full p-4 border-2 border-border rounded-xl hover:border-teal-500 transition-colors text-left group"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                  <Clock className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">
                    Time-Based
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Rebalance on a fixed schedule (weekly, monthly, etc.)
                  </p>
                </div>
              </div>
            </motion.button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Drift Configuration Modal */}
      <Dialog open={showDriftModal} onOpenChange={setShowDriftModal}>
        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto scrollbar-default">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Percent className="w-5 h-5 text-purple-500" />
              Drift-Based Rebalancing
            </DialogTitle>
            <DialogDescription>
              Set the percentage threshold that triggers automatic rebalancing.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 max-h-[70vh] overflow-y-auto scrollbar-default">
            <div className="space-y-4">
              <label className="text-sm font-medium text-foreground">
                Drift Threshold
              </label>
              <p className="text-sm text-muted-foreground">
                Portfolio will rebalance when any asset allocation drifts beyond this percentage from its target
              </p>
              
              {/* Slider and input controls */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-sm">Threshold Percentage</label>
                  <div className="flex items-center gap-2">
                    <Input
                      value={driftInputValue}
                      onChange={(e) => handleDriftInputChange(e.target.value)}
                      onBlur={handleDriftInputBlur}
                      className="w-16 h-8 text-center text-sm"
                      placeholder="10"
                    />
                    <Percent className="w-4 h-4 text-muted-foreground" />
                  </div>
                </div>
                
                <Slider
                  value={[driftThreshold]}
                  onValueChange={(value) => {
                    setDriftThreshold(value[0]);
                    setDriftInputValue(value[0].toString());
                  }}
                  max={30}
                  min={3}
                  step={1}
                  className="w-full"
                />
                
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>3% (Very High Frequency)</span>
                  <span>10% (Recommended)</span>
                  <span>30% (Ultra-Passive)</span>
                </div>
              </div>

              {/* Drift Threshold Reference Table */}
              <div className="bg-gradient-to-r from-blue-500/5 to-cyan-500/5 border border-blue-500/20 rounded-lg p-4">
                <div className="flex items-start gap-3 mb-3">
                  <Info className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                  <div className="text-sm">
                    <p className="text-blue-700 dark:text-blue-300 font-medium mb-1">
                      Drift Threshold Guide:
                    </p>
                    <p className="text-blue-600 dark:text-blue-400 text-xs mb-3">
                      Choose your strategy based on risk tolerance and portfolio stability preferences
                    </p>
                  </div>
                </div>
                
                <div className="overflow-x-auto -mx-1 px-1">
                  <table className="w-full text-xs min-w-[400px]">
                    <thead>
                      <tr className="border-b border-blue-500/20">
                        <th className="text-left py-2 pr-3 text-blue-700 dark:text-blue-300 font-medium">Threshold</th>
                        <th className="text-left py-2 pr-3 text-blue-700 dark:text-blue-300 font-medium">Frequency</th>
                        <th className="text-left py-2 pr-3 text-blue-700 dark:text-blue-300 font-medium">Stability</th>
                        <th className="text-left py-2 text-blue-700 dark:text-blue-300 font-medium">Best for</th>
                      </tr>
                    </thead>
                    <tbody className="text-blue-600 dark:text-blue-400">
                      <tr className={`border-b border-blue-500/10 ${driftThreshold === 3 ? 'bg-blue-500/10' : ''}`}>
                        <td className="py-1.5 pr-3 font-medium">3%</td>
                        <td className="py-1.5 pr-3">Very High</td>
                        <td className="py-1.5 pr-3">Maximum</td>
                        <td className="py-1.5">Ultra-conservative users</td>
                      </tr>
                      <tr className={`border-b border-blue-500/10 ${driftThreshold === 5 ? 'bg-blue-500/10' : ''}`}>
                        <td className="py-1.5 pr-3 font-medium">5%</td>
                        <td className="py-1.5 pr-3">High</td>
                        <td className="py-1.5 pr-3">Very High</td>
                        <td className="py-1.5">Conservative investors</td>
                      </tr>
                      <tr className={`border-b border-blue-500/10 ${driftThreshold === 10 ? 'bg-blue-500/10 ring-1 ring-blue-500/30' : ''}`}>
                        <td className="py-1.5 pr-3 font-medium">10%</td>
                        <td className="py-1.5 pr-3">Medium</td>
                        <td className="py-1.5 pr-3">High</td>
                        <td className="py-1.5">Most users (recommended)</td>
                      </tr>
                      <tr className={`border-b border-blue-500/10 ${driftThreshold === 15 ? 'bg-blue-500/10' : ''}`}>
                        <td className="py-1.5 pr-3 font-medium">15%</td>
                        <td className="py-1.5 pr-3">Low</td>
                        <td className="py-1.5 pr-3">Moderate</td>
                        <td className="py-1.5">Semi-passive strategies</td>
                      </tr>
                      <tr className={`border-b border-blue-500/10 ${driftThreshold === 20 ? 'bg-blue-500/10' : ''}`}>
                        <td className="py-1.5 pr-3 font-medium">20%</td>
                        <td className="py-1.5 pr-3">Very Low</td>
                        <td className="py-1.5 pr-3">Low</td>
                        <td className="py-1.5">Long-term holders</td>
                      </tr>
                      <tr className={`border-b border-blue-500/10 ${driftThreshold === 25 ? 'bg-blue-500/10' : ''}`}>
                        <td className="py-1.5 pr-3 font-medium">25%</td>
                        <td className="py-1.5 pr-3">Rare</td>
                        <td className="py-1.5 pr-3">Lowest</td>
                        <td className="py-1.5">Dynamic portfolios</td>
                      </tr>
                      <tr className={`${driftThreshold === 30 ? 'bg-blue-500/10' : ''}`}>
                        <td className="py-1.5 pr-3 font-medium">30%</td>
                        <td className="py-1.5 pr-3">Very Rare</td>
                        <td className="py-1.5 pr-3">Lowest</td>
                        <td className="py-1.5">Ultra-passive strategies</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                
                <div className="mt-3 pt-3 border-t border-blue-500/20">
                  <p className="text-blue-600 dark:text-blue-400 text-xs">
                    <strong>Current selection:</strong> {driftThreshold}% - 
                    {driftThreshold === 3 ? ' Ultra-conservative with maximum stability and very high rebalancing frequency.' :
                     driftThreshold === 5 ? ' Conservative approach with very high stability and frequent rebalancing.' :
                     driftThreshold === 10 ? ' Recommended balanced approach with high stability and medium rebalancing frequency.' :
                     driftThreshold === 15 ? ' Semi-passive strategy with moderate stability and low rebalancing frequency.' :
                     driftThreshold === 20 ? ' Long-term approach with low stability and very low rebalancing frequency.' :
                     driftThreshold === 25 ? ' Dynamic portfolio strategy with lowest stability and rare rebalancing.' :
                     driftThreshold === 30 ? ' Ultra-passive strategy with lowest stability and very rare rebalancing.' :
                     ` Portfolio rebalances when any asset drifts ${driftThreshold}% from its target allocation.`}
                  </p>
                </div>
              </div>
            </div>

            <Button
              onClick={() => {
                setShowDriftModal(false);
                handleRebalanceComplete();
              }}
              className="w-full"
              style={{
                background: isDark
                  ? "var(--gradient-primary)"
                  : "linear-gradient(135deg, #3b82f6, #1d4ed8)",
                color: "white",
              }}
            >
              <Check className="w-4 h-4 mr-2" />
              Confirm Drift Settings ({driftThreshold}%)
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Time Configuration Modal */}
      <Dialog open={showTimeModal} onOpenChange={setShowTimeModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-blue-500" />
              Time-Based Rebalancing
            </DialogTitle>
            <DialogDescription>
              Choose how frequently your portfolio should be automatically rebalanced.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6">
            <div className="space-y-3">
              <label className="text-sm font-medium text-foreground">
                Rebalancing Frequency
              </label>
              <Select value={rebalanceFrequency} onValueChange={(value: 'weekly' | 'monthly' | 'quarterly' | 'semi-annual') => setRebalanceFrequency(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select frequency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="quarterly">Quarterly</SelectItem>
                  <SelectItem value="semi-annual">Semi-Annual</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="bg-accent/20 p-4 rounded-lg">
              <h4 className="font-medium text-foreground mb-2">Schedule Details:</h4>
              <div className="text-sm text-muted-foreground space-y-1">
                {rebalanceFrequency === 'weekly' && <p>• Rebalances every Sunday </p>}
                {rebalanceFrequency === 'monthly' && <p>• Rebalances on the last business day of each month</p>}
                {rebalanceFrequency === 'quarterly' && <p>• Rebalances at the end of March, June, September, and December</p>}
                {rebalanceFrequency === 'semi-annual' && <p>• Rebalances at the end of June and December</p>}
                <p>• Automatic execution regardless of market conditions</p>
                <p>• Maintains target allocations consistently</p>
              </div>
            </div>

            <Button
              onClick={() => {
                setShowTimeModal(false);
                handleRebalanceComplete();
              }}
              className="w-full"
              style={{
                background: isDark
                  ? "var(--gradient-primary)"
                  : "linear-gradient(135deg, #3b82f6, #1d4ed8)",
                color: "white",
              }}
            >
              <Check className="w-4 h-4 mr-2" />
              Confirm Time Settings
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Token Selection Modal */}
      <Dialog open={showTokenSelectionModal} onOpenChange={setShowTokenSelectionModal}>
        <DialogContent className="sm:max-w-lg max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="w-5 h-5" />
              Add Cryptocurrency
            </DialogTitle>
            <DialogDescription>
              Choose a cryptocurrency to add to your portfolio allocation.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search cryptocurrencies..."
                value={tokenSearchQuery}
                onChange={(e) => setTokenSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Token List */}
            <div className="max-h-96 overflow-y-auto scrollbar-default space-y-2">
              {filteredAvailableTokens.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  {tokenSearchQuery ? "No cryptocurrencies found" : "All available cryptocurrencies are already in your portfolio"}
                </div>
              ) : (
                filteredAvailableTokens.map((token) => (
                  <motion.button
                    key={token.symbol}
                    onClick={() => addSpecificToken(token)}
                    className="w-full p-3 border border-border rounded-lg hover:border-teal-500 transition-colors text-left group"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full overflow-hidden bg-gradient-to-br from-teal-400 to-cyan-500 flex items-center justify-center">
                        <img 
                          src={token.image} 
                          alt={token.name}
                          className="w-6 h-6 object-contain"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                            e.currentTarget.nextElementSibling!.style.display = 'flex';
                          }}
                        />
                        <div className="hidden w-full h-full bg-gradient-to-br from-teal-400 to-cyan-500 rounded-full items-center justify-center">
                          <span className="text-white font-bold text-sm">
                            {token.symbol.slice(0, 2)}
                          </span>
                        </div>
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium text-foreground group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">
                          {token.symbol}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {token.name}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium text-foreground">
                          ${token.price}
                        </div>
                        <div className={`text-xs ${
                          token.change.startsWith('+') ? 'text-green-500' : 'text-red-500'
                        }`}>
                          {token.change}%
                        </div>
                      </div>
                    </div>
                  </motion.button>
                ))
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Save Wallet Modal */}
      <Dialog open={showSaveWalletModal} onOpenChange={setShowSaveWalletModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Wallet className="w-5 h-5" />
              Save Portfolio
            </DialogTitle>
            <DialogDescription>
              Give your portfolio a unique name to save it.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Portfolio Name
              </label>
              <Input
                placeholder="Enter portfolio name"
                value={walletName}
                onChange={(e) => setWalletName(e.target.value)}
                className={`${
                  walletName && !isNameValid
                    ? "border-red-500 focus:border-red-500"
                    : ""
                }`}
              />
              {walletName && !isNameValid && (
                <p className="text-xs text-red-500">
                  Name must be 3-50 characters and unique
                </p>
              )}
            </div>

            {/* Portfolio Summary */}
            <div className="bg-accent/20 p-4 rounded-lg space-y-2">
              <h4 className="font-medium text-foreground">Portfolio Summary:</h4>
              <div className="text-sm text-muted-foreground space-y-1">
                <p>• Total Investment: ${totalInvestment.toLocaleString()}</p>
                <p>• Rebalancing: {rebalanceType === 'drift' 
                  ? `${driftThreshold}% drift threshold` 
                  : `${rebalanceFrequency} schedule`}
                </p>
                <p>• Assets: {allocations.length} cryptocurrencies</p>
              </div>
            </div>

            <Button
              onClick={handleSaveWallet}
              disabled={!isNameValid}
              className="w-full"
              style={{
                background: isNameValid
                  ? isDark
                    ? "var(--gradient-primary)"
                    : "linear-gradient(135deg, #3b82f6, #1d4ed8)"
                  : undefined,
                color: isNameValid ? "white" : undefined,
              }}
            >
              <Save className="w-4 h-4 mr-2" />
              Save Portfolio
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}