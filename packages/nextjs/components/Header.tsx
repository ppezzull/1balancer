"use client";

import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { Button } from "./ui/button";
import { ThemeToggle } from "./ui/theme-toggle";
import { useIsMobile } from "./ui/use-mobile";
// import logoImage from '/logo.png'; // Figma asset - use your local logo
import { Wallet, Copy, LogOut, Check, Menu, X, Home, PieChart, TrendingUp, Users, User } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

interface HeaderProps {
  activeTab: 'home' | 'about' | 'rebalance' | 'top-performers';
  onTabChange: (tab: 'home' | 'about' | 'rebalance' | 'top-performers') => void;
  activeWalletTab?: 'home' | 'portfolio' | 'trade' | 'social' | 'profile';
  onWalletTabChange?: (tab: 'home' | 'portfolio' | 'trade' | 'social' | 'profile') => void;
  isWalletConnected?: boolean;
  showWalletNavigation?: boolean; // New prop to control wallet navigation visibility
  router?: AppRouterInstance; // Router for direct navigation
}

export function Header({ 
  activeTab = 'home', 
  onTabChange = () => {}, 
  activeWalletTab = 'home', 
  onWalletTabChange = () => {}, 
  isWalletConnected: propIsWalletConnected = false,
  showWalletNavigation = false, // Default to false
  router
}: Partial<HeaderProps> = {}) {
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
      // Simulate connection delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Simulate wallet connection (in a real app you would use Web3 or wallet provider)
      const mockAddress = "0x" + Math.random().toString(16).substring(2, 42);
      setWalletAddress(mockAddress);
      setIsWalletConnected(true);
      
      // Emit connection event
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
    
    // Emit disconnection event
    emitWalletConnectionEvent(false);
    
    // Navigate back to home when disconnecting wallet
    if (router) {
      router.push('/');
    } else {
      onTabChange('home');
    }
    
    toast.info("Wallet disconnected", {
      description: "You've been redirected to the homepage",
      duration: 2000,
    });
  };

  // Function to shorten address
  const shortenAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  // Function to determine if Clipboard API is actually usable
  const isClipboardApiUsable = () => {
    if (!navigator.clipboard || !navigator.clipboard.writeText) {
      return false;
    }
    
    if (!window.isSecureContext) {
      return false;
    }
    
    if (window.parent !== window) {
      return false;
    }
    
    return true;
  };

  // Function to copy address with smart strategy
  const copyAddress = async () => {
    console.log('Starting address copy...');
    
    const canUseClipboardApi = isClipboardApiUsable();
    
    if (canUseClipboardApi) {
      try {
        await navigator.clipboard.writeText(walletAddress);
        setCopied(true);
        
        toast.success("Address copied!", {
          description: "The address has been copied to clipboard",
          duration: 2000,
        });
        
        setTimeout(() => setCopied(false), 2000);
        setTimeout(() => {
          setShowDropdown(false);
          setShowMobileMenu(false);
        }, 1000);
        return;
      } catch (clipboardError) {
        console.warn('Clipboard API unexpectedly failed:', clipboardError);
      }
    }

    // Fallback with textarea and execCommand
    try {
      const textArea = document.createElement('textarea');
      textArea.value = walletAddress;
      
      Object.assign(textArea.style, {
        position: 'fixed',
        left: '-9999px',
        top: '-9999px',
        width: '1px',
        height: '1px',
        opacity: '0',
        pointerEvents: 'none',
        zIndex: '-1',
        border: 'none',
        outline: 'none',
        background: 'transparent'
      });
      
      textArea.setAttribute('readonly', '');
      textArea.setAttribute('tabindex', '-1');
      textArea.setAttribute('aria-hidden', 'true');
      
      document.body.appendChild(textArea);
      
      textArea.focus({ preventScroll: true });
      textArea.select();
      
      if (textArea.setSelectionRange) {
        textArea.setSelectionRange(0, textArea.value.length);
      }
      
      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);
      
      if (successful) {
        setCopied(true);
        toast.success("Address copied!", {
          description: "The address has been copied to clipboard",
          duration: 2000,
        });
        
        setTimeout(() => setCopied(false), 2000);
        setTimeout(() => {
          setShowDropdown(false);
          setShowMobileMenu(false);
        }, 1000);
        return;
      }
    } catch (execCommandError) {
      console.info('execCommand not supported or failed');
    }

    // Visual fallback for manual copy
    console.info('Using visual fallback for manual copy');
    showManualCopyDialog();
  };

  // Separate function to show manual copy dialog
  const showManualCopyDialog = () => {
    const overlay = document.createElement('div');
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.8);
      z-index: 9999999999;
      display: flex;
      align-items: center;
      justify-content: center;
      backdrop-filter: blur(5px);
      padding: 20px;
    `;
    
    const dialog = document.createElement('div');
    dialog.style.cssText = `
      background: rgba(17, 24, 39, 0.95);
      color: white;
      padding: 24px;
      border-radius: 12px;
      border: 2px solid rgba(255, 255, 255, 0.3);
      max-width: 90vw;
      width: 100%;
      max-width: 400px;
      max-height: 90vh;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.95);
      backdrop-filter: blur(20px);
    `;
    
    dialog.innerHTML = `
      <div style="text-align: center; margin-bottom: 16px;">
        <h3 style="margin: 0 0 8px 0; font-size: 18px; font-weight: 600;">Wallet Address</h3>
        <p style="margin: 0; color: rgba(255, 255, 255, 0.7); font-size: 14px;">Select and copy manually</p>
      </div>
      <div style="
        background: rgba(0, 0, 0, 0.8);
        border: 1px solid rgba(255, 255, 255, 0.3);
        border-radius: 8px;
        padding: 12px;
        font-family: monospace;
        font-size: 14px;
        word-break: break-all;
        user-select: all;
        cursor: text;
        margin-bottom: 16px;
      ">${walletAddress}</div>
      <button style="
        width: 100%;
        background: rgba(55, 65, 81, 0.8);
        border: 1px solid rgba(255, 255, 255, 0.3);
        color: white;
        padding: 12px 16px;
        border-radius: 6px;
        cursor: pointer;
        font-size: 14px;
        touch-action: manipulation;
      ">Close</button>
    `;
    
    const addressDiv = dialog.querySelector('div[style*="user-select: all"]');
    if (addressDiv) {
      setTimeout(() => {
        const selection = window.getSelection();
        const range = document.createRange();
        range.selectNodeContents(addressDiv);
        selection?.removeAllRanges();
        selection?.addRange(range);
      }, 100);
    }
    
    const closeButton = dialog.querySelector('button');
    const closeDialog = () => {
      if (document.body.contains(overlay)) {
        document.body.removeChild(overlay);
      }
    };
    
    closeButton?.addEventListener('click', closeDialog);
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) closeDialog();
    });
    
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeDialog();
        document.removeEventListener('keydown', handleEscape);
      }
    };
    document.addEventListener('keydown', handleEscape);
    
    overlay.appendChild(dialog);
    document.body.appendChild(overlay);
    
    toast.info("Manual copy required", {
      description: "The address has been highlighted for copying",
      duration: 3000,
    });
    
    setTimeout(closeDialog, 30000);
  };

  // Handle navigation clicks
  const handleNavClick = (tab: 'home' | 'about' | 'rebalance' | 'top-performers') => {
    if (router) {
      // Use router directly for more reliable navigation
      switch (tab) {
        case 'home':
          router.push('/');
          break;
        case 'about':
          router.push('/about');
          break;
        case 'rebalance':
          router.push('/rebalance');
          break;
        case 'top-performers':
          router.push('/top-performers');
          break;
      }
    } else {
      onTabChange(tab);
    }
    setShowMobileMenu(false);
  };

  // Handle wallet navigation clicks
  const handleWalletNavClick = (tab: 'home' | 'portfolio' | 'trade' | 'social' | 'profile') => {
    if (onWalletTabChange) {
      onWalletTabChange(tab);
    }
    setShowMobileMenu(false);
  };

  // Wallet navigation items
  const walletNavItems = [
    { id: 'home', label: 'Home', icon: <Home className="w-4 h-4" /> },
    { id: 'portfolio', label: 'Portfolio', icon: <PieChart className="w-4 h-4" /> },
    { id: 'trade', label: 'Trade', icon: <TrendingUp className="w-4 h-4" /> },
    { id: 'social', label: 'Social', icon: <Users className="w-4 h-4" /> },
    { id: 'profile', label: 'Profile', icon: <User className="w-4 h-4" /> }
  ];

  // Get thematic color for each wallet tab
  const getWalletTabColor = (tabId: string) => {
    const colors = {
      'home': {
        text: 'text-blue-400',
        hover: 'hover:bg-blue-500/20 hover:shadow-lg hover:shadow-blue-500/25',
        active: 'from-blue-500 to-cyan-500 shadow-blue-500/25'
      },
      'portfolio': {
        text: 'text-emerald-400', 
        hover: 'hover:bg-emerald-500/20 hover:shadow-lg hover:shadow-emerald-500/25',
        active: 'from-emerald-500 to-teal-500 shadow-emerald-500/25'
      },
      'trade': {
        text: 'text-orange-400',
        hover: 'hover:bg-orange-500/20 hover:shadow-lg hover:shadow-orange-500/25', 
        active: 'from-orange-500 to-red-500 shadow-orange-500/25'
      },
      'social': {
        text: 'text-pink-400',
        hover: 'hover:bg-pink-500/20 hover:shadow-lg hover:shadow-pink-500/25',
        active: 'from-pink-500 to-purple-500 shadow-pink-500/25'
      },
      'profile': {
        text: 'text-indigo-400',
        hover: 'hover:bg-indigo-500/20 hover:shadow-lg hover:shadow-indigo-500/25',
        active: 'from-indigo-500 to-blue-500 shadow-indigo-500/25'
      }
    };
    return colors[tabId as keyof typeof colors] || colors.home;
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    if (!showDropdown) return;

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      
      if (dropdownRef.current && dropdownRef.current.contains(target)) {
        return;
      }
      
      if (buttonContainerRef.current && buttonContainerRef.current.contains(target)) {
        return;
      }
      
      setShowDropdown(false);
    };

    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
    }, 150);
    
    return () => {
      clearTimeout(timer);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDropdown]);

  // Close mobile menu on outside click
  useEffect(() => {
    if (!showMobileMenu) return;

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      
      if (!target.closest('[data-mobile-menu]') && !target.closest('[data-mobile-menu-trigger]')) {
        setShowMobileMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showMobileMenu]);

  // Calculate dropdown position
  const updateDropdownPosition = () => {
    if (buttonWrapperRef.current) {
      const rect = buttonWrapperRef.current.getBoundingClientRect();
      const dropdownWidth = isMobile ? Math.min(320, window.innerWidth - 40) : 320;
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      
      let leftPosition = rect.right - dropdownWidth;
      
      if (leftPosition + dropdownWidth > viewportWidth - 20) {
        leftPosition = viewportWidth - dropdownWidth - 20;
      }
      
      if (leftPosition < 20) {
        leftPosition = 20;
      }
      
      let topPosition = rect.bottom + 8;
      
      const dropdownHeight = 200;
      if (topPosition + dropdownHeight > viewportHeight - 20) {
        topPosition = rect.top - dropdownHeight - 8;
      }
      
      if (topPosition < 20) {
        topPosition = 20;
      }
      
      setDropdownPosition({
        top: topPosition,
        left: leftPosition
      });
    }
  };

  // Update position when dropdown opens
  useEffect(() => {
    if (showDropdown) {
      updateDropdownPosition();
      
      const timer = setTimeout(() => {
        updateDropdownPosition();
      }, 50);
      
      window.addEventListener('scroll', updateDropdownPosition);
      window.addEventListener('resize', updateDropdownPosition);
      
      return () => {
        clearTimeout(timer);
        window.removeEventListener('scroll', updateDropdownPosition);
        window.removeEventListener('resize', updateDropdownPosition);
      };
    }
  }, [showDropdown, isMobile]);

  // Determine which navigation to show
  const shouldShowWalletNavigation = showWalletNavigation && isWalletConnected;

  return (
    <header className="w-full border-b border-border backdrop-blur-sm relative z-50 transition-colors duration-300" style={{ backgroundColor: 'var(--header-bg)' }}>
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Logo */}
          <div className="flex items-center">
            <button
              onClick={() => handleNavClick('home')}
              className="transition-opacity duration-200 hover:opacity-80 cursor-pointer bg-transparent border-none p-0 m-0 flex-shrink-0"
              type="button"
            >
              <img 
                src="/logo.png" 
                alt="1balancer" 
                className="h-40 w-auto"
              />
            </button>
          </div>
          
          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-6 lg:space-x-8">
            {shouldShowWalletNavigation ? (
              // Wallet Navigation
              walletNavItems.map((item) => {
                const colors = getWalletTabColor(item.id);
                return (
                <motion.button
                  key={item.id}
                  onClick={() => handleWalletNavClick(item.id as any)}
                  className={`relative flex items-center gap-2 px-4 py-3 text-sm lg:text-base font-medium rounded-lg transition-all duration-300 ${
                    activeWalletTab === item.id
                      ? `text-white bg-gradient-to-r ${colors.active} shadow-lg`
                      : `${colors.text} hover:text-white ${colors.hover}`
                  }`}
                  whileHover={{ 
                    scale: 1.05,
                    y: -2
                  }}
                  whileTap={{ 
                    scale: 0.95,
                    y: 0
                  }}
                  initial={false}
                  animate={activeWalletTab === item.id ? {
                    boxShadow: [
                      `0 4px 14px 0 ${item.id === 'home' ? 'rgba(59, 130, 246, 0.25)' : 
                                     item.id === 'portfolio' ? 'rgba(16, 185, 129, 0.25)' :
                                     item.id === 'trade' ? 'rgba(249, 115, 22, 0.25)' :
                                     item.id === 'social' ? 'rgba(236, 72, 153, 0.25)' :
                                     'rgba(99, 102, 241, 0.25)'}`,
                      `0 6px 20px 0 ${item.id === 'home' ? 'rgba(59, 130, 246, 0.4)' : 
                                     item.id === 'portfolio' ? 'rgba(16, 185, 129, 0.4)' :
                                     item.id === 'trade' ? 'rgba(249, 115, 22, 0.4)' :
                                     item.id === 'social' ? 'rgba(236, 72, 153, 0.4)' :
                                     'rgba(99, 102, 241, 0.4)'}`,
                      `0 4px 14px 0 ${item.id === 'home' ? 'rgba(59, 130, 246, 0.25)' : 
                                     item.id === 'portfolio' ? 'rgba(16, 185, 129, 0.25)' :
                                     item.id === 'trade' ? 'rgba(249, 115, 22, 0.25)' :
                                     item.id === 'social' ? 'rgba(236, 72, 153, 0.25)' :
                                     'rgba(99, 102, 241, 0.25)'}`
                    ]
                  } : {}}
                  transition={{
                    boxShadow: { duration: 2, repeat: Infinity },
                    layout: { duration: 0.3 }
                  }}
                >
                  <motion.div
                    animate={activeWalletTab === item.id ? {
                      rotate: [0, 5, -5, 0]
                    } : {}}
                    transition={{ duration: 0.5 }}
                  >
                    {item.icon}
                  </motion.div>
                  {item.label}
                  {activeWalletTab === item.id && (
                    <motion.div
                      className={`absolute -bottom-1 left-1/2 w-1 h-1 rounded-full ${
                        item.id === 'home' ? 'bg-blue-400' : 
                        item.id === 'portfolio' ? 'bg-emerald-400' :
                        item.id === 'trade' ? 'bg-orange-400' :
                        item.id === 'social' ? 'bg-pink-400' :
                        'bg-indigo-400'
                      }`}
                      layoutId="activeWalletTab"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    />
                  )}
                </motion.button>
                );
              })
            ) : (
              // Regular Navigation
              <>
                <motion.button
                  onClick={() => handleNavClick('about')}
                  className={`relative px-4 py-3 text-sm lg:text-base font-medium rounded-lg transition-all duration-300 ${
                    activeTab === 'about'
                      ? 'text-white bg-gradient-to-r from-cyan-500 to-blue-500 shadow-lg shadow-cyan-500/25'
                      : 'text-cyan-400 hover:text-white hover:bg-cyan-500/20 hover:shadow-lg hover:shadow-cyan-500/25'
                  }`}
                  whileHover={{ 
                    scale: 1.05,
                    y: -2
                  }}
                  whileTap={{ 
                    scale: 0.95,
                    y: 0
                  }}
                  initial={false}
                  animate={activeTab === 'about' ? {
                    boxShadow: [
                      "0 4px 14px 0 rgba(6, 182, 212, 0.25)",
                      "0 6px 20px 0 rgba(6, 182, 212, 0.4)",
                      "0 4px 14px 0 rgba(6, 182, 212, 0.25)"
                    ]
                  } : {}}
                  transition={{
                    boxShadow: { duration: 2, repeat: Infinity },
                    layout: { duration: 0.3 }
                  }}
                >
                  About
                  {activeTab === 'about' && (
                    <motion.div
                      className="absolute -bottom-1 left-1/2 w-1 h-1 bg-cyan-400 rounded-full"
                      layoutId="activeMainTab"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    />
                  )}
                </motion.button>

                <motion.button
                  onClick={() => handleNavClick('rebalance')}
                  className={`relative px-4 py-3 text-sm lg:text-base font-medium rounded-lg transition-all duration-300 ${
                    activeTab === 'rebalance'
                      ? 'text-white bg-gradient-to-r from-cyan-500 to-blue-500 shadow-lg shadow-cyan-500/25'
                      : 'text-emerald-400 hover:text-white hover:bg-emerald-500/20 hover:shadow-lg hover:shadow-emerald-500/25'
                  }`}
                  whileHover={{ 
                    scale: 1.05,
                    y: -2
                  }}
                  whileTap={{ 
                    scale: 0.95,
                    y: 0
                  }}
                  initial={false}
                  animate={activeTab === 'rebalance' ? {
                    boxShadow: [
                      "0 4px 14px 0 rgba(6, 182, 212, 0.25)",
                      "0 6px 20px 0 rgba(6, 182, 212, 0.4)",
                      "0 4px 14px 0 rgba(6, 182, 212, 0.25)"
                    ]
                  } : {}}
                  transition={{
                    boxShadow: { duration: 2, repeat: Infinity },
                    layout: { duration: 0.3 }
                  }}
                >
                  Rebalance
                  {activeTab === 'rebalance' && (
                    <motion.div
                      className="absolute -bottom-1 left-1/2 w-1 h-1 bg-cyan-400 rounded-full"
                      layoutId="activeMainTab"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    />
                  )}
                </motion.button>

                <motion.button
                  onClick={() => handleNavClick('top-performers')}
                  className={`relative px-4 py-3 text-sm lg:text-base font-medium rounded-lg transition-all duration-300 ${
                    activeTab === 'top-performers'
                      ? 'text-white bg-gradient-to-r from-cyan-500 to-blue-500 shadow-lg shadow-cyan-500/25'
                      : 'text-amber-400 hover:text-white hover:bg-amber-500/20 hover:shadow-lg hover:shadow-amber-500/25'
                  }`}
                  whileHover={{ 
                    scale: 1.05,
                    y: -2
                  }}
                  whileTap={{ 
                    scale: 0.95,
                    y: 0
                  }}
                  initial={false}
                  animate={activeTab === 'top-performers' ? {
                    boxShadow: [
                      "0 4px 14px 0 rgba(6, 182, 212, 0.25)",
                      "0 6px 20px 0 rgba(6, 182, 212, 0.4)",
                      "0 4px 14px 0 rgba(6, 182, 212, 0.25)"
                    ]
                  } : {}}
                  transition={{
                    boxShadow: { duration: 2, repeat: Infinity },
                    layout: { duration: 0.3 }
                  }}
                >
                  Top Performers
                  {activeTab === 'top-performers' && (
                    <motion.div
                      className="absolute -bottom-1 left-1/2 w-1 h-1 bg-cyan-400 rounded-full"
                      layoutId="activeMainTab"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    />
                  )}
                </motion.button>
              </>
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
                  className="bg-gradient-to-r from-teal-400 via-cyan-400 to-indigo-500 hover:from-teal-500 hover:via-cyan-500 hover:to-indigo-600 text-black px-4 lg:px-6 py-2 rounded-lg transition-all duration-200 flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed text-sm lg:text-base"
                >
                  {isConnecting ? (
                    <>
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="w-4 h-4 border-2 border-black border-t-transparent rounded-full"
                      />
                      Connecting...
                    </>
                  ) : (
                    <>
                      <Wallet className="w-4 h-4" />
                      Connect Wallet
                    </>
                  )}
                </Button>
              </motion.div>
            ) : (
              <div className="relative z-[9999]" ref={buttonContainerRef}>
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
                
                {/* Desktop Dropdown Menu Portal */}
                {showDropdown && createPortal(
                  <AnimatePresence>
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="fixed inset-0" 
                      style={{
                        zIndex: 999999999,
                        pointerEvents: 'none',
                        backgroundColor: 'rgba(0, 0, 0, 0.3)'
                      }}
                    >
                      <motion.div 
                        ref={dropdownRef}
                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                        className="border-2 rounded-lg shadow-2xl"
                        style={{ 
                          position: 'absolute',
                          top: dropdownPosition.top,
                          left: dropdownPosition.left,
                          width: isMobile ? Math.min(320, window.innerWidth - 40) : 320,
                          pointerEvents: 'auto',
                          zIndex: 999999999,
                          backgroundColor: 'rgba(0, 0, 0, 0.95)',
                          backdropFilter: 'blur(24px)',
                          border: '2px solid rgba(255, 255, 255, 0.4)',
                          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.95), 0 0 0 1px rgba(255, 255, 255, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.2)'
                        }}
                      >
                      <div className="p-4 border-b" style={{borderColor: 'rgba(255, 255, 255, 0.2)'}}>
                        <div className="text-sm text-white mb-3 flex items-center gap-2 font-medium">
                          <Wallet className="w-4 h-4" />
                          Wallet Address
                        </div>
                        <div 
                          className="text-white text-xs sm:text-sm font-mono break-all p-3 rounded"
                          style={{ 
                            backgroundColor: 'rgba(0, 0, 0, 0.8)',
                            textShadow: '0 1px 2px rgba(0, 0, 0, 0.8)',
                            border: '1px solid rgba(255, 255, 255, 0.3)'
                          }}
                        >
                          {walletAddress}
                        </div>
                      </div>
                      <div className="p-3">
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            copyAddress();
                          }}
                          className="w-full flex items-center gap-3 px-4 py-3 text-sm text-white rounded transition-colors duration-200 cursor-pointer font-medium mb-2"
                          style={{
                            backgroundColor: 'rgba(255, 255, 255, 0.1)',
                            textShadow: '0 1px 2px rgba(0, 0, 0, 0.8)',
                            border: '1px solid rgba(255, 255, 255, 0.2)',
                            touchAction: 'manipulation'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
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
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            disconnectWallet();
                          }}
                          className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-400 rounded transition-colors duration-200 cursor-pointer font-medium"
                          style={{
                            backgroundColor: 'rgba(255, 255, 255, 0.1)',
                            textShadow: '0 1px 2px rgba(0, 0, 0, 0.8)',
                            border: '1px solid rgba(255, 255, 255, 0.2)',
                            touchAction: 'manipulation'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                          }}
                        >
                          <LogOut className="w-4 h-4" />
                          Disconnect Wallet
                        </button>
                      </div>
                      </motion.div>
                    </motion.div>
                  </AnimatePresence>,
                  document.body
                )}
              </div>
            )}
          </div>

          {/* Mobile Actions */}
          <div className="md:hidden flex items-center gap-2">
            {/* Mobile Theme Toggle - Only show when not in wallet section */}
            {!shouldShowWalletNavigation && <ThemeToggle isMobile />}
            
            {/* Mobile Wallet Button */}
            {isWalletConnected && (
              <Button 
                onClick={() => setShowDropdown(!showDropdown)}
                className="bg-gray-800 hover:bg-gray-700 text-white border border-gray-600 p-2 rounded-lg transition-all duration-200 flex items-center gap-1"
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
            )}
            
            <Button
              data-mobile-menu-trigger
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              variant="ghost"
              size="sm"
              className="text-gray hover:bg-gray-800 p-2"
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
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="md:hidden border-t border-border py-4 overflow-hidden"
            >
              <nav className="flex flex-col space-y-2">
                {shouldShowWalletNavigation ? (
                  // Mobile Wallet Navigation
                  walletNavItems.map((item) => {
                    const colors = getWalletTabColor(item.id);
                    return (
                    <motion.button
                      key={item.id}
                      onClick={() => handleWalletNavClick(item.id as any)}
                      className={`relative flex items-center gap-3 px-4 py-4 mx-2 text-base font-medium rounded-xl transition-all duration-300 text-left ${
                        activeWalletTab === item.id
                          ? `text-white bg-gradient-to-r ${colors.active} shadow-lg`
                          : `${colors.text} hover:text-white ${colors.hover}`
                      }`}
                      whileHover={{ 
                        scale: 1.02,
                        x: 5
                      }}
                      whileTap={{ 
                        scale: 0.98,
                        x: 0
                      }}
                      initial={false}
                      animate={activeWalletTab === item.id ? {
                        boxShadow: [
                          `0 4px 14px 0 ${item.id === 'home' ? 'rgba(59, 130, 246, 0.25)' : 
                                         item.id === 'portfolio' ? 'rgba(16, 185, 129, 0.25)' :
                                         item.id === 'trade' ? 'rgba(249, 115, 22, 0.25)' :
                                         item.id === 'social' ? 'rgba(236, 72, 153, 0.25)' :
                                         'rgba(99, 102, 241, 0.25)'}`,
                          `0 6px 20px 0 ${item.id === 'home' ? 'rgba(59, 130, 246, 0.4)' : 
                                         item.id === 'portfolio' ? 'rgba(16, 185, 129, 0.4)' :
                                         item.id === 'trade' ? 'rgba(249, 115, 22, 0.4)' :
                                         item.id === 'social' ? 'rgba(236, 72, 153, 0.4)' :
                                         'rgba(99, 102, 241, 0.4)'}`,
                          `0 4px 14px 0 ${item.id === 'home' ? 'rgba(59, 130, 246, 0.25)' : 
                                         item.id === 'portfolio' ? 'rgba(16, 185, 129, 0.25)' :
                                         item.id === 'trade' ? 'rgba(249, 115, 22, 0.25)' :
                                         item.id === 'social' ? 'rgba(236, 72, 153, 0.25)' :
                                         'rgba(99, 102, 241, 0.25)'}`
                        ]
                      } : {}}
                      transition={{
                        boxShadow: { duration: 2, repeat: Infinity },
                        layout: { duration: 0.3 }
                      }}
                    >
                      <motion.div
                        animate={activeWalletTab === item.id ? {
                          rotate: [0, 5, -5, 0]
                        } : {}}
                        transition={{ duration: 0.5 }}
                      >
                        {item.icon}
                      </motion.div>
                      {item.label}
                      {activeWalletTab === item.id && (
                        <motion.div
                          className={`absolute left-0 top-1/2 w-1 h-8 rounded-r-full ${
                            item.id === 'home' ? 'bg-blue-400' : 
                            item.id === 'portfolio' ? 'bg-emerald-400' :
                            item.id === 'trade' ? 'bg-orange-400' :
                            item.id === 'social' ? 'bg-pink-400' :
                            'bg-indigo-400'
                          }`}
                          layoutId="activeMobileWalletTab"
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        />
                      )}
                    </motion.button>
                    );
                  })
                ) : (
                  // Mobile Regular Navigation
                  <>
                    <motion.button
                      onClick={() => handleNavClick('about')}
                      className={`relative flex items-center px-4 py-4 mx-2 text-base font-medium rounded-xl transition-all duration-300 text-left ${
                        activeTab === 'about'
                          ? 'text-white bg-gradient-to-r from-cyan-500 to-blue-500 shadow-lg shadow-cyan-500/25'
                          : 'text-cyan-400 hover:text-white hover:bg-cyan-500/20 hover:shadow-lg hover:shadow-cyan-500/25'
                      }`}
                      whileHover={{ 
                        scale: 1.02,
                        x: 5
                      }}
                      whileTap={{ 
                        scale: 0.98,
                        x: 0
                      }}
                      initial={false}
                      animate={activeTab === 'about' ? {
                        boxShadow: [
                          "0 4px 14px 0 rgba(6, 182, 212, 0.25)",
                          "0 6px 20px 0 rgba(6, 182, 212, 0.4)",
                          "0 4px 14px 0 rgba(6, 182, 212, 0.25)"
                        ]
                      } : {}}
                      transition={{
                        boxShadow: { duration: 2, repeat: Infinity },
                        layout: { duration: 0.3 }
                      }}
                    >
                      About
                      {activeTab === 'about' && (
                        <motion.div
                          className="absolute left-0 top-1/2 w-1 h-8 bg-cyan-400 rounded-r-full"
                          layoutId="activeMobileMainTab"
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        />
                      )}
                    </motion.button>

                    <motion.button
                      onClick={() => handleNavClick('rebalance')}
                      className={`relative flex items-center px-4 py-4 mx-2 text-base font-medium rounded-xl transition-all duration-300 text-left ${
                        activeTab === 'rebalance'
                          ? 'text-white bg-gradient-to-r from-cyan-500 to-blue-500 shadow-lg shadow-cyan-500/25'
                          : 'text-emerald-400 hover:text-white hover:bg-emerald-500/20 hover:shadow-lg hover:shadow-emerald-500/25'
                      }`}
                      whileHover={{ 
                        scale: 1.02,
                        x: 5
                      }}
                      whileTap={{ 
                        scale: 0.98,
                        x: 0
                      }}
                      initial={false}
                      animate={activeTab === 'rebalance' ? {
                        boxShadow: [
                          "0 4px 14px 0 rgba(6, 182, 212, 0.25)",
                          "0 6px 20px 0 rgba(6, 182, 212, 0.4)",
                          "0 4px 14px 0 rgba(6, 182, 212, 0.25)"
                        ]
                      } : {}}
                      transition={{
                        boxShadow: { duration: 2, repeat: Infinity },
                        layout: { duration: 0.3 }
                      }}
                    >
                      Rebalance
                      {activeTab === 'rebalance' && (
                        <motion.div
                          className="absolute left-0 top-1/2 w-1 h-8 bg-cyan-400 rounded-r-full"
                          layoutId="activeMobileMainTab"
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        />
                      )}
                    </motion.button>

                    <motion.button
                      onClick={() => handleNavClick('top-performers')}
                      className={`relative flex items-center px-4 py-4 mx-2 text-base font-medium rounded-xl transition-all duration-300 text-left ${
                        activeTab === 'top-performers'
                          ? 'text-white bg-gradient-to-r from-cyan-500 to-blue-500 shadow-lg shadow-cyan-500/25'
                          : 'text-amber-400 hover:text-white hover:bg-amber-500/20 hover:shadow-lg hover:shadow-amber-500/25'
                      }`}
                      whileHover={{ 
                        scale: 1.02,
                        x: 5
                      }}
                      whileTap={{ 
                        scale: 0.98,
                        x: 0
                      }}
                      initial={false}
                      animate={activeTab === 'top-performers' ? {
                        boxShadow: [
                          "0 4px 14px 0 rgba(6, 182, 212, 0.25)",
                          "0 6px 20px 0 rgba(6, 182, 212, 0.4)",
                          "0 4px 14px 0 rgba(6, 182, 212, 0.25)"
                        ]
                      } : {}}
                      transition={{
                        boxShadow: { duration: 2, repeat: Infinity },
                        layout: { duration: 0.3 }
                      }}
                    >
                      Top Performers
                      {activeTab === 'top-performers' && (
                        <motion.div
                          className="absolute left-0 top-1/2 w-1 h-8 bg-cyan-400 rounded-r-full"
                          layoutId="activeMobileMainTab"
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        />
                      )}
                    </motion.button>
                  </>
                )}

                {/* Mobile Connect Wallet or Wallet Actions */}
                {!isWalletConnected ? (
                  <div className="px-4 pt-2">
                    <Button 
                      onClick={connectWallet}
                      disabled={isConnecting}
                      className="w-full bg-gradient-to-r from-teal-400 via-cyan-400 to-indigo-500 hover:from-teal-500 hover:via-cyan-500 hover:to-indigo-600 text-black py-3 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                      {isConnecting ? (
                        <>
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                            className="w-4 h-4 border-2 border-black border-t-transparent rounded-full"
                          />
                          Connecting...
                        </>
                      ) : (
                        <>
                          <Wallet className="w-4 h-4" />
                          Connect Wallet
                        </>
                      )}
                    </Button>
                  </div>
                ) : (
                  <div className="px-4 pt-2 space-y-2">
                    <div className="p-3 rounded-lg bg-accent/30">
                      <div className="text-sm text-muted-foreground mb-1">Wallet Address</div>
                      <div className="text-xs font-mono break-all text-foreground">
                        {walletAddress}
                      </div>
                    </div>
                    <button
                      onClick={copyAddress}
                      className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm bg-accent hover:bg-accent/80 text-accent-foreground rounded-lg transition-colors duration-200"
                    >
                      {copied ? (
                        <>
                          <Check className="w-4 h-4 text-green-500" />
                          <span className="text-green-500">Copied!</span>
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
                      className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-lg transition-colors duration-200"
                    >
                      <LogOut className="w-4 h-4" />
                      Disconnect Wallet
                    </button>
                  </div>
                )}
              </nav>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </header>
  );
}