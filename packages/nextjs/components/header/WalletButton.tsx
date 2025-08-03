import { useRef } from "react";
import { motion } from "motion/react";
import { Button } from "../ui/button";
import { Wallet } from "lucide-react";

interface WalletButtonProps {
  isWalletConnected: boolean;
  isConnecting: boolean;
  connectWallet: () => void;
  showDropdown: boolean;
  setShowDropdown: (show: boolean) => void;
  walletAddress: string;
  shortenAddress: (address: string) => string;
  buttonContainerRef: React.RefObject<HTMLDivElement>;
  buttonWrapperRef: React.RefObject<HTMLDivElement>;
}

export function WalletButton({
  isWalletConnected,
  isConnecting,
  connectWallet,
  showDropdown,
  setShowDropdown,
  walletAddress,
  shortenAddress,
  buttonContainerRef,
  buttonWrapperRef
}: WalletButtonProps) {
  if (!isWalletConnected) {
    return (
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
    );
  }

  return (
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
    </div>
  );
}