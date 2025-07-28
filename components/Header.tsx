import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { Button } from "./ui/button";
import { ThemeToggle } from "./ui/theme-toggle";
import { useIsMobile } from "./ui/use-mobile";
import logoImage from 'figma:asset/4ec3ac8d40639284c043d1d5a8d06d0449713468.png';
import { Wallet, Copy, LogOut, Check, Menu, X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner@2.0.3";

interface HeaderProps {
  activeTab: 'home' | 'about' | 'rebalance' | 'dashboard' | 'top-performers';
  onTabChange: (tab: 'home' | 'about' | 'rebalance' | 'dashboard' | 'top-performers') => void;
}

export function Header({ activeTab, onTabChange }: HeaderProps) {
  const [isWalletConnected, setIsWalletConnected] = useState(false);
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

  // Funzione per simulare la connessione del wallet
  const connectWallet = async () => {
    try {
      setIsConnecting(true);
      // Simula un delay per la connessione
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Simula la connessione del wallet (in un'app reale useresti Web3 o wallet provider)
      const mockAddress = "0x" + Math.random().toString(16).substring(2, 42);
      setWalletAddress(mockAddress);
      setIsWalletConnected(true);
      
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

  // Funzione per disconnettere il wallet
  const disconnectWallet = () => {
    console.log('Disconnecting wallet');
    setIsWalletConnected(false);
    setWalletAddress("");
    setShowDropdown(false);
    setShowMobileMenu(false);
    setCopied(false);
    
    toast.info("Wallet disconnected", {
      description: "Your wallet has been disconnected successfully",
      duration: 2000,
    });
  };

  // Funzione per abbreviare l'indirizzo
  const shortenAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  // Funzione per determinare se l'API Clipboard è effettivamente utilizzabile
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

  // Funzione per copiare l'indirizzo con strategia intelligente
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

    // Fallback con textarea e execCommand
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

    // Fallback visuale per copia manuale
    console.info('Using visual fallback for manual copy');
    showManualCopyDialog();
  };

  // Funzione separata per mostrare il dialog di copia manuale
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
  const handleNavClick = (tab: 'home' | 'about' | 'rebalance' | 'dashboard' | 'top-performers') => {
    onTabChange(tab);
    setShowMobileMenu(false);
  };

  // Chiudi dropdown quando si clicca fuori
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

  // Calcola la posizione del dropdown
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

  // Aggiorna la posizione quando il dropdown si apre
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

  return (
    <header className="w-full border-b border-border backdrop-blur-sm relative z-50 transition-colors duration-300" style={{ backgroundColor: 'var(--header-bg)' }}>
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
        <div className="flex items-center justify-between h-26 sm:h-20">
          {/* Logo */}
          <div className="flex items-center">
            <button
              onClick={() => handleNavClick('home')}
              className="transition-opacity duration-200 hover:opacity-80 cursor-pointer bg-transparent border-none p-0 m-0 flex-shrink-0"
              type="button"
            >
              <img 
                src={logoImage} 
                alt="1balancer" 
                className="h-45 w-auto"
              />
            </button>
          </div>
          
          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-6 lg:space-x-8">
            <button
              onClick={() => handleNavClick('about')}
              className={`px-3 py-2 text-sm lg:text-base transition-colors duration-200 ${
                activeTab === 'about'
                  ? 'text-foreground border-b-2 border-cyan-400'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              About
            </button>
            <button
              onClick={() => handleNavClick('rebalance')}
              className={`px-3 py-2 text-sm lg:text-base transition-colors duration-200 ${
                activeTab === 'rebalance'
                  ? 'text-foreground border-b-2 border-cyan-400'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Rebalance
            </button>
            <button
              onClick={() => handleNavClick('dashboard')}
              className={`px-3 py-2 text-sm lg:text-base transition-colors duration-200 ${
                activeTab === 'dashboard'
                  ? 'text-foreground border-b-2 border-cyan-400'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Dashboard
            </button>
            <button
              onClick={() => handleNavClick('top-performers')}
              className={`px-3 py-2 text-sm lg:text-base transition-colors duration-200 ${
                activeTab === 'top-performers'
                  ? 'text-foreground border-b-2 border-cyan-400'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Top Performers
            </button>
          </nav>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-3 relative">
            {/* Theme Toggle */}
            <ThemeToggle />
            
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
            {/* Mobile Theme Toggle */}
            <ThemeToggle isMobile />
            
            {/* Mobile Wallet Button */}
            {isWalletConnected && (
              <Button 
                onClick={() => setShowDropdown(!showDropdown)}
                className="bg-gray-800 hover:bg-gray-700 text-white border border-gray-600 p-2 rounded-lg transition-all duration-200 flex items-center gap-1"
                size="sm"
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
      </div>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {showMobileMenu && (
          <motion.div
            data-mobile-menu
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="md:hidden absolute top-full left-0 right-0 backdrop-blur-lg border-b border-border shadow-xl z-50" 
            style={{ backgroundColor: 'var(--header-bg)' }}
          >
            <div className="px-3 py-4 space-y-3">
              {/* Navigation Links */}
              <div className="space-y-2">
                <button
                  onClick={() => handleNavClick('about')}
                  className={`w-full text-left px-4 py-3 rounded-lg text-base transition-colors duration-200 ${
                    activeTab === 'about'
                      ? 'bg-cyan-500/20 text-cyan-400 border-l-4 border-cyan-400'
                      : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                  }`}
                >
                  About
                </button>
                <button
                  onClick={() => handleNavClick('rebalance')}
                  className={`w-full text-left px-4 py-3 rounded-lg text-base transition-colors duration-200 ${
                    activeTab === 'rebalance'
                      ? 'bg-cyan-500/20 text-cyan-400 border-l-4 border-cyan-400'
                      : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                  }`}
                >
                  Rebalance
                </button>
                <button
                  onClick={() => handleNavClick('dashboard')}
                  className={`w-full text-left px-4 py-3 rounded-lg text-base transition-colors duration-200 ${
                    activeTab === 'dashboard'
                      ? 'bg-cyan-500/20 text-cyan-400 border-l-4 border-cyan-400'
                      : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                  }`}
                >
                  Dashboard
                </button>
                <button
                  onClick={() => handleNavClick('top-performers')}
                  className={`w-full text-left px-4 py-3 rounded-lg text-base transition-colors duration-200 ${
                    activeTab === 'top-performers'
                      ? 'bg-cyan-500/20 text-cyan-400 border-l-4 border-cyan-400'
                      : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                  }`}
                >
                  Top Performers
                </button>
              </div>

              {/* Wallet Section */}
              <div className="pt-3 border-t border-gray-700">
                {!isWalletConnected ? (
                  <Button 
                    onClick={() => {
                      connectWallet();
                      setShowMobileMenu(false);
                    }}
                    disabled={isConnecting}
                    className="w-full bg-gradient-to-r from-teal-400 via-cyan-400 to-indigo-500 hover:from-teal-500 hover:via-cyan-500 hover:to-indigo-600 text-black py-3 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-70 text-base"
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
                ) : (
                  <div className="space-y-2">
                    <div className="bg-gray-800/50 rounded-lg p-3 border border-gray-700">
                      <div className="text-xs text-gray-400 mb-1">Connected Wallet</div>
                      <div className="text-white text-sm font-mono">{shortenAddress(walletAddress)}</div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => {
                          copyAddress();
                          setShowMobileMenu(false);
                        }}
                        variant="outline"
                        size="sm"
                        className="flex-1 text-white border-gray-600 hover:bg-gray-800"
                      >
                        <Copy className="w-4 h-4 mr-2" />
                        Copy
                      </Button>
                      <Button
                        onClick={() => {
                          disconnectWallet();
                          setShowMobileMenu(false);
                        }}
                        variant="outline"
                        size="sm"
                        className="flex-1 text-red-400 border-gray-600 hover:bg-gray-800"
                      >
                        <LogOut className="w-4 h-4 mr-2" />
                        Disconnect
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}