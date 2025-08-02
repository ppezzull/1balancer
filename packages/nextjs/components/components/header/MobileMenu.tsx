import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { Button } from "../ui/button";
import { Wallet, Copy, LogOut, Check, Home, PieChart, TrendingUp, Users, User } from "lucide-react";

interface MobileMenuProps {
  showMobileMenu: boolean;
  shouldShowWalletNavigation: boolean;
  activeTab: string;
  activeWalletTab: string;
  isWalletConnected: boolean;
  isConnecting: boolean;
  walletAddress: string;
  showDropdown: boolean;
  copied: boolean;
  handleNavClick: (tab: any) => void;
  handleWalletNavClick: (tab: any) => void;
  connectWallet: () => void;
  copyAddress: () => Promise<void>;
  disconnectWallet: () => void;
  shortenAddress: (address: string) => string;
}

export function MobileMenu({
  showMobileMenu,
  shouldShowWalletNavigation,
  activeTab,
  activeWalletTab,
  isWalletConnected,
  isConnecting,
  walletAddress,
  showDropdown,
  copied,
  handleNavClick,
  handleWalletNavClick,
  connectWallet,
  copyAddress,
  disconnectWallet,
  shortenAddress
}: MobileMenuProps) {
  const walletNavItems = [
    { 
      id: 'home', 
      label: 'Home', 
      icon: <Home className="w-4 h-4" />,
      gradient: 'from-teal-400 to-cyan-500',
      defaultColor: 'text-teal-500 dark:text-teal-400',
      hoverColor: 'hover:text-teal-600 dark:hover:text-teal-300'
    },
    { 
      id: 'portfolio', 
      label: 'Portfolio', 
      icon: <PieChart className="w-4 h-4" />,
      gradient: 'from-blue-400 to-indigo-500',
      defaultColor: 'text-blue-500 dark:text-blue-400',
      hoverColor: 'hover:text-blue-600 dark:hover:text-blue-300'
    },
    { 
      id: 'trade', 
      label: 'Trade', 
      icon: <TrendingUp className="w-4 h-4" />,
      gradient: 'from-emerald-400 to-teal-500',
      defaultColor: 'text-emerald-500 dark:text-emerald-400',
      hoverColor: 'hover:text-emerald-600 dark:hover:text-emerald-300'
    },
    { 
      id: 'social', 
      label: 'Social', 
      icon: <Users className="w-4 h-4" />,
      gradient: 'from-purple-400 to-violet-500',
      defaultColor: 'text-purple-500 dark:text-purple-400',
      hoverColor: 'hover:text-purple-600 dark:hover:text-purple-300'
    },
    { 
      id: 'profile', 
      label: 'Profile', 
      icon: <User className="w-4 h-4" />,
      gradient: 'from-pink-400 to-rose-500',
      defaultColor: 'text-pink-500 dark:text-pink-400',
      hoverColor: 'hover:text-pink-600 dark:hover:text-pink-300'
    }
  ];

  const regularNavItems = [
    {
      id: 'about',
      label: 'About',
      gradient: 'from-teal-400 to-cyan-500',
      defaultColor: 'text-teal-500 dark:text-teal-400',
      hoverColor: 'hover:text-teal-600 dark:hover:text-teal-300'
    },
    {
      id: 'rebalance',
      label: 'Rebalance',
      gradient: 'from-blue-400 to-indigo-500',
      defaultColor: 'text-blue-500 dark:text-blue-400',
      hoverColor: 'hover:text-blue-600 dark:hover:text-blue-300'
    },
    {
      id: 'top-performers',
      label: 'Top Performers',
      gradient: 'from-emerald-400 to-teal-500',
      defaultColor: 'text-emerald-500 dark:text-emerald-400',
      hoverColor: 'hover:text-emerald-600 dark:hover:text-emerald-300'
    }
  ];

  if (!showMobileMenu) return null;

  return (
    <AnimatePresence>
      <motion.div
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

          {/* Mobile Wallet Menu */}
          {isWalletConnected && showDropdown && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mx-4 mt-4 p-4 rounded-lg border border-border/30"
              style={{
                background: 'rgba(0, 0, 0, 0.95)',
                backdropFilter: 'blur(20px)'
              }}
            >
              <div className="text-sm text-white mb-3 flex items-center gap-2 font-medium">
                <Wallet className="w-4 h-4" />
                Wallet Address
              </div>
              <div 
                className="text-white text-xs font-mono break-all p-3 rounded mb-3"
                style={{ 
                  backgroundColor: 'rgba(0, 0, 0, 0.8)',
                  border: '1px solid rgba(255, 255, 255, 0.3)'
                }}
              >
                {walletAddress}
              </div>
              <div className="space-y-2">
                <button
                  onClick={copyAddress}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-white rounded"
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    border: '1px solid rgba(255, 255, 255, 0.2)'
                  }}
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4 text-green-400" />
                      <span className="text-green-400">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      Copy Address
                    </>
                  )}
                </button>
                <button
                  onClick={disconnectWallet}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 rounded"
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    border: '1px solid rgba(255, 255, 255, 0.2)'
                  }}
                >
                  <LogOut className="w-4 h-4" />
                  Disconnect Wallet
                </button>
              </div>
            </motion.div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}