import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "~~/components/shared/button";
import { ThemeToggle } from "~~/components/shared/theme-toggle";
import { useIsMobile } from "~~/components/shared/use-mobile";
import { Menu, X } from "lucide-react";
import { motion } from "motion/react";
import { NavigationTabs } from "./header/NavigationTabs";
import { WalletButton } from "./header/WalletButton";
import { WalletDropdown } from "./header/WalletDropdown";
import { MobileMenu } from "./header/MobileMenu";
import { useWalletConnection } from "./header/hooks/useWalletConnection";

interface HeaderProps {
  activeTab: 'home' | 'about' | 'rebalance' | 'top-performers';
  onTabChange: (tab: 'home' | 'about' | 'rebalance' | 'top-performers') => void;
  activeWalletTab?: 'home' | 'portfolio' | 'trade' | 'social' | 'profile';
  onWalletTabChange?: (tab: 'home' | 'portfolio' | 'trade' | 'social' | 'profile') => void;
  isWalletConnected?: boolean;
  showWalletNavigation?: boolean;
}

export function Header({ 
  activeTab, 
  onTabChange, 
  activeWalletTab = 'home', 
  onWalletTabChange, 
  isWalletConnected: propIsWalletConnected,
  showWalletNavigation = false
}: HeaderProps) {
  const [showDropdown, setShowDropdown] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [copied, setCopied] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });
  
  const buttonContainerRef = useRef<HTMLDivElement>(null);
  const buttonWrapperRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();

  const {
    isWalletConnected,
    walletAddress,
    isConnecting,
    connectWallet,
    disconnectWallet,
    shortenAddress
  } = useWalletConnection(propIsWalletConnected);

  // Handle navigation clicks
  const handleNavClick = useCallback((tab: 'home' | 'about' | 'rebalance' | 'top-performers') => {
    onTabChange(tab);
    setShowMobileMenu(false);
  }, [onTabChange]);

  // Handle wallet navigation clicks
  const handleWalletNavClick = useCallback((tab: 'home' | 'portfolio' | 'trade' | 'social' | 'profile') => {
    if (onWalletTabChange) {
      onWalletTabChange(tab);
    }
    setShowMobileMenu(false);
  }, [onWalletTabChange]);

  // Close dropdown when clicking outside
  useEffect(() => {
    if (!showDropdown) return;

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      
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
  const updateDropdownPosition = useCallback(() => {
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
  }, [isMobile]);

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
  }, [showDropdown, updateDropdownPosition]);

  // Copy address function for mobile
  const copyAddress = async () => {
    try {
      await navigator.clipboard.writeText(walletAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy address:', error);
    }
  };

  // Determine which navigation to show
  const shouldShowWalletNavigation = showWalletNavigation && isWalletConnected;

  return (
    <header className="fixed top-0 left-0 right-0 w-full border-b border-border backdrop-blur-sm z-50 transition-colors duration-300" style={{ backgroundColor: 'var(--header-bg)' }}>
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
                src={"/logo.png"} 
                alt="1balancer" 
                className="h-40 w-auto"
              />
            </button>
          </div>
          
          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-6 lg:space-x-8">
            <NavigationTabs
              shouldShowWalletNavigation={shouldShowWalletNavigation}
              activeTab={activeTab}
              activeWalletTab={activeWalletTab}
              handleNavClick={handleNavClick}
              handleWalletNavClick={handleWalletNavClick}
            />
          </nav>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-3 relative">
            {/* Theme Toggle - Only show when not in wallet section */}
            {!shouldShowWalletNavigation && <ThemeToggle />}
            
            {/* Wallet Button */}
            <WalletButton
              isWalletConnected={isWalletConnected}
              isConnecting={isConnecting}
              connectWallet={connectWallet}
              showDropdown={showDropdown}
              setShowDropdown={setShowDropdown}
              walletAddress={walletAddress}
              shortenAddress={shortenAddress}
              buttonContainerRef={buttonContainerRef}
              buttonWrapperRef={buttonWrapperRef}
            />
            
            {/* Wallet Dropdown */}
            <WalletDropdown
              showDropdown={showDropdown}
              setShowDropdown={setShowDropdown}
              walletAddress={walletAddress}
              copied={copied}
              setCopied={setCopied}
              setShowMobileMenu={setShowMobileMenu}
              disconnectWallet={disconnectWallet}
              dropdownPosition={dropdownPosition}
              isMobile={isMobile}
            />
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
              className="text-foreground hover:bg-accent p-2 relative"
            >
              {showMobileMenu ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        <div data-mobile-menu>
          <MobileMenu
            showMobileMenu={showMobileMenu}
            shouldShowWalletNavigation={shouldShowWalletNavigation}
            activeTab={activeTab}
            activeWalletTab={activeWalletTab}
            isWalletConnected={isWalletConnected}
            isConnecting={isConnecting}
            walletAddress={walletAddress}
            showDropdown={showDropdown}
            copied={copied}
            handleNavClick={handleNavClick}
            handleWalletNavClick={handleWalletNavClick}
            connectWallet={connectWallet}
            copyAddress={copyAddress}
            disconnectWallet={disconnectWallet}
            shortenAddress={shortenAddress}
          />
        </div>
      </div>
    </header>
  );
}