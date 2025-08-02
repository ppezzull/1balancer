import { memo } from 'react';
import { motion } from 'motion/react';
import { Button } from '../ui/button';
import { useTheme } from '../ui/use-theme';
import { 
  Search, 
  Settings, 
  MoreHorizontal, 
  Copy, 
  ExternalLink, 
  Eye, 
  EyeOff, 
  TrendingUp, 
  RefreshCw 
} from 'lucide-react';
import { WALLET_CONFIG } from '~~/utils/constants';
import { copyWalletAddress, generateWalletAvatar } from '~~/utils/dashboard-helpers';

interface WalletHeaderProps {
  isInView: boolean;
  isBalanceVisible: boolean;
  onToggleBalance: () => void;
  isMobile: boolean;
}

export const WalletHeader = memo(({ 
  isInView, 
  isBalanceVisible, 
  onToggleBalance, 
  isMobile 
}: WalletHeaderProps) => {
  const { isDark } = useTheme();
  return (
    <section className="py-4 sm:py-8 px-3 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="flex items-center justify-between mb-4 sm:mb-8"
        >
          <div className="flex items-center gap-2 sm:gap-4">
            <Button 
              variant="ghost" 
              size="sm" 
              className={`text-sm transition-colors duration-200 ${
                isDark 
                  ? "text-gray-400 hover:text-white hover:bg-gray-800"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              }`}
            >
              ← Portfolio
            </Button>
          </div>
          <div className="flex items-center gap-1 sm:gap-2">
            <Button 
              variant="ghost" 
              size="sm" 
              className={`transition-colors duration-200 ${
                isDark 
                  ? "text-gray-400 hover:text-white hover:bg-gray-800"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              }`}
            >
              <Search className="w-4 h-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              className={`transition-colors duration-200 ${
                isDark 
                  ? "text-gray-400 hover:text-white hover:bg-gray-800"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              }`}
            >
              <Settings className="w-4 h-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              className={`transition-colors duration-200 ${
                isDark 
                  ? "text-gray-400 hover:text-white hover:bg-gray-800"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              }`}
            >
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.2 }}
          className={`flex items-center gap-3 sm:gap-6 mb-4 sm:mb-8 ${isMobile ? 'flex-col sm:flex-row' : ''}`}
        >
          {generateWalletAvatar(isMobile)}
          <div className={`flex-1 ${isMobile ? 'text-center sm:text-left' : ''}`}>
            <div className="flex items-center gap-2 sm:gap-3 mb-2 justify-center sm:justify-start flex-wrap">
              <span className="text-muted-foreground text-base sm:text-lg transition-colors duration-300">{WALLET_CONFIG.address}</span>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={copyWalletAddress} 
                className={`transition-colors duration-200 ${
                  isDark 
                    ? "text-gray-400 hover:text-white hover:bg-gray-800"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                }`}
              >
                <Copy className="w-4 h-4" />
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                className={`transition-colors duration-200 ${
                  isDark 
                    ? "text-gray-400 hover:text-white hover:bg-gray-800"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                }`}
              >
                <ExternalLink className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex items-center gap-2 sm:gap-4 justify-center sm:justify-start flex-wrap">
              <div className={`font-bold text-foreground transition-colors duration-300 ${isMobile ? 'text-3xl sm:text-4xl' : 'text-5xl'}`}>
                {isBalanceVisible ? WALLET_CONFIG.totalValue : "••••••"}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={onToggleBalance}
                className={`transition-colors duration-200 ${
                  isDark 
                    ? "text-gray-400 hover:text-white hover:bg-gray-800"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                }`}
              >
                {isBalanceVisible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
              </Button>
            </div>
            <div className="flex items-center gap-2 text-green-400 mt-2 justify-center sm:justify-start flex-wrap text-sm sm:text-base">
              <TrendingUp className="w-4 h-4" />
              <span>+$2,847.23 (+24.37%)</span>
              <span className={`transition-colors duration-300 ${
                isDark ? "text-gray-500" : "text-gray-400"
              }`}>Last update 20 sec. ago</span>
              <RefreshCw className={`w-3 h-3 transition-colors duration-300 ${
                isDark ? "text-gray-500" : "text-gray-400"
              }`} />
            </div>
          </div>
          {!isMobile && (
            <Button className={`px-6 text-white transition-colors duration-200 ${
              isDark 
                ? "bg-blue-600 hover:bg-blue-700" 
                : "bg-blue-500 hover:bg-blue-600"
            }`}>
              Add wallet
            </Button>
          )}
        </motion.div>

        {isMobile && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="mb-6"
          >
            <Button className={`w-full text-white py-3 transition-colors duration-200 ${
              isDark 
                ? "bg-blue-600 hover:bg-blue-700" 
                : "bg-blue-500 hover:bg-blue-600"
            }`}>
              Add wallet
            </Button>
          </motion.div>
        )}
      </div>
    </section>
  );
});

WalletHeader.displayName = 'WalletHeader';