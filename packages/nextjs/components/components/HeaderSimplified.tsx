import { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { Button } from "./ui/button";
import { ThemeToggle } from "./ui/theme-toggle";
import { useIsMobile } from "./ui/use-mobile";
import { Wallet, Copy, LogOut, Check, Menu, X, Home, PieChart, TrendingUp, Users, User } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";

interface HeaderProps {
  activeTab: 'home' | 'about' | 'rebalance' | 'top-performers';
  onTabChange: (tab: 'home' | 'about' | 'rebalance' | 'top-performers') => void;
  activeWalletTab?: 'home' | 'portfolio' | 'trade' | 'social' | 'profile' | 'create-portfolio';
  onWalletTabChange?: (tab: 'home' | 'portfolio' | 'trade' | 'social' | 'profile' | 'create-portfolio') => void;
  isWalletConnected?: boolean;
  showWalletNavigation?: boolean;
  onLogoClick?: () => void;
}

export function HeaderSimplified({ 
  activeTab, 
  onTabChange, 
  activeWalletTab = 'home', 
  onWalletTabChange, 
  isWalletConnected: propIsWalletConnected,
  showWalletNavigation = false,
  onLogoClick
}: HeaderProps) {
  const [isWalletConnected, setIsWalletConnected] = useState(propIsWalletConnected || false);
  const [walletAddress, setWalletAddress] = useState<string>("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });
  const buttonContainerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonWrapperRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();

  // Sync wallet connection state with prop
  useEffect(() => {
    if (propIsWalletConnected !== undefined) {
      setIsWalletConnected(propIsWalletConnected);
    }
  }, [propIsWalletConnected]);

  // Emit wallet connection event
  const emitWalletConnectionEvent = (connected: boolean) => {
    const event = new CustomEvent('wallet-connection-changed', {
      detail: { connected }
    });
    window.dispatchEvent(event);
  };

  // Function to simulate wallet connection
  const connectWallet = async () => {
    try {
      setIsConnecting(true);
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const mockAddress = "0x" + Math.random().toString(16).substring(2, 42);
      setWalletAddress(mockAddress);
      setIsWalletConnected(true);
      
      emitWalletConnectionEvent(true);
      
      toast.success("Wallet connected successfully!", {
        description: `Address: ${mockAddress.slice(0, 6)}...${mockAddress.slice(-4)}`,
        duration: 3000,
      });
    } catch (error) {
      console.error("Error connecting wallet:", error);
      toast.error("Error connecting wallet", {
        description: "Please try again later",
        duration: 3000,
      });
    } finally {
      setIsConnecting(false);
    }
  };

  // Function to disconnect wallet
  const disconnectWallet = () => {
    console.log('Disconnecting wallet');
    setIsWalletConnected(false);
    setWalletAddress("");
    setShowDropdown(false);
    setShowMobileMenu(false);
    setCopied(false);
    
    emitWalletConnectionEvent(false);
    
    toast.info("Wallet disconnected", {
      description: "Your wallet has been disconnected successfully",
      duration: 2000,
    });
  };

  // Function to shorten address
  const shortenAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  // Copy wallet address
  const copyAddress = async () => {
    try {
      await navigator.clipboard.writeText(walletAddress);
      setCopied(true);
      toast.success("Address copied!", {
        description: "Wallet address copied to clipboard",
        duration: 2000,
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy address:", error);
      toast.error("Failed to copy address", {
        description: "Please try again",
        duration: 2000,
      });
    }
  };

  // Handle navigation clicks
  const handleNavClick = useCallback((tab: 'home' | 'about' | 'rebalance' | 'top-performers') => {
    onTabChange(tab);
    setShowMobileMenu(false);
  }, [onTabChange]);

  // Handle wallet navigation clicks
  const handleWalletNavClick = useCallback((tab: 'home' | 'portfolio' | 'trade' | 'social' | 'profile' | 'create-portfolio') => {
    if (onWalletTabChange) {
      onWalletTabChange(tab);
    }
    setShowMobileMenu(false);
  }, [onWalletTabChange]);

  // Wallet navigation items with unified styling
  const walletNavItems = [
    { 
      id: 'home', 
      label: 'Home', 
      icon: <Home className="w-4 h-4" />,
      gradient: 'from-cyan-400 to-blue-500',
      defaultColor: 'text-cyan-600 dark:text-cyan-400',
      hoverColor: 'hover:text-cyan-700 dark:hover:text-cyan-300'
    },
    { 
      id: 'portfolio', 
      label: 'Portfolio', 
      icon: <PieChart className="w-4 h-4" />,
      gradient: 'from-blue-400 to-indigo-500',
      defaultColor: 'text-blue-600 dark:text-blue-400',
      hoverColor: 'hover:text-blue-700 dark:hover:text-blue-300'
    },
    { 
      id: 'trade', 
      label: 'Trade', 
      icon: <TrendingUp className="w-4 h-4" />,
      gradient: 'from-indigo-400 to-purple-500',
      defaultColor: 'text-indigo-600 dark:text-indigo-400',
      hoverColor: 'hover:text-indigo-700 dark:hover:text-indigo-300'
    },
    { 
      id: 'social', 
      label: 'Social', 
      icon: <Users className="w-4 h-4" />,
      gradient: 'from-teal-400 to-cyan-500',
      defaultColor: 'text-teal-600 dark:text-teal-400',
      hoverColor: 'hover:text-teal-700 dark:hover:text-teal-300'
    },
    { 
      id: 'profile', 
      label: 'Profile', 
      icon: <User className="w-4 h-4" />,
      gradient: 'from-sky-400 to-blue-500',
      defaultColor: 'text-sky-600 dark:text-sky-400',
      hoverColor: 'hover:text-sky-700 dark:hover:text-sky-300'
    }
  ];

  // Regular navigation items with unified styling
  const regularNavItems = [
    {
      id: 'about',
      label: 'About',
      gradient: 'from-cyan-400 to-blue-500',
      defaultColor: 'text-cyan-600 dark:text-cyan-400',
      hoverColor: 'hover:text-cyan-700 dark:hover:text-cyan-300'
    },
    {
      id: 'rebalance',
      label: 'Rebalance',
      gradient: 'from-blue-400 to-indigo-500',
      defaultColor: 'text-blue-600 dark:text-blue-400',
      hoverColor: 'hover:text-blue-700 dark:hover:text-blue-300'
    },
    {
      id: 'top-performers',
      label: 'Top Performers',
      gradient: 'from-teal-400 to-cyan-500',
      defaultColor: 'text-teal-600 dark:text-teal-400',
      hoverColor: 'hover:text-teal-700 dark:hover:text-teal-300'
    }
  ];

  const shouldShowWalletNavigation = showWalletNavigation && isWalletConnected && activeWalletTab !== 'create-portfolio';

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current && 
        !dropdownRef.current.contains(event.target as Node) &&
        buttonContainerRef.current &&
        !buttonContainerRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    };

    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showDropdown]);

  return (
    <header className="fixed top-0 left-0 right-0 w-full border-b border-border backdrop-blur-sm z-50 transition-colors duration-300" style={{ backgroundColor: 'var(--header-bg)' }}>
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Logo */}
          <div className="flex items-center">
            <button
              onClick={onLogoClick || (() => handleNavClick('home'))}
              className="transition-opacity duration-200 hover:opacity-80 cursor-pointer bg-transparent border-none p-0 m-0 flex-shrink-0"
              type="button"
            >
              <img 
                src="/logo.png" 
                alt="1balancer" 
                className="h-35 w-auto"
              />
            </button>
          </div>
          
          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-6 lg:space-x-8">
            {shouldShowWalletNavigation ? (
              // Wallet Navigation with enhanced styling
              walletNavItems.map((item) => (
                <motion.button
                  key={item.id}
                  onClick={() => handleWalletNavClick(item.id as any)}
                  className={`flex items-center gap-2 px-4 py-2 text-sm lg:text-base transition-all duration-300 rounded-lg relative overflow-hidden group ${
                    activeWalletTab === item.id
                      ? 'text-white shadow-lg transform scale-105'
                      : `${item.defaultColor} ${item.hoverColor} hover:scale-102`
                  }`}
                  style={{
                    background: activeWalletTab === item.id 
                      ? `linear-gradient(135deg, var(--gradient-primary))` 
                      : 'transparent'
                  }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {/* Active gradient background */}
                  {activeWalletTab === item.id && (
                    <motion.div
                      className={`absolute inset-0 bg-gradient-to-r ${item.gradient} opacity-90`}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 0.9 }}
                      transition={{ duration: 0.3 }}
                    />
                  )}
                  
                  {/* Hover gradient background with glow */}
                  <motion.div
                    className={`absolute inset-0 bg-gradient-to-r ${item.gradient} opacity-0 group-hover:opacity-20`}
                    transition={{ duration: 0.3 }}
                  />
                  
                  {/* Subtle glow effect for non-active tabs */}
                  {activeWalletTab !== item.id && (
                    <motion.div
                      className={`absolute inset-0 bg-gradient-to-r ${item.gradient} opacity-0 group-hover:opacity-5 blur-xl`}
                      transition={{ duration: 0.3 }}
                    />
                  )}
                  
                  {/* Content */}
                  <div className="relative z-10 flex items-center gap-2">
                    {item.icon}
                    {item.label}
                  </div>
                  
                  {/* Active underline with gradient */}
                  {activeWalletTab === item.id && (
                    <motion.div
                      className={`absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r ${item.gradient}`}
                      initial={{ scaleX: 0 }}
                      animate={{ scaleX: 1 }}
                      transition={{ duration: 0.3 }}
                    />
                  )}
                </motion.button>
              ))
            ) : (
              // Regular Navigation with enhanced styling
              regularNavItems.map((item) => (
                <motion.button
                  key={item.id}
                  onClick={() => handleNavClick(item.id as any)}
                  className={`px-4 py-2 text-sm lg:text-base transition-all duration-300 rounded-lg relative overflow-hidden group ${
                    activeTab === item.id
                      ? 'text-white shadow-lg transform scale-105'
                      : `${item.defaultColor} ${item.hoverColor} hover:scale-102`
                  }`}
                  style={{
                    background: activeTab === item.id 
                      ? `linear-gradient(135deg, var(--gradient-primary))` 
                      : 'transparent'
                  }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {/* Active gradient background */}
                  {activeTab === item.id && (
                    <motion.div
                      className={`absolute inset-0 bg-gradient-to-r ${item.gradient} opacity-90`}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 0.9 }}
                      transition={{ duration: 0.3 }}
                    />
                  )}
                  
                  {/* Hover gradient background with glow */}
                  <motion.div
                    className={`absolute inset-0 bg-gradient-to-r ${item.gradient} opacity-0 group-hover:opacity-20`}
                    transition={{ duration: 0.3 }}
                  />
                  
                  {/* Subtle glow effect for non-active tabs */}
                  {activeTab !== item.id && (
                    <motion.div
                      className={`absolute inset-0 bg-gradient-to-r ${item.gradient} opacity-0 group-hover:opacity-5 blur-xl`}
                      transition={{ duration: 0.3 }}
                    />
                  )}
                  
                  {/* Content */}
                  <div className="relative z-10">
                    {item.label}
                  </div>
                  
                  {/* Active underline with gradient */}
                  {activeTab === item.id && (
                    <motion.div
                      className={`absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r ${item.gradient}`}
                      initial={{ scaleX: 0 }}
                      animate={{ scaleX: 1 }}
                      transition={{ duration: 0.3 }}
                    />
                  )}
                </motion.button>
              ))
            )}
          </nav>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-3 relative">
            {/* Theme Toggle - Only show when not in wallet section */}
            {!shouldShowWalletNavigation && <ThemeToggle />}
            
            {/* Wallet Button */}
            {!isWalletConnected ? (
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Button 
                  onClick={connectWallet}
                  disabled={isConnecting}
                  className="relative overflow-hidden px-4 lg:px-6 py-2 rounded-lg transition-all duration-300 flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed text-sm lg:text-base text-white border-none"
                  style={{
                    background: 'var(--gradient-primary)',
                    boxShadow: '0 4px 20px rgba(20, 184, 166, 0.3)'
                  }}
                >
                  {/* Gradient background */}
                  <div className="absolute inset-0 bg-gradient-to-r from-teal-400 via-cyan-400 to-indigo-500 opacity-90" />
                  
                  {/* Hover effect */}
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-teal-500 via-cyan-500 to-indigo-600 opacity-0"
                    whileHover={{ opacity: 1 }}
                    transition={{ duration: 0.3 }}
                  />
                  
                  {/* Content */}
                  <div className="relative z-10 flex items-center gap-2">
                    {isConnecting ? (
                      <>
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                          className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                        />
                        Connecting...
                      </>
                    ) : (
                      <>
                        <Wallet className="w-4 h-4" />
                        Connect Wallet
                      </>
                    )}
                  </div>
                </Button>
              </motion.div>
            ) : (
              <div className="relative z-[9999]" ref={!isMobile ? buttonContainerRef : undefined}>
                <motion.div
                  ref={buttonWrapperRef}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Button 
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setShowDropdown(!showDropdown);
                    }}
                    className="bg-card hover:bg-accent text-card-foreground border border-border px-4 lg:px-6 py-2 rounded-lg transition-all duration-200 flex items-center gap-2 relative overflow-hidden text-sm lg:text-base"
                    data-wallet-connected="true"
                  >
                    <motion.div 
                      className="w-2 h-2 bg-green-400 rounded-full"
                      animate={{ 
                        boxShadow: [
                          "0 0 0 0 rgba(74, 222, 128, 0.4)",
                          "0 0 0 4px rgba(74, 222, 128, 0)",
                        ]
                      }}
                      transition={{ duration: 2, repeat: Infinity }}
                    />
                    {shortenAddress(walletAddress)}
                  </Button>
                </motion.div>
              </div>
            )}
          </div>

          {/* Mobile Actions */}
          <div className="md:hidden flex items-center gap-2">
            {/* Mobile Theme Toggle - Only show when not in wallet section */}
            {!shouldShowWalletNavigation && <ThemeToggle isMobile />}
            
            {/* Mobile Wallet Button */}
            {isWalletConnected && (
              <div className="relative" ref={isMobile ? buttonContainerRef : undefined}>
                <Button 
                  onClick={() => setShowDropdown(!showDropdown)}
                  className="bg-card hover:bg-accent text-card-foreground border border-border p-2 rounded-lg transition-all duration-200 flex items-center gap-1"
                  size="sm"
                  data-wallet-connected="true"
                >
                  <motion.div 
                    className="w-2 h-2 bg-green-400 rounded-full"
                    animate={{ 
                      boxShadow: [
                        "0 0 0 0 rgba(74, 222, 128, 0.4)",
                        "0 0 0 3px rgba(74, 222, 128, 0)",
                      ]
                    }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                  <span className="text-xs">{shortenAddress(walletAddress).split('...')[0]}</span>
                </Button>
              </div>
            )}
            
            <Button
              data-mobile-menu-trigger
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              variant="ghost"
              size="sm"
              className="text-foreground hover:bg-accent p-2 relative"
            >
              {showMobileMenu ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {showMobileMenu && (
            <motion.div
              data-mobile-menu
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="md:hidden border-t border-border bg-background/95 backdrop-blur-sm overflow-hidden"
            >
              <div className="py-4 space-y-3">
                {shouldShowWalletNavigation ? (
                  // Mobile Wallet Navigation
                  walletNavItems.map((item) => (
                    <motion.button
                      key={item.id}
                      onClick={() => handleWalletNavClick(item.id as any)}
                      className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-all duration-300 rounded-lg mx-4 relative overflow-hidden group ${
                        activeWalletTab === item.id
                          ? 'text-white shadow-lg'
                          : `${item.defaultColor} ${item.hoverColor}`
                      }`}
                      style={{
                        background: activeWalletTab === item.id 
                          ? `linear-gradient(135deg, var(--gradient-primary))` 
                          : 'transparent'
                      }}
                      whileTap={{ scale: 0.98 }}
                    >
                      {/* Active gradient background */}
                      {activeWalletTab === item.id && (
                        <motion.div
                          className={`absolute inset-0 bg-gradient-to-r ${item.gradient} opacity-90`}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 0.9 }}
                          transition={{ duration: 0.3 }}
                        />
                      )}
                      
                      {/* Hover gradient background */}
                      <motion.div
                        className={`absolute inset-0 bg-gradient-to-r ${item.gradient} opacity-0 group-hover:opacity-20`}
                        transition={{ duration: 0.3 }}
                      />
                      
                      {/* Content */}
                      <div className="relative z-10 flex items-center gap-3">
                        {item.icon}
                        {item.label}
                      </div>
                    </motion.button>
                  ))
                ) : (
                  // Mobile Regular Navigation
                  <>
                    {!isWalletConnected && (
                      <motion.div className="px-4" whileTap={{ scale: 0.98 }}>
                        <Button 
                          onClick={connectWallet}
                          disabled={isConnecting}
                          className="w-full relative overflow-hidden px-4 py-3 rounded-lg transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed text-white border-none"
                          style={{
                            background: 'var(--gradient-primary)',
                            boxShadow: '0 4px 20px rgba(20, 184, 166, 0.3)'
                          }}
                        >
                          {/* Gradient background */}
                          <div className="absolute inset-0 bg-gradient-to-r from-teal-400 via-cyan-400 to-indigo-500 opacity-90" />
                          
                          {/* Content */}
                          <div className="relative z-10 flex items-center gap-2">
                            {isConnecting ? (
                              <>
                                <motion.div
                                  animate={{ rotate: 360 }}
                                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                  className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                                />
                                Connecting...
                              </>
                            ) : (
                              <>
                                <Wallet className="w-4 h-4" />
                                Connect Wallet
                              </>
                            )}
                          </div>
                        </Button>
                      </motion.div>
                    )}
                    
                    {regularNavItems.map((item) => (
                      <motion.button
                        key={item.id}
                        onClick={() => handleNavClick(item.id as any)}
                        className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-all duration-300 rounded-lg mx-4 relative overflow-hidden group ${
                          activeTab === item.id
                            ? 'text-white shadow-lg'
                            : `${item.defaultColor} ${item.hoverColor}`
                        }`}
                        style={{
                          background: activeTab === item.id 
                            ? `linear-gradient(135deg, var(--gradient-primary))` 
                            : 'transparent'
                        }}
                        whileTap={{ scale: 0.98 }}
                      >
                        {/* Active gradient background */}
                        {activeTab === item.id && (
                          <motion.div
                            className={`absolute inset-0 bg-gradient-to-r ${item.gradient} opacity-90`}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 0.9 }}
                            transition={{ duration: 0.3 }}
                          />
                        )}
                        
                        {/* Hover gradient background */}
                        <motion.div
                          className={`absolute inset-0 bg-gradient-to-r ${item.gradient} opacity-0 group-hover:opacity-20`}
                          transition={{ duration: 0.3 }}
                        />
                        
                        {/* Content */}
                        <div className="relative z-10">
                          {item.label}
                        </div>
                      </motion.button>
                    ))}
                  </>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Wallet Dropdown Portal */}
      {showDropdown && isWalletConnected && createPortal(
        <AnimatePresence>
          <motion.div
            ref={dropdownRef}
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="fixed z-[10000] bg-card border border-border rounded-xl shadow-2xl min-w-[280px] backdrop-blur-sm"
            style={{
              background: 'var(--card-bg)',
              top: isMobile ? '70px' : '70px',
              right: isMobile ? '16px' : '32px',
              boxShadow: '0 10px 40px rgba(0, 0, 0, 0.2)',
            }}
          >
            {/* Header */}
            <div className="p-4 border-b border-border">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-400 to-cyan-500 flex items-center justify-center">
                  <Wallet className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="font-medium text-foreground">Wallet Connected</h3>
                  <p className="text-sm text-muted-foreground">{shortenAddress(walletAddress)}</p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="p-2">
              <motion.button
                onClick={copyAddress}
                className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-foreground hover:bg-accent rounded-lg transition-colors duration-200"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {copied ? (
                  <Check className="w-4 h-4 text-green-500" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
                <span className="flex-1 text-left">{copied ? 'Copied!' : 'Copy Address'}</span>
              </motion.button>

              <motion.button
                onClick={disconnectWallet}
                className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors duration-200"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <LogOut className="w-4 h-4" />
                <span className="flex-1 text-left">Disconnect Wallet</span>
              </motion.button>
            </div>

            {/* Footer */}
            <div className="px-4 py-3 border-t border-border bg-muted/20">
              <div className="flex items-center gap-2">
                <motion.div 
                  className="w-2 h-2 bg-green-400 rounded-full"
                  animate={{ 
                    boxShadow: [
                      "0 0 0 0 rgba(74, 222, 128, 0.4)",
                      "0 0 0 4px rgba(74, 222, 128, 0)",
                    ]
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
                <span className="text-xs text-muted-foreground">Connected to 1Balancer</span>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>,
        document.body
      )}
    </header>
  );
}