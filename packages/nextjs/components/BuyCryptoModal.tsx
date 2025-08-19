"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { useTheme } from "./ui/use-theme";
import { useIsMobile } from "./ui/use-mobile";
import { toast } from "sonner";
import { X, TrendingUp, TrendingDown, Euro, DollarSign, Minus, Plus, ArrowLeftRight, RefreshCw, Settings, ChevronDown } from "lucide-react";

interface BuyCryptoModalProps {
  crypto: {
    symbol: string;
    name: string;
    price: string | number;
    change: string | number;
    image: string;
  };
  isOpen: boolean;
  onClose: () => void;
}

export function BuyCryptoModal({ crypto, isOpen, onClose }: BuyCryptoModalProps) {
  // Safe parsing functions for price and change that handle both string and number inputs
  const parsePrice = (price: string | number): number => {
    if (typeof price === 'number') return price;
    if (typeof price === 'string') return parseFloat(price.replace(/[,$]/g, ''));
    return 0;
  };
  
  // Helper function to get token price safely
  const getTokenPrice = (token: any): number => {
    if (token.symbol === crypto.symbol) {
      return parsePrice(crypto.price);
    }
    return typeof token.price === 'number' ? token.price : parsePrice(token.price || 0);
  };

  const [orderType, setOrderType] = useState('market');
  const [amount, setAmount] = useState('0');
  const [cryptoAmount, setCryptoAmount] = useState('0');
  const [currency, setCurrency] = useState('EUR');
  const [inputMode, setInputMode] = useState<'fiat' | 'crypto'>('fiat');
  
  // Limit order specific states
  const [limitPrice, setLimitPrice] = useState('');
  const [limitQuantity, setLimitQuantity] = useState('0');
  
  // Stop order specific states
  const [stopTriggerPrice, setStopTriggerPrice] = useState('');
  const [stopQuantity, setStopQuantity] = useState('0');
  
  // Stop Limit order specific states
  const [stopLimitTriggerPrice, setStopLimitTriggerPrice] = useState('');
  const [stopLimitPrice, setStopLimitPrice] = useState('');
  const [stopLimitQuantity, setStopLimitQuantity] = useState('0');
  
  // Available tokens for swapping
  const availableTokens = [
    { symbol: 'ETH', name: 'Ethereum', image: '/images/tokens/eth.png', price: 3200.00, gradient: 'from-purple-400 to-purple-600' },
    { symbol: 'USDC', name: 'USD Coin', image: '/images/tokens/usdc.png', price: 1.00, gradient: 'from-blue-400 to-blue-600' },
    // Add crypto token to available tokens if it's not already ETH or USDC
    ...(crypto.symbol !== 'ETH' && crypto.symbol !== 'USDC' ? [{ 
      symbol: crypto.symbol, 
      name: crypto.name, 
      image: crypto.image, 
      price: parsePrice(crypto.price), 
      gradient: 'from-teal-400 to-cyan-500' 
    }] : [])
  ];

  // Swap specific states
  const [fromToken, setFromToken] = useState(() => {
    // Default to ETH if available, otherwise first token
    const ethToken = availableTokens.find(token => token.symbol === 'ETH');
    return ethToken || availableTokens[0];
  });
  const [toToken, setToToken] = useState({ 
    symbol: crypto.symbol, 
    name: crypto.name, 
    price: parsePrice(crypto.price), 
    gradient: 'from-teal-400 to-cyan-500' 
  });
  const [swapFromAmount, setSwapFromAmount] = useState('0');
  const [swapToAmount, setSwapToAmount] = useState('0');
  const [slippage, setSlippage] = useState('0.5');
  const [swapRate, setSwapRate] = useState(0);
  const [showFromTokenSelector, setShowFromTokenSelector] = useState(false);
  
  const { isDark } = useTheme();
  const isMobile = useIsMobile();
  
  const orderTypes = [
    { id: 'market', label: 'Market' },
    { id: 'limit', label: 'Limit' },
    { id: 'swap', label: 'Swap' }
  ];

  const parseChange = (change: string | number): number => {
    if (typeof change === 'number') return change;
    if (typeof change === 'string') return parseFloat(change.replace(/[%+]/g, ''));
    return 0;
  };
  
  const formatPrice = (price: string | number): string => {
    const numPrice = parsePrice(price);
    return numPrice.toLocaleString('en-US', { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 6 
    });
  };
  
  const formatChange = (change: string | number): string => {
    const numChange = parseChange(change);
    const sign = numChange >= 0 ? '+' : '';
    return `${sign}${numChange.toFixed(2)}`;
  };
  
  const isPositive = parseChange(crypto.change) > 0;
  const cryptoPrice = parsePrice(crypto.price);
  
  // Initialize prices with current market price - Only run when orderType changes
  useEffect(() => {
    const formattedPrice = formatPrice(crypto.price);
    if (orderType === 'limit' && !limitPrice) {
      setLimitPrice(formattedPrice);
    }
    if (orderType === 'swap') {
      // Set default tokens: ETH -> crypto for supported pairs
      const ethToken = { symbol: 'ETH', name: 'Ethereum', price: 3200.00, gradient: 'from-purple-400 to-purple-600' };
      const cryptoToken = { 
        symbol: crypto.symbol, 
        name: crypto.name, 
        price: parsePrice(crypto.price), 
        gradient: 'from-teal-400 to-cyan-500' 
      };
      
      // Set ETH as default fromToken if crypto is supported
      const isSupported = crypto.symbol === '1INCH' || crypto.symbol === 'ETH';
      if (isSupported && crypto.symbol !== 'ETH') {
        setFromToken(ethToken);
        setToToken(cryptoToken);
      } else if (crypto.symbol === 'ETH') {
        // If crypto is ETH, default to USDC -> ETH
        const usdcToken = availableTokens.find(token => token.symbol === 'USDC') || availableTokens[0];
        setFromToken(usdcToken);
        setToToken(cryptoToken);
      } else {
        // For unsupported cryptos, set as default
        setToToken(cryptoToken);
      }
      
      // Initialize swap rate and calculate initial amounts
      const currentFromToken = isSupported && crypto.symbol !== 'ETH' ? ethToken : 
                              crypto.symbol === 'ETH' ? (availableTokens.find(token => token.symbol === 'USDC') || availableTokens[0]) : 
                              fromToken;
      calculateSwapRate(currentFromToken, cryptoToken);
      
      if (swapFromAmount && parseFloat(swapFromAmount) > 0) {
        const fromPrice = getTokenPrice(currentFromToken);
        const toPrice = getTokenPrice(cryptoToken);
        if (fromPrice > 0 && toPrice > 0) {
          const rate = fromPrice / toPrice;
          const toAmount = parseFloat(swapFromAmount) / rate;
          setSwapToAmount(toAmount.toFixed(6));
        }
      }
    }
  }, [orderType, crypto]); // Only depend on orderType and crypto to prevent loops

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showFromTokenSelector) {
        setShowFromTokenSelector(false);
      }
    };

    if (showFromTokenSelector) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [showFromTokenSelector]);

  // Sync crypto amount when fiat amount changes (only in fiat mode)
  useEffect(() => {
    if (inputMode === 'fiat') {
      const fiatAmount = parseFloat(amount) || 0;
      const newCryptoAmount = fiatAmount > 0 ? (fiatAmount / cryptoPrice).toFixed(6) : '0';
      setCryptoAmount(newCryptoAmount);
    }
  }, [amount, cryptoPrice, inputMode]); // Don't include cryptoAmount in dependencies

  // Sync fiat amount when crypto amount changes (only in crypto mode)
  useEffect(() => {
    if (inputMode === 'crypto') {
      const cryptoAmountValue = parseFloat(cryptoAmount) || 0;
      const newFiatAmount = cryptoAmountValue > 0 ? (cryptoAmountValue * cryptoPrice).toFixed(2) : '0';
      setAmount(newFiatAmount);
    }
  }, [cryptoAmount, cryptoPrice, inputMode]); // Don't include amount in dependencies

  const handleFiatAmountChange = (value: string) => {
    if (/^\d*\.?\d*$/.test(value)) {
      setAmount(value);
    }
  };

  const handleCryptoAmountChange = (value: string) => {
    if (/^\d*\.?\d*$/.test(value)) {
      setCryptoAmount(value);
    }
  };

  const incrementFiatAmount = (increment: number) => {
    const currentAmount = parseFloat(amount) || 0;
    const newAmount = Math.max(0, currentAmount + increment);
    setAmount(newAmount.toString());
  };

  const incrementCryptoAmount = (increment: number) => {
    const currentAmount = parseFloat(cryptoAmount) || 0;
    const cryptoIncrement = increment / cryptoPrice;
    const newAmount = Math.max(0, currentAmount + cryptoIncrement);
    setCryptoAmount(newAmount.toFixed(6));
  };

  const toggleInputMode = () => {
    setInputMode(inputMode === 'fiat' ? 'crypto' : 'fiat');
  };

  const isAmountValid = () => {
    if (orderType === 'limit') {
      return limitQuantity && parseFloat(limitQuantity) > 0 && limitPrice && parsePrice(limitPrice) > 0;
    }
    
    if (orderType === 'swap') {
      return swapFromAmount && parseFloat(swapFromAmount) > 0 && swapToAmount && parseFloat(swapToAmount) > 0;
    }
    
    if (inputMode === 'fiat') {
      return amount && parseFloat(amount) > 0;
    } else {
      return cryptoAmount && parseFloat(cryptoAmount) > 0;
    }
  };

  // Calculate total value for different order types
  const calculateLimitTotal = () => {
    const price = parsePrice(limitPrice || '0');
    const quantity = parseFloat(limitQuantity || '0');
    return (price * quantity).toFixed(2);
  };

  const calculateStopTotal = () => {
    const price = parsePrice(stopTriggerPrice || '0');
    const quantity = parseFloat(stopQuantity || '0');
    return (price * quantity).toFixed(2);
  };

  const calculateStopLimitTotal = () => {
    const price = parsePrice(stopLimitPrice || '0');
    const quantity = parseFloat(stopLimitQuantity || '0');
    return (price * quantity).toFixed(2);
  };

  // Input handlers for different order types
  const handleLimitPriceChange = (value: string) => {
    if (/^[\d,.]*$/.test(value)) {
      setLimitPrice(value);
    }
  };

  const handleLimitQuantityChange = (value: string) => {
    if (/^\d*\.?\d*$/.test(value)) {
      setLimitQuantity(value);
    }
  };

  const handleStopTriggerPriceChange = (value: string) => {
    if (/^[\d,.]*$/.test(value)) {
      setStopTriggerPrice(value);
    }
  };

  const handleStopQuantityChange = (value: string) => {
    if (/^\d*\.?\d*$/.test(value)) {
      setStopQuantity(value);
    }
  };

  const handleStopLimitTriggerPriceChange = (value: string) => {
    if (/^[\d,.]*$/.test(value)) {
      setStopLimitTriggerPrice(value);
    }
  };

  const handleStopLimitPriceChange = (value: string) => {
    if (/^[\d,.]*$/.test(value)) {
      setStopLimitPrice(value);
    }
  };

  const handleStopLimitQuantityChange = (value: string) => {
    if (/^\d*\.?\d*$/.test(value)) {
      setStopLimitQuantity(value);
    }
  };

  // Swap handlers
  const handleSwapFromAmountChange = (value: string) => {
    if (/^\d*\.?\d*$/.test(value)) {
      setSwapFromAmount(value);
      if (parseFloat(value) > 0) {
        const fromPrice = getTokenPrice(fromToken);
        const toPrice = getTokenPrice(toToken);
        
        if (fromPrice > 0 && toPrice > 0) {
          const rate = fromPrice / toPrice;
          const toAmount = parseFloat(value) / rate;
          setSwapToAmount(toAmount.toFixed(6));
        } else {
          setSwapToAmount('0');
        }
      } else {
        setSwapToAmount('0');
      }
    }
  };

  const handleSwapToAmountChange = (value: string) => {
    if (/^\d*\.?\d*$/.test(value)) {
      setSwapToAmount(value);
      if (parseFloat(value) > 0) {
        const fromPrice = getTokenPrice(fromToken);
        const toPrice = getTokenPrice(toToken);
        
        if (fromPrice > 0 && toPrice > 0) {
          const rate = fromPrice / toPrice;
          const fromAmount = parseFloat(value) * rate;
          setSwapFromAmount(fromAmount.toFixed(6));
        } else {
          setSwapFromAmount('0');
        }
      } else {
        setSwapFromAmount('0');
      }
    }
  };

  const handleSwapTokens = () => {
    const ethToken = { symbol: 'ETH', name: 'Ethereum', price: 3200.00, gradient: 'from-purple-400 to-purple-600' };
    const cryptoToken = { 
      symbol: crypto.symbol, 
      name: crypto.name, 
      price: parsePrice(crypto.price), 
      gradient: 'from-teal-400 to-cyan-500' 
    };
    
    // Check if swap is supported for this crypto
    const isSupported = crypto.symbol === '1INCH' || crypto.symbol === 'ETH';
    
    if (isSupported) {
      // Swap the tokens
      const newFromToken = toToken;
      const newToToken = fromToken;
      
      setFromToken(newFromToken);
      setToToken(newToToken);
      
      // Swap the amounts
      const tempFromAmount = swapFromAmount;
      setSwapFromAmount(swapToAmount);
      setSwapToAmount(tempFromAmount);
      
      // Update rate based on new token pair
      calculateSwapRate(newFromToken, newToToken);
    }
  };

  // Calculate swap rate between tokens
  const calculateSwapRate = (from: any, to: any) => {
    const fromPrice = getTokenPrice(from);
    const toPrice = getTokenPrice(to);
    
    // Prevent division by zero
    if (fromPrice <= 0 || toPrice <= 0) {
      setSwapRate(0);
      return;
    }
    
    const rate = fromPrice / toPrice;
    setSwapRate(rate);
  };

  const handleFromTokenSelect = (token: any) => {
    setFromToken(token);
    setShowFromTokenSelector(false);
    calculateSwapRate(token, toToken);
    
    // Recalculate amounts if there's an existing amount
    if (swapFromAmount && parseFloat(swapFromAmount) > 0) {
      const fromPrice = getTokenPrice(token);
      const toPrice = getTokenPrice(toToken);
      
      if (fromPrice > 0 && toPrice > 0) {
        const newRate = fromPrice / toPrice;
        const toAmount = parseFloat(swapFromAmount) / newRate;
        setSwapToAmount(toAmount.toFixed(6));
      } else {
        setSwapToAmount('0');
      }
    }
  };

  // Removed handleToTokenSelect as toToken is now fixed to crypto

  const handleOrderSubmit = (orderTypeLabel: string) => {
    // Prevent multiple submissions
    if (!isAmountValid()) return;
    
    // Special validation for swap transactions
    if (orderType === 'swap') {
      // Check if this is a supported swap pair
      const isETHCryptoPair = (fromToken.symbol === 'ETH' && toToken.symbol === crypto.symbol) ||
                              (fromToken.symbol === crypto.symbol && toToken.symbol === 'ETH');
      
      const isSupported = crypto.symbol === '1INCH' || crypto.symbol === 'ETH';
      
      if (!isSupported || !isETHCryptoPair) {
        toast.error('Swap Not Available Yet', {
          description: `Swaps between ${fromToken.symbol} and ${toToken.symbol} will be implemented soon. Currently only ETH ↔ ${crypto.symbol === 'ETH' ? '1INCH' : crypto.symbol} swaps are supported.`,
          duration: 4000,
        });
        return;
      }
    }
    
    // Emit event to adjust toast position
    window.dispatchEvent(new CustomEvent('modal-order-submitted', { 
      detail: { orderType, isMobile } 
    }));

    // Show appropriate success message based on order type
    switch (orderType) {
      case 'market':
        toast.success(`Market Order Placed!`, {
          description: `Successfully purchased ${cryptoAmount} ${crypto.symbol}`,
        });
        break;
      case 'limit':
        toast.success(`Limit Order Placed!`, {
          description: `Order for ${limitQuantity} ${crypto.symbol} at ${limitPrice}`,
        });
        break;
      case 'swap':
        toast.success(`Swap Executed!`, {
          description: `Successfully swapped ${swapFromAmount} ${fromToken.symbol} for ${swapToAmount} ${toToken.symbol}`,
        });
        break;
    }

    // Close modal after a short delay
    const closeTimer = setTimeout(() => {
      onClose();
    }, 1500);
    
    // Store timer ref for potential cleanup
    return () => clearTimeout(closeTimer);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
        style={{
          background: 'rgba(0, 0, 0, 0.8)',
          backdropFilter: 'blur(8px)'
        }}
        onClick={onClose}
      >
        <motion.div
          initial={{ y: '100%', opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: '100%', opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className={`w-full mx-4 mb-4 sm:mb-0 ${
            isMobile 
              ? 'max-w-sm h-[90vh]' 
              : 'max-w-md h-[80vh]'
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          <Card 
            className="border border-border/30 overflow-hidden flex flex-col h-full"
            style={{
              background: isDark 
                ? 'linear-gradient(135deg, #1f2937 0%, #111827 50%, #0f172a 100%)'
                : 'linear-gradient(135deg, #ffffff 0%, #f8fafc 50%, #f1f5f9 100%)',
              backdropFilter: 'blur(20px)'
            }}
          >
            <CardContent className="p-0 flex flex-col h-full">
              {/* Header */}
              <div className={`flex items-center justify-between border-b border-border/30 flex-shrink-0 ${
                isMobile ? 'p-3' : 'p-4'
              }`}>
                <div className="flex items-center gap-3">
                  <div className={`rounded-full overflow-hidden bg-gradient-to-br from-teal-400 to-cyan-500 flex items-center justify-center ${
                    isMobile ? 'w-7 h-7' : 'w-8 h-8'
                  }`}>
                    <img 
                      src={crypto.image} 
                      alt={crypto.name}
                      className={`object-contain ${isMobile ? 'w-4 h-4' : 'w-5 h-5'}`}
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        e.currentTarget.nextElementSibling!.style.display = 'flex';
                      }}
                    />
                    <div className="hidden w-full h-full bg-gradient-to-br from-teal-400 to-cyan-500 rounded-full items-center justify-center">
                      <span className={`text-white font-bold ${isMobile ? 'text-xs' : 'text-xs'}`}>
                        {crypto.symbol.slice(0, 2)}
                      </span>
                    </div>
                  </div>
                  <div>
                    <h2 className={`font-semibold text-foreground ${isMobile ? 'text-sm' : 'text-base'}`}>
                      Buy {crypto.name}
                    </h2>
                    <p className={`text-muted-foreground font-mono ${isMobile ? 'text-xs' : 'text-sm'}`}>
                      {crypto.symbol}
                    </p>
                  </div>
                </div>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                  className="hover:bg-accent/50"
                >
                  <X className={`${isMobile ? 'w-4 h-4' : 'w-5 h-5'}`} />
                </Button>
              </div>

              {/* Price Info */}
              <div className={`text-center border-b border-border/30 flex-shrink-0 ${
                isMobile ? 'p-3' : 'p-4'
              }`}>
                <div className={`font-bold text-foreground mb-2 ${
                  isMobile ? 'text-2xl' : 'text-3xl'
                }`}>
                  ${formatPrice(crypto.price)}
                </div>
                
                <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full font-medium ${
                  isMobile ? 'text-xs' : 'text-sm'
                } ${
                  isPositive 
                    ? 'bg-green-500/10 text-green-600 dark:text-green-400' 
                    : 'bg-red-500/10 text-red-600 dark:text-red-400'
                }`}>
                  {isPositive ? (
                    <TrendingUp className="w-4 h-4" />
                  ) : (
                    <TrendingDown className="w-4 h-4" />
                  )}
                  <span>{formatChange(crypto.change)}% today</span>
                </div>
              </div>

              {/* Order Type Tabs */}
              <div className={`border-b border-border/30 flex-shrink-0 ${
                isMobile ? 'p-3' : 'p-4'
              }`}>
                <div className="flex gap-1 p-1 bg-accent/30 rounded-lg">
                  {orderTypes.map((type) => (
                    <button
                      key={type.id}
                      onClick={() => setOrderType(type.id)}
                      className={`flex-1 font-medium rounded-md transition-all ${
                        isMobile ? 'py-1.5 px-2 text-xs' : 'py-2 px-3 text-sm'
                      } ${
                        orderType === type.id
                          ? 'bg-primary text-primary-foreground'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      {type.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Scrollable Content Area - Universal for all order types */}
              <div className="flex-1 overflow-y-auto scrollbar-default" style={{ minHeight: 0 }}>
                {/* Render different interfaces based on order type */}
                {orderType === 'swap' ? (
                  /* Swap Interface */
                  <div className={`space-y-4 ${isMobile ? 'p-3 pb-6' : 'p-4 pb-6'}`}>
                    {/* Swap Limitation Alert */}
                    <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
                      <div className={`text-blue-600 dark:text-blue-400 ${
                        isMobile ? 'text-xs' : 'text-sm'
                      }`}>
                        <div className="flex items-center gap-2 mb-1">
                          <div className="w-4 h-4 rounded-full bg-blue-500/20 flex items-center justify-center">
                            <span className="text-blue-600 dark:text-blue-400 text-xs">ℹ</span>
                          </div>
                          <span className="font-medium">Swap Limitation</span>
                        </div>
                        <p className="text-xs leading-relaxed">
                          Currently you can only swap between <strong>ETH</strong> and <strong>1INCH</strong>. 
                          Other swap pairs will be available in upcoming versions.
                        </p>
                      </div>
                    </div>

                    {/* From Token Section */}
                    <div className={`space-y-3 ${isMobile ? 'space-y-2' : ''}`}>
                      <div className="flex items-center justify-between">
                        <label className={`font-semibold text-foreground ${
                          isMobile ? 'text-xs' : 'text-sm'
                        }`}>
                          From
                        </label>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-muted-foreground hover:text-foreground"
                        >
                          <Settings className="w-3 h-3 mr-1" />
                          <span className="text-xs">Slippage: {slippage}%</span>
                        </Button>
                      </div>
                      
                      <div className="bg-card/50 border border-border/30 rounded-lg p-3">
                        <div className="flex items-center justify-between mb-2">
                          <div className="relative">
                            <button
                              onClick={() => setShowFromTokenSelector(!showFromTokenSelector)}
                              className="flex items-center gap-2 hover:bg-accent/30 rounded-lg p-1 -m-1 transition-colors"
                            >
                              <div className={`w-6 h-6 rounded-full bg-gradient-to-br ${fromToken.gradient} flex items-center justify-center`}>
                                <span className="text-white text-xs font-bold">{fromToken.symbol.slice(0, 2)}</span>
                              </div>
                              <span className="font-medium text-foreground">{fromToken.symbol}</span>
                              <ChevronDown className="w-3 h-3 text-muted-foreground" />
                            </button>

                            {/* From Token Selector Dropdown */}
                            {showFromTokenSelector && (
                              <div className="absolute top-full left-0 mt-1 bg-card border border-border/30 rounded-lg shadow-lg z-50 min-w-[180px]">
                                {availableTokens.map((token) => {
                                  const isSupported = token.symbol === 'ETH' || token.symbol === crypto.symbol;
                                  return (
                                    <button
                                      key={token.symbol}
                                      onClick={() => handleFromTokenSelect(token)}
                                      className="w-full flex items-center gap-3 p-3 hover:bg-accent/30 transition-colors first:rounded-t-lg last:rounded-b-lg relative"
                                    >
                                      <div className={`w-6 h-6 rounded-full bg-gradient-to-br ${token.gradient} flex items-center justify-center`}>
                                        <span className="text-white text-xs font-bold">{token.symbol.slice(0, 2)}</span>
                                      </div>
                                      <div className="text-left flex-1">
                                        <div className="font-medium text-foreground flex items-center gap-1">
                                          {token.symbol}
                                          {!isSupported && (
                                            <span className="text-xs bg-orange-500/10 text-orange-600 dark:text-orange-400 px-1 py-0.5 rounded">Soon</span>
                                          )}
                                        </div>
                                        <div className="text-xs text-muted-foreground">{token.name}</div>
                                      </div>
                                      <div className="text-xs text-muted-foreground">
                                        ${getTokenPrice(token).toFixed(2)}
                                      </div>
                                    </button>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                          <span className="text-xs text-muted-foreground">Balance: 1,245.67</span>
                        </div>
                        <input
                          type="text"
                          value={swapFromAmount}
                          onChange={(e) => handleSwapFromAmountChange(e.target.value)}
                          placeholder="0.0"
                          className={`w-full bg-transparent font-bold text-foreground placeholder-muted-foreground focus:outline-none ${
                            isMobile ? 'text-xl' : 'text-2xl'
                          }`}
                        />
                        <div className="text-xs text-muted-foreground mt-1">
                          ≈ ${((parseFloat(swapFromAmount) || 0) * getTokenPrice(fromToken)).toFixed(2)}
                        </div>
                      </div>
                    </div>

                    {/* Swap Direction Button */}
                    <div className="flex justify-center">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleSwapTokens}
                        className="rounded-full w-10 h-10 p-0 border-2 border-border/30 hover:border-border/60 bg-background hover:bg-accent/50"
                      >
                        <ArrowLeftRight className="w-4 h-4 rotate-90" />
                      </Button>
                    </div>

                    {/* To Token Section */}
                    <div className={`space-y-3 ${isMobile ? 'space-y-2' : ''}`}>
                      <label className={`font-semibold text-foreground ${
                        isMobile ? 'text-xs' : 'text-sm'
                      }`}>
                        To
                      </label>
                      
                      <div className="bg-card/50 border border-border/30 rounded-lg p-3">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <div className={`w-6 h-6 rounded-full bg-gradient-to-br ${toToken.gradient || 'from-teal-400 to-cyan-500'} flex items-center justify-center`}>
                              <span className="text-white text-xs font-bold">{toToken.symbol.slice(0, 2)}</span>
                            </div>
                            <div className="flex flex-col">
                              <span className="font-medium text-foreground">{toToken.symbol}</span>
                              <span className="text-xs text-muted-foreground">{toToken.name}</span>
                            </div>
                          </div>
                          <span className="text-xs text-muted-foreground">Balance: 0.00</span>
                        </div>
                        <input
                          type="text"
                          value={swapToAmount}
                          onChange={(e) => handleSwapToAmountChange(e.target.value)}
                          placeholder="0.0"
                          className={`w-full bg-transparent font-bold text-foreground placeholder-muted-foreground focus:outline-none ${
                            isMobile ? 'text-xl' : 'text-2xl'
                          }`}
                        />
                        <div className="text-xs text-muted-foreground mt-1">
                          ≈ ${((parseFloat(swapToAmount) || 0) * getTokenPrice(toToken)).toFixed(2)}
                        </div>
                      </div>
                    </div>

                    {/* Swap Rate Display */}
                    <div className="bg-accent/20 rounded-lg p-3">
                      <div className={`flex justify-between items-center ${
                        isMobile ? 'text-xs' : 'text-sm'
                      }`}>
                        <span className="text-muted-foreground">Exchange Rate:</span>
                        <div className="flex items-center gap-1">
                          <span className="font-medium text-foreground">
                            1 {fromToken.symbol} = {(getTokenPrice(toToken) / getTokenPrice(fromToken) || 0).toFixed(6)} {toToken.symbol}
                          </span>
                          <Button variant="ghost" size="sm" className="p-0 h-auto">
                            <RefreshCw className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* Swap Details */}
                    <div className={`bg-accent/20 rounded-lg p-3 space-y-2`}>
                      {/* Availability Warning */}
                      {!((fromToken.symbol === 'ETH' && toToken.symbol === crypto.symbol) ||
                         (fromToken.symbol === crypto.symbol && toToken.symbol === 'ETH')) && (
                        <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-2 mb-2">
                          <div className={`text-orange-600 dark:text-orange-400 ${
                            isMobile ? 'text-xs' : 'text-sm'
                          }`}>
                            ⚠️ This swap pair will be available soon. Currently only ETH ↔ {crypto.symbol} swaps are supported.
                          </div>
                        </div>
                      )}
                      
                      <div className={`flex justify-between ${
                        isMobile ? 'text-xs' : 'text-sm'
                      }`}>
                        <span className="text-muted-foreground">Price Impact:</span>
                        <span className="font-medium text-green-600">{'<0.01%'}</span>
                      </div>
                      <div className={`flex justify-between ${
                        isMobile ? 'text-xs' : 'text-sm'
                      }`}>
                        <span className="text-muted-foreground">Max Slippage:</span>
                        <span className="font-medium text-foreground">{slippage}%</span>
                      </div>
                      <div className={`flex justify-between ${
                        isMobile ? 'text-xs' : 'text-sm'
                      }`}>
                        <span className="text-muted-foreground">Network Fee:</span>
                        <span className="font-medium text-foreground">≈ $2.50</span>
                      </div>
                      <div className={`flex justify-between ${
                        isMobile ? 'text-xs' : 'text-sm'
                      }`}>
                        <span className="text-muted-foreground">Route:</span>
                        <span className="font-medium text-foreground text-right">
                          {fromToken.symbol} → {toToken.symbol}
                          <br />
                          <span className="text-xs text-muted-foreground">Via 1inch</span>
                        </span>
                      </div>
                    </div>

                    {/* Swap Button */}
                    <Button
                      className={`w-full font-semibold ${
                        isMobile ? 'py-2.5 text-base' : 'py-3 text-lg'
                      }`}
                      disabled={
                        !isAmountValid() || 
                        !((fromToken.symbol === 'ETH' && toToken.symbol === crypto.symbol) ||
                          (fromToken.symbol === crypto.symbol && toToken.symbol === 'ETH')) ||
                        !(crypto.symbol === '1INCH' || crypto.symbol === 'ETH')
                      }
                      onClick={() => handleOrderSubmit('swap')}
                      style={{
                        background: ((fromToken.symbol === 'ETH' && toToken.symbol === crypto.symbol) ||
                                   (fromToken.symbol === crypto.symbol && toToken.symbol === 'ETH')) && 
                                   (crypto.symbol === '1INCH' || crypto.symbol === 'ETH') && isAmountValid()
                          ? isDark 
                            ? 'var(--gradient-primary)'
                            : 'linear-gradient(135deg, #3b82f6, #1d4ed8)'
                          : 'var(--muted)',
                        color: ((fromToken.symbol === 'ETH' && toToken.symbol === crypto.symbol) ||
                               (fromToken.symbol === crypto.symbol && toToken.symbol === 'ETH')) && 
                               (crypto.symbol === '1INCH' || crypto.symbol === 'ETH') && isAmountValid()
                          ? 'white'
                          : 'var(--muted-foreground)'
                      }}
                    >
                      {((fromToken.symbol === 'ETH' && toToken.symbol === crypto.symbol) ||
                        (fromToken.symbol === crypto.symbol && toToken.symbol === 'ETH')) &&
                        (crypto.symbol === '1INCH' || crypto.symbol === 'ETH')
                        ? `Swap ${fromToken.symbol} for ${toToken.symbol}`
                        : `${fromToken.symbol} ↔ ${toToken.symbol} Coming Soon`
                      }
                    </Button>

                    {/* Disclaimer for Swap */}
                    <p className={`text-muted-foreground text-center ${
                      isMobile ? 'text-xs' : 'text-xs'
                    }`}>
                      Swaps are executed through 1inch aggregator for best prices. 
                      This is a demo interface.
                    </p>
                  </div>
                ) : orderType === 'limit' ? (
                  /* Limit Order Interface */
                  <div className={`space-y-4 ${isMobile ? 'p-3 pb-6' : 'p-4 pb-6'}`}>
                    {/* Quantity Section */}
                    <div className={`space-y-3 ${isMobile ? 'space-y-2' : ''}`}>
                      <label className={`font-semibold text-foreground ${
                        isMobile ? 'text-xs' : 'text-sm'
                      }`}>
                        Number of Actions
                      </label>
                      <div className="relative">
                        <div className="flex items-center bg-card/50 border border-border/30 rounded-lg">
                          <div className={`flex-1 flex items-center ${
                            isMobile ? 'px-3 py-2' : 'px-4 py-3'
                          }`}>
                            <input
                              type="text"
                              value={limitQuantity}
                              onChange={(e) => handleLimitQuantityChange(e.target.value)}
                              placeholder="0"
                              className={`flex-1 bg-transparent font-bold text-foreground placeholder-muted-foreground focus:outline-none text-center ${
                                isMobile ? 'text-xl' : 'text-2xl'
                              }`}
                            />
                          </div>
                        </div>
                        <div className={`text-muted-foreground mt-2 text-center ${
                          isMobile ? 'text-xs' : 'text-xs'
                        }`}>
                          -{currency === 'EUR' ? '€' : '$'}{calculateLimitTotal()}
                        </div>
                      </div>
                    </div>

                    {/* Description */}
                    <div className="bg-accent/20 rounded-lg p-3">
                      <p className={`text-muted-foreground text-center ${
                        isMobile ? 'text-xs' : 'text-sm'
                      }`}>
                        Set the maximum price per share you're willing to pay.
                      </p>
                    </div>

                    {/* Price Section */}
                    <div className={`space-y-3 ${isMobile ? 'space-y-2' : ''}`}>
                      <label className={`font-semibold text-foreground ${
                        isMobile ? 'text-xs' : 'text-sm'
                      }`}>
                        Price
                      </label>
                      <div className="relative">
                        <div className="flex items-center bg-card/50 border border-border/30 rounded-lg">
                          <div className={`flex-1 flex items-center ${
                            isMobile ? 'px-3 py-2' : 'px-4 py-3'
                          }`}>
                            <input
                              type="text"
                              value={limitPrice}
                              onChange={(e) => handleLimitPriceChange(e.target.value)}
                              placeholder="0"
                              className={`flex-1 bg-transparent font-bold text-foreground placeholder-muted-foreground focus:outline-none ${
                                isMobile ? 'text-xl' : 'text-2xl'
                              }`}
                            />
                          </div>
                        </div>
                        <div className={`text-muted-foreground mt-1 ${
                          isMobile ? 'text-xs' : 'text-xs'
                        }`}>
                          -0.10
                        </div>
                      </div>
                    </div>

                    {/* Order Summary for Limit */}
                    <div className={`bg-accent/20 rounded-lg p-3 ${
                      isMobile ? 'space-y-1.5' : 'space-y-2'
                    }`}>
                      <div className={`flex justify-between ${
                        isMobile ? 'text-xs' : 'text-sm'
                      }`}>
                        <span className="text-muted-foreground">Order type:</span>
                        <span className="font-medium text-foreground capitalize">{orderType}</span>
                      </div>
                      <div className={`flex justify-between ${
                        isMobile ? 'text-xs' : 'text-sm'
                      }`}>
                        <span className="text-muted-foreground">Quantity:</span>
                        <span className="font-medium text-foreground">{limitQuantity} {crypto.symbol}</span>
                      </div>
                      <div className={`flex justify-between ${
                        isMobile ? 'text-xs' : 'text-sm'
                      }`}>
                        <span className="text-muted-foreground">Limit price:</span>
                        <span className="font-medium text-foreground">${limitPrice}</span>
                      </div>
                      <div className={`flex justify-between ${
                        isMobile ? 'text-xs' : 'text-sm'
                      }`}>
                        <span className="text-muted-foreground">Estimated fees:</span>
                        <span className="font-medium text-foreground">{currency === 'EUR' ? '€' : '$'}0.50</span>
                      </div>
                      <div className={`flex justify-between border-t border-border/30 pt-2 ${
                        isMobile ? 'text-xs' : 'text-sm'
                      }`}>
                        <span className="text-muted-foreground">Total:</span>
                        <span className="font-bold text-foreground">
                          {currency === 'EUR' ? '€' : '$'}{(parseFloat(calculateLimitTotal()) + 0.50).toFixed(2)}
                        </span>
                      </div>
                    </div>

                    {/* Buy Button for Limit */}
                    <Button
                      className={`w-full font-semibold ${
                        isMobile ? 'py-2.5 text-base' : 'py-3 text-lg'
                      }`}
                      disabled={!isAmountValid()}
                      onClick={() => handleOrderSubmit('limit')}
                      style={{
                        background: isDark 
                          ? 'var(--gradient-primary)'
                          : 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
                        color: 'white'
                      }}
                    >
                      Place Limit Order
                    </Button>

                    {/* Disclaimer for Limit */}
                    <p className={`text-muted-foreground text-center ${
                      isMobile ? 'text-xs' : 'text-xs'
                    }`}>
                      Limit orders will be executed only when the market price reaches your specified price. 
                      This is a demo interface.
                    </p>
                  </div>
                ) : orderType === 'stop' ? (
                  /* Stop Order Interface */
                  <div className={`space-y-4 ${isMobile ? 'p-3 pb-6' : 'p-4 pb-6'}`}>
                    {/* Quantity Section */}
                    <div className={`space-y-3 ${isMobile ? 'space-y-2' : ''}`}>
                      <label className={`font-semibold text-foreground ${
                        isMobile ? 'text-xs' : 'text-sm'
                      }`}>
                        Number of Actions
                      </label>
                      <div className="relative">
                        <div className="flex items-center bg-card/50 border border-border/30 rounded-lg">
                          <div className={`flex-1 flex items-center ${
                            isMobile ? 'px-3 py-2' : 'px-4 py-3'
                          }`}>
                            <input
                              type="text"
                              value={stopQuantity}
                              onChange={(e) => handleStopQuantityChange(e.target.value)}
                              placeholder="0"
                              className={`flex-1 bg-transparent font-bold text-foreground placeholder-muted-foreground focus:outline-none text-center ${
                                isMobile ? 'text-xl' : 'text-2xl'
                              }`}
                            />
                          </div>
                        </div>
                        <div className={`text-muted-foreground mt-2 text-center ${
                          isMobile ? 'text-xs' : 'text-xs'
                        }`}>
                          -{currency === 'EUR' ? '€' : '$'}{calculateStopTotal()}
                        </div>
                      </div>
                    </div>

                    {/* Description */}
                    <div className="bg-accent/20 rounded-lg p-3">
                      <p className={`text-muted-foreground text-center ${
                        isMobile ? 'text-xs' : 'text-sm'
                      }`}>
                        Triggers a Market order when a trigger price is reached.
                      </p>
                    </div>

                    {/* Trigger Price Section */}
                    <div className={`space-y-3 ${isMobile ? 'space-y-2' : ''}`}>
                      <label className={`font-semibold text-foreground ${
                        isMobile ? 'text-xs' : 'text-sm'
                      }`}>
                        Trigger Price
                      </label>
                      <div className="relative">
                        <div className="flex items-center bg-card/50 border border-border/30 rounded-lg">
                          <div className={`flex-1 flex items-center ${
                            isMobile ? 'px-3 py-2' : 'px-4 py-3'
                          }`}>
                            <input
                              type="text"
                              value={stopTriggerPrice}
                              onChange={(e) => handleStopTriggerPriceChange(e.target.value)}
                              placeholder="0"
                              className={`flex-1 bg-transparent font-bold text-foreground placeholder-muted-foreground focus:outline-none ${
                                isMobile ? 'text-xl' : 'text-2xl'
                              }`}
                            />
                          </div>
                        </div>
                        <div className={`text-muted-foreground mt-1 ${
                          isMobile ? 'text-xs' : 'text-xs'
                        }`}>
                          Activation price
                        </div>
                      </div>
                    </div>

                    {/* Order Summary for Stop */}
                    <div className={`bg-accent/20 rounded-lg p-3 ${
                      isMobile ? 'space-y-1.5' : 'space-y-2'
                    }`}>
                      <div className={`flex justify-between ${
                        isMobile ? 'text-xs' : 'text-sm'
                      }`}>
                        <span className="text-muted-foreground">Order type:</span>
                        <span className="font-medium text-foreground capitalize">{orderType}</span>
                      </div>
                      <div className={`flex justify-between ${
                        isMobile ? 'text-xs' : 'text-sm'
                      }`}>
                        <span className="text-muted-foreground">Quantity:</span>
                        <span className="font-medium text-foreground">{stopQuantity} {crypto.symbol}</span>
                      </div>
                      <div className={`flex justify-between ${
                        isMobile ? 'text-xs' : 'text-sm'
                      }`}>
                        <span className="text-muted-foreground">Trigger price:</span>
                        <span className="font-medium text-foreground">${stopTriggerPrice}</span>
                      </div>
                      <div className={`flex justify-between ${
                        isMobile ? 'text-xs' : 'text-sm'
                      }`}>
                        <span className="text-muted-foreground">Estimated fees:</span>
                        <span className="font-medium text-foreground">{currency === 'EUR' ? '€' : '$'}0.50</span>
                      </div>
                      <div className={`flex justify-between border-t border-border/30 pt-2 ${
                        isMobile ? 'text-xs' : 'text-sm'
                      }`}>
                        <span className="text-muted-foreground">Est. Total:</span>
                        <span className="font-bold text-foreground">
                          {currency === 'EUR' ? '€' : '$'}{(parseFloat(calculateStopTotal()) + 0.50).toFixed(2)}
                        </span>
                      </div>
                    </div>

                    {/* Buy Button for Stop */}
                    <Button
                      className={`w-full font-semibold ${
                        isMobile ? 'py-2.5 text-base' : 'py-3 text-lg'
                      }`}
                      disabled={!isAmountValid()}
                      onClick={() => handleOrderSubmit('stop')}
                      style={{
                        background: isDark 
                          ? 'var(--gradient-primary)'
                          : 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
                        color: 'white'
                      }}
                    >
                      Place Stop Order
                    </Button>

                    {/* Disclaimer for Stop */}
                    <p className={`text-muted-foreground text-center ${
                      isMobile ? 'text-xs' : 'text-xs'
                    }`}>
                      Stop orders will trigger a market order when the trigger price is reached. 
                      This is a demo interface.
                    </p>
                  </div>
                ) : orderType === 'stop-limit' ? (
                  /* Stop Limit Order Interface - Optimized for Mobile */
                  <div className={`${isMobile ? 'space-y-2 p-3 pb-8' : 'space-y-3 p-4 pb-8'}`}>
                    {/* Quantity Section */}
                    <div className={`${isMobile ? 'space-y-1' : 'space-y-2'}`}>
                      <label className={`font-semibold text-foreground ${
                        isMobile ? 'text-xs' : 'text-sm'
                      }`}>
                        Number of Actions
                      </label>
                      <div className="relative">
                        <div className="flex items-center bg-card/50 border border-border/30 rounded-lg">
                          <div className={`flex-1 flex items-center ${
                            isMobile ? 'px-2 py-1.5' : 'px-3 py-2'
                          }`}>
                            <input
                              type="text"
                              value={stopLimitQuantity}
                              onChange={(e) => handleStopLimitQuantityChange(e.target.value)}
                              placeholder="0"
                              className={`flex-1 bg-transparent font-bold text-foreground placeholder-muted-foreground focus:outline-none text-center ${
                                isMobile ? 'text-base' : 'text-lg'
                              }`}
                            />
                          </div>
                        </div>
                        <div className={`text-muted-foreground mt-0.5 text-center ${
                          isMobile ? 'text-xs' : 'text-xs'
                        }`}>
                          -{currency === 'EUR' ? '€' : '$'}{calculateStopLimitTotal()}
                        </div>
                      </div>
                    </div>

                    {/* Description - Compact on mobile */}
                    <div className={`bg-accent/20 rounded-lg ${isMobile ? 'p-2' : 'p-3'}`}>
                      <p className={`text-muted-foreground text-center ${
                        isMobile ? 'text-xs leading-tight' : 'text-sm'
                      }`}>
                        Stop + Limit: activation price + max/min limit
                      </p>
                    </div>

                    {/* Price Fields - Compact layout */}
                    <div className={`${
                      isMobile ? 'space-y-2' : 'space-y-3'
                    }`}>
                      {/* Trigger Price Section */}
                      <div className={`${isMobile ? 'space-y-1' : 'space-y-2'}`}>
                        <label className={`font-semibold text-foreground ${
                          isMobile ? 'text-xs' : 'text-sm'
                        }`}>
                          Trigger Price
                        </label>
                        <div className="relative">
                          <div className="flex items-center bg-card/50 border border-border/30 rounded-lg">
                            <div className={`flex-1 flex items-center ${
                              isMobile ? 'px-2 py-1.5' : 'px-3 py-2'
                            }`}>
                              <input
                                type="text"
                                value={stopLimitTriggerPrice}
                                onChange={(e) => handleStopLimitTriggerPriceChange(e.target.value)}
                                placeholder="0"
                                className={`flex-1 bg-transparent font-bold text-foreground placeholder-muted-foreground focus:outline-none ${
                                  isMobile ? 'text-base' : 'text-lg'
                                }`}
                              />
                            </div>
                          </div>
                          <div className={`text-muted-foreground mt-0.5 ${
                            isMobile ? 'text-xs' : 'text-xs'
                          }`}>
                            Activation
                          </div>
                        </div>
                      </div>

                      {/* Limit Price Section */}
                      <div className={`${isMobile ? 'space-y-1' : 'space-y-2'}`}>
                        <label className={`font-semibold text-foreground ${
                          isMobile ? 'text-xs' : 'text-sm'
                        }`}>
                          Limit Price
                        </label>
                        <div className="relative">
                          <div className="flex items-center bg-card/50 border border-border/30 rounded-lg">
                            <div className={`flex-1 flex items-center ${
                              isMobile ? 'px-2 py-1.5' : 'px-3 py-2'
                            }`}>
                              <input
                                type="text"
                                value={stopLimitPrice}
                                onChange={(e) => handleStopLimitPriceChange(e.target.value)}
                                placeholder="0"
                                className={`flex-1 bg-transparent font-bold text-foreground placeholder-muted-foreground focus:outline-none ${
                                  isMobile ? 'text-base' : 'text-lg'
                                }`}
                              />
                            </div>
                          </div>
                          <div className={`text-muted-foreground mt-0.5 ${
                            isMobile ? 'text-xs' : 'text-xs'
                          }`}>
                            Max/min
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Order Summary for Stop Limit - Compact */}
                    <div className={`bg-accent/20 rounded-lg ${
                      isMobile ? 'p-2 space-y-0.5' : 'p-3 space-y-1'
                    }`}>
                      <div className={`flex justify-between ${
                        isMobile ? 'text-xs' : 'text-sm'
                      }`}>
                        <span className="text-muted-foreground">Type:</span>
                        <span className="font-medium text-foreground capitalize">{orderType}</span>
                      </div>
                      <div className={`flex justify-between ${
                        isMobile ? 'text-xs' : 'text-sm'
                      }`}>
                        <span className="text-muted-foreground">Quantity:</span>
                        <span className="font-medium text-foreground">{stopLimitQuantity} {crypto.symbol}</span>
                      </div>
                      <div className={`flex justify-between ${
                        isMobile ? 'text-xs' : 'text-sm'
                      }`}>
                        <span className="text-muted-foreground">Trigger:</span>
                        <span className="font-medium text-foreground">${stopLimitTriggerPrice}</span>
                      </div>
                      <div className={`flex justify-between ${
                        isMobile ? 'text-xs' : 'text-sm'
                      }`}>
                        <span className="text-muted-foreground">Limit:</span>
                        <span className="font-medium text-foreground">${stopLimitPrice}</span>
                      </div>
                      <div className={`flex justify-between ${
                        isMobile ? 'text-xs' : 'text-sm'
                      }`}>
                        <span className="text-muted-foreground">Fees:</span>
                        <span className="font-medium text-foreground">{currency === 'EUR' ? '€' : '$'}0.50</span>
                      </div>
                      <div className={`flex justify-between border-t border-border/30 pt-1 ${
                        isMobile ? 'text-xs' : 'text-sm'
                      }`}>
                        <span className="text-muted-foreground">Est. Total:</span>
                        <span className="font-bold text-foreground">
                          {currency === 'EUR' ? '€' : '$'}{(parseFloat(calculateStopLimitTotal()) + 0.50).toFixed(2)}
                        </span>
                      </div>
                    </div>

                    {/* Buy Button for Stop Limit */}
                    <Button
                      className={`w-full font-semibold ${
                        isMobile ? 'py-2.5 text-sm' : 'py-3 text-lg'
                      }`}
                      disabled={!isAmountValid()}
                      onClick={() => handleOrderSubmit('stop-limit')}
                      style={{
                        background: isDark 
                          ? 'var(--gradient-primary)'
                          : 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
                        color: 'white'
                      }}
                    >
                      Place Stop Limit Order
                    </Button>

                    {/* Disclaimer for Stop Limit - Compact */}
                    <p className={`text-muted-foreground text-center ${
                      isMobile ? 'text-xs' : 'text-xs'
                    }`}>
                      {isMobile 
                        ? 'Stop limit combines both functionalities. Demo interface.'
                        : 'Stop limit orders combine stop and limit functionality for precise control. This is a demo interface.'
                      }
                    </p>
                  </div>
                ) : (
                  /* Regular Market Order Interface */
                  <div className={`space-y-4 ${isMobile ? 'p-3 pb-6' : 'p-4 pb-6'}`}>
                    {/* Input Controls Header */}
                    <div className={`space-y-3 ${isMobile ? 'space-y-2' : ''}`}>
                      <div className="flex items-center justify-between">
                        <label className={`font-semibold text-foreground ${
                          isMobile ? 'text-xs' : 'text-sm'
                        }`}>
                          {inputMode === 'fiat' ? 'Amount to Spend' : 'Quantity to Buy'}
                        </label>
                        
                        {/* Input Mode Toggle */}
                        <div className="flex items-center gap-2">
                          <span className={`text-muted-foreground ${
                            isMobile ? 'text-xs' : 'text-xs'
                          }`}>
                            {isMobile ? 'Mode:' : 'Input mode:'}
                          </span>
                          <button
                            onClick={toggleInputMode}
                            className={`flex items-center gap-2 rounded-lg font-medium transition-all ${
                              isMobile ? 'px-2 py-1 text-xs' : 'px-3 py-1.5 text-xs'
                            } ${
                              inputMode === 'fiat'
                                ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20'
                                : 'bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20'
                            }`}
                          >
                            <ArrowLeftRight className="w-3 h-3" />
                            {inputMode === 'fiat' ? 'Fiat' : 'Crypto'}
                          </button>
                        </div>
                      </div>

                      {/* Currency Selector - Only shown in fiat mode */}
                      {inputMode === 'fiat' && (
                        <div className="flex items-center justify-between">
                          <span className={`text-muted-foreground ${
                            isMobile ? 'text-xs' : 'text-xs'
                          }`}>Currency:</span>
                          <div className="flex items-center gap-1 bg-accent/30 rounded-lg p-1">
                            <button
                              onClick={() => setCurrency('EUR')}
                              className={`flex items-center gap-1 rounded-md font-medium transition-all ${
                                isMobile ? 'px-1.5 py-0.5 text-xs' : 'px-2 py-1 text-xs'
                              } ${
                                currency === 'EUR'
                                  ? 'bg-accent text-foreground'
                                  : 'text-muted-foreground hover:text-foreground'
                              }`}
                            >
                              <Euro className="w-3 h-3" />
                              EUR
                            </button>
                            <button
                              onClick={() => setCurrency('USD')}
                              className={`flex items-center gap-1 rounded-md font-medium transition-all ${
                                isMobile ? 'px-1.5 py-0.5 text-xs' : 'px-2 py-1 text-xs'
                              } ${
                                currency === 'USD'
                                  ? 'bg-accent text-foreground'
                                  : 'text-muted-foreground hover:text-foreground'
                              }`}
                            >
                              <DollarSign className="w-3 h-3" />
                              USD
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {/* Amount Input Field */}
                    <div className="relative">
                      <div className="flex items-center bg-card/50 border border-border/30 rounded-lg">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            if (inputMode === 'fiat') {
                              incrementFiatAmount(-10);
                            } else {
                              incrementCryptoAmount(-10);
                            }
                          }}
                          className="p-2 hover:bg-accent/50"
                          disabled={!isAmountValid()}
                        >
                          <Minus className="w-4 h-4" />
                        </Button>
                        
                        <div className="flex-1 flex items-center px-2">
                          {inputMode === 'fiat' ? (
                            currency === 'EUR' ? (
                              <Euro className="w-4 h-4 text-muted-foreground mr-2" />
                            ) : (
                              <DollarSign className="w-4 h-4 text-muted-foreground mr-2" />
                            )
                          ) : (
                            <div className="w-4 h-4 rounded-full overflow-hidden bg-gradient-to-br from-teal-400 to-cyan-500 flex items-center justify-center mr-2">
                              <img 
                                src={crypto.image} 
                                alt={crypto.name}
                                className="w-3 h-3 object-contain"
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none';
                                  e.currentTarget.nextElementSibling!.style.display = 'flex';
                                }}
                              />
                              <div className="hidden w-full h-full bg-gradient-to-br from-teal-400 to-cyan-500 rounded-full items-center justify-center">
                                <span className="text-white font-bold text-xs">
                                  {crypto.symbol.slice(0, 1)}
                                </span>
                              </div>
                            </div>
                          )}
                          <input
                            type="text"
                            value={inputMode === 'fiat' ? amount : cryptoAmount}
                            onChange={(e) => {
                              if (inputMode === 'fiat') {
                                handleFiatAmountChange(e.target.value);
                              } else {
                                handleCryptoAmountChange(e.target.value);
                              }
                            }}
                            placeholder="0"
                            className={`flex-1 bg-transparent font-bold text-foreground placeholder-muted-foreground focus:outline-none ${
                              isMobile ? 'text-xl' : 'text-2xl'
                            }`}
                          />
                        </div>
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            if (inputMode === 'fiat') {
                              incrementFiatAmount(10);
                            } else {
                              incrementCryptoAmount(10);
                            }
                          }}
                          className="p-2 hover:bg-accent/50"
                        >
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>
                      
                      <div className={`text-muted-foreground mt-1 text-center ${
                        isMobile ? 'text-xs' : 'text-xs'
                      }`}>
                        {inputMode === 'fiat' ? (
                          <>≈ {cryptoAmount} {crypto.symbol}</>
                        ) : (
                          <>≈ {currency === 'EUR' ? '€' : '$'}{amount}</>
                        )}
                      </div>
                    </div>

                    {/* Quick Amount Buttons */}
                    <div className="space-y-2">
                      <span className={`text-muted-foreground ${
                        isMobile ? 'text-xs' : 'text-xs'
                      }`}>Quick amounts:</span>
                      <div className="grid grid-cols-4 gap-2">
                        {inputMode === 'fiat' ? (
                          [10, 25, 50, 100].map((quickAmount) => (
                            <Button
                              key={quickAmount}
                              variant="outline"
                              size="sm"
                              onClick={() => setAmount(quickAmount.toString())}
                              className={`hover:bg-accent/50 ${
                                isMobile ? 'text-xs' : 'text-xs'
                              }`}
                            >
                              {currency === 'EUR' ? '€' : '$'}{quickAmount}
                            </Button>
                          ))
                        ) : (
                          [10, 25, 50, 100].map((fiatAmount) => {
                            const cryptoAmountCalc = (fiatAmount / cryptoPrice).toFixed(4);
                            return (
                              <Button
                                key={fiatAmount}
                                variant="outline"
                                size="sm"
                                onClick={() => setCryptoAmount(cryptoAmountCalc)}
                                className={`hover:bg-accent/50 ${
                                  isMobile ? 'text-xs' : 'text-xs'
                                }`}
                              >
                                {cryptoAmountCalc}
                              </Button>
                            );
                          })
                        )}
                      </div>
                    </div>

                    {/* Order Summary */}
                    <div className={`bg-accent/20 rounded-lg p-3 ${
                      isMobile ? 'space-y-1.5' : 'space-y-2'
                    }`}>
                      <div className={`flex justify-between ${
                        isMobile ? 'text-xs' : 'text-sm'
                      }`}>
                        <span className="text-muted-foreground">Order type:</span>
                        <span className="font-medium text-foreground capitalize">{orderType}</span>
                      </div>
                      <div className={`flex justify-between ${
                        isMobile ? 'text-xs' : 'text-sm'
                      }`}>
                        <span className="text-muted-foreground">Quantity:</span>
                        <span className="font-medium text-foreground">{cryptoAmount} {crypto.symbol}</span>
                      </div>
                      <div className={`flex justify-between ${
                        isMobile ? 'text-xs' : 'text-sm'
                      }`}>
                        <span className="text-muted-foreground">Estimated fees:</span>
                        <span className="font-medium text-foreground">{currency === 'EUR' ? '€' : '$'}0.50</span>
                      </div>
                      <div className={`flex justify-between border-t border-border/30 pt-2 ${
                        isMobile ? 'text-xs' : 'text-sm'
                      }`}>
                        <span className="text-muted-foreground">Total:</span>
                        <span className="font-bold text-foreground">
                          {currency === 'EUR' ? '€' : '$'}{(parseFloat(amount) + 0.50).toFixed(2)}
                        </span>
                      </div>
                    </div>

                    {/* Buy Button */}
                    <Button
                      className={`w-full font-semibold ${
                        isMobile ? 'py-2.5 text-base' : 'py-3 text-lg'
                      }`}
                      disabled={!isAmountValid()}
                      onClick={() => handleOrderSubmit('market')}
                      style={{
                        background: isDark 
                          ? 'var(--gradient-primary)'
                          : 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
                        color: 'white'
                      }}
                    >
                      Buy {cryptoAmount} {crypto.symbol}
                    </Button>

                    {/* Disclaimer */}
                    <p className={`text-muted-foreground text-center ${
                      isMobile ? 'text-xs' : 'text-xs'
                    }`}>
                      Orders may be executed at market prices, which can differ from the displayed price. 
                      This is a demo interface.
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}