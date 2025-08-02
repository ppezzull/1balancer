import { useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "motion/react";
import { Wallet, Copy, LogOut, Check } from "lucide-react";
import { toast } from "sonner@2.0.3";

interface WalletDropdownProps {
  showDropdown: boolean;
  setShowDropdown: (show: boolean) => void;
  walletAddress: string;
  copied: boolean;
  setCopied: (copied: boolean) => void;
  setShowMobileMenu: (show: boolean) => void;
  disconnectWallet: () => void;
  dropdownPosition: { top: number; left: number };
  isMobile: boolean;
}

export function WalletDropdown({
  showDropdown,
  setShowDropdown,
  walletAddress,
  copied,
  setCopied,
  setShowMobileMenu,
  disconnectWallet,
  dropdownPosition,
  isMobile
}: WalletDropdownProps) {
  const dropdownRef = useRef<HTMLDivElement>(null);

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

  if (!showDropdown) return null;

  return createPortal(
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
  );
}