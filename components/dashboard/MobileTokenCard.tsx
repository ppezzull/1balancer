import { memo } from 'react';
import { motion } from 'motion/react';
import { Badge } from '../ui/badge';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { TokenAvatar } from './TokenAvatar';
import { useTheme } from '../ui/use-theme';
import type { TokenHolding } from '../../utils/constants';

interface MobileTokenCardProps {
  token: TokenHolding;
  index: number;
  isInView: boolean;
}

export const MobileTokenCard = memo(({ token, index, isInView }: MobileTokenCardProps) => {
  const { isDark } = useTheme();
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.4, delay: index * 0.05 }}
      className="rounded-lg p-4 border transition-colors duration-300"
      style={{ 
        backgroundColor: isDark ? 'rgba(31, 41, 55, 0.3)' : 'rgba(255, 255, 255, 0.8)',
        borderColor: isDark ? '#374151' : 'var(--border-light)'
      }}
    >
    <div className="flex items-center justify-between mb-3">
      <div className="flex items-center gap-3">
        <TokenAvatar symbol={token.symbol} />
        <div>
          <div className="font-medium text-foreground transition-colors duration-300">{token.symbol}</div>
          <div className="text-xs text-muted-foreground transition-colors duration-300">{token.name}</div>
        </div>
      </div>
      <Badge 
        variant="secondary" 
        className={`text-xs transition-colors duration-300 ${
          isDark 
            ? "bg-blue-900/30 text-blue-300 border-blue-700"
            : "bg-blue-100 text-blue-700 border-blue-300"
        }`}
      >
        {token.network}
      </Badge>
    </div>
    
    <div className="grid grid-cols-2 gap-3 text-sm">
      <div>
        <div className="text-muted-foreground text-xs transition-colors duration-300">Balance</div>
        <div className="text-foreground font-mono transition-colors duration-300">{token.balance} {token.symbol}</div>
      </div>
      <div>
        <div className="text-muted-foreground text-xs transition-colors duration-300">Value</div>
        <div className="text-foreground font-mono transition-colors duration-300">{token.value}</div>
      </div>
      <div>
        <div className="text-muted-foreground text-xs transition-colors duration-300">P&L</div>
        <div className={`font-mono ${token.isPositive ? 'text-green-400' : 'text-red-400'}`}>
          {token.pnl}
        </div>
      </div>
      <div>
        <div className="text-muted-foreground text-xs transition-colors duration-300">ROI</div>
        <div className={`font-mono flex items-center gap-1 ${token.isPositive ? 'text-green-400' : 'text-red-400'}`}>
          {token.isPositive ? 
            <TrendingUp className="w-3 h-3" /> : 
            <TrendingDown className="w-3 h-3" />
          }
          {token.roi}
        </div>
      </div>
    </div>
  </motion.div>
  );
});

MobileTokenCard.displayName = 'MobileTokenCard';